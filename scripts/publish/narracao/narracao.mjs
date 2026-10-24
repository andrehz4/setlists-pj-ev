// Narração do reel semanal (módulo apartado, desligado sem REEL_NARRACAO=1 e
// ELEVENLABS_API_KEY). Fluxo: gera a fala de cada cena -> mede a duração ->
// cada cena passa a durar o tempo da sua fala (texto e voz sincronizados) ->
// depois do render, mistura as falas com a trilha abaixando a música.
// Qualquer falha devolve null e o reel sai como antes, só com música.

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { falasDasCenas, ABERTURAS, FINAIS } from "./fala.mjs";
import { sintetizar, vozDaSemana, saldo } from "./elevenlabs.mjs";
import { chavesEmOrdem, erroDeConta } from "./chaves.mjs";
import { naRaiz } from "../../config.mjs";

// Abertura e encerramento são sempre iguais: gerados 1x por voz e guardados no
// repo (vão no mesmo commit do reel). Nome leva hash do texto: mudou a frase,
// gera de novo sozinho. Economiza crédito do ElevenLabs toda semana.
export const DIR_FIXAS = naRaiz("media/news/instagram-reels/narracao");
export function arquivoFixo(texto, voz, dir = DIR_FIXAS) {
  const tipo = ABERTURAS.includes(texto) ? "abertura" : FINAIS.includes(texto) ? "final" : null;
  if (!tipo) return null;
  const h = createHash("sha1").update(`${voz.id}|${texto}`).digest("hex").slice(0, 8);
  return path.join(dir, `${voz.nome.toLowerCase()}-${tipo}-${h}.mp3`);
}

// Folga depois da fala (a manchete fica um instante na tela) e limites.
const FOLGA = { coldopen: 0.5, outro: 0.6, bloco: 0.8 };
const MIN = { coldopen: 3.0, outro: 2.5, bloco: 3.5 };
const MAX_BLOCO = 9.0;
const FOLGA_MIN = 0.3; // fala longa: respiro mínimo antes da próxima voz
const INICIO_FALA = 0.25; // a voz entra logo depois do corte
export const MUSICA_LUFS = -24; // trilha normalizada nesse volume no reel narrado (cada trilha vem num volume)

export function narracaoLigada(env = process.env) {
  return env.REEL_NARRACAO === "1" && chavesEmOrdem(env).length > 0;
}

export function duracaoAudio(arquivo) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo], { encoding: "utf8" });
  const d = Number(r.stdout.trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`duração inválida: ${arquivo}`);
  return d;
}

// Duração de cada cena a partir das falas (sceneIndex -> segundos de fala).
export function duracoesSincronizadas(scenes, durFala) {
  return scenes.map((s, i) => {
    const tipo = s.kind === "coldopen" || s.kind === "outro" ? s.kind : "bloco";
    const fala = durFala.get(i);
    if (fala == null) return s.dur;
    const d = Math.max(MIN[tipo], INICIO_FALA + fala + FOLGA[tipo]);
    // O teto só come a folga, nunca a fala: cortar a cena no meio da voz fazia a próxima falar por cima
    // (bug 18/10/2026, scripts/regressao/fala-sobreposta.test.mjs).
    return tipo === "bloco" ? Math.max(Math.min(d, MAX_BLOCO), INICIO_FALA + fala + FOLGA_MIN) : d;
  });
}

// Gera as falas. Devolve null (desligada), { aviso } (pulou: sem saldo ou erro,
// o reel sai só com música e o aviso vai pro Telegram) ou
// { voz, falas: [{ sceneIndex, texto, arquivo, dur }], sceneDurs, aviso }.
export async function prepararNarracao(scenes, { weekKey, tmpDir, env = process.env, sintetizarImpl = sintetizar,
  duracaoImpl = duracaoAudio, dirFixas = DIR_FIXAS, saldoImpl = saldo }) {
  if (!narracaoLigada(env)) return null;
  const voz = vozDaSemana(weekKey);
  try {
    const dir = path.join(tmpDir, "narracao");
    await fs.mkdir(dir, { recursive: true });
    const plano = [];
    for (const f of falasDasCenas(scenes, weekKey)) {
      const fixo = arquivoFixo(f.texto, voz, dirFixas);
      const arquivo = fixo || path.join(dir, `fala_${String(f.sceneIndex).padStart(2, "0")}.mp3`);
      const pronta = Boolean(fixo) && await fs.stat(fixo).then(() => true, () => false);
      plano.push({ ...f, fixo, arquivo, pronta });
    }
    // Saldo checado ANTES de gastar (ou narra a semana inteira, ou nada), conta por conta: a principal sem saldo
    // não deixa mais o reel mudo com crédito sobrando em outra (bug 19/10/2026, scripts/regressao/).
    const precisa = plano.filter((f) => !f.pronta).reduce((n, f) => n + f.texto.length, 0);
    let usada = null, conta = null, motivo = "nenhuma chave";
    for (const c of chavesEmOrdem(env)) {
      const s = await saldoImpl({ apiKey: c.chave });
      if (s && s.restante < precisa) { motivo = `${c.nome}: precisa ${precisa}, restam ${s.restante} de ${s.limite}`; continue; }
      try {
        for (const f of plano) {
          if (f.pronta) continue;
          if (f.fixo) await fs.mkdir(path.dirname(f.fixo), { recursive: true });
          await sintetizarImpl(f.texto, { vozId: voz.id, apiKey: c.chave, destino: f.arquivo });
        }
        usada = c; conta = s; break;
      } catch (e) {
        if (!erroDeConta(e)) throw e;
        motivo = `${c.nome}: ${e.message.slice(0, 80)}`;
      }
    }
    if (!usada) {
      const aviso = `reel saiu SEM voz: faltou crédito no ElevenLabs (${motivo})`;
      console.warn(`[narracao] ${aviso}`);
      return { aviso };
    }
    for (const f of plano) f.dur = duracaoImpl(f.arquivo);
    const falas = plano.map(({ sceneIndex, texto, arquivo, dur }) => ({ sceneIndex, texto, arquivo, dur }));
    const sceneDurs = duracoesSincronizadas(scenes, new Map(falas.map((f) => [f.sceneIndex, f.dur])));
    const reaproveitadas = plano.filter((f) => f.pronta).length;
    const restante = conta ? conta.restante - precisa : null;
    console.log(`[narracao] voz ${voz.nome}: ${falas.length} falas (${reaproveitadas} reaproveitadas, ${precisa} caracteres gastos), reel de ${sceneDurs.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    const aviso = `voz: ${voz.nome}${usada.nome !== "principal" ? ` (conta ${usada.nome})` : ""}${restante != null ? ` · restam ~${restante} créditos no ElevenLabs` : ""}`;
    return { voz, falas, sceneDurs, aviso };
  } catch (e) {
    const aviso = `reel saiu SEM voz: narração falhou (${e.message.slice(0, 120)})`;
    console.warn(`[narracao] ${aviso}`);
    return { aviso };
  }
}

// Filtro do ffmpeg: música abaixa quando a voz entra (sidechain) e volta depois.
export function filtroMixagem(falas, inicios) {
  const vozes = falas.map((f, k) => {
    const ms = Math.round((inicios[f.sceneIndex] + INICIO_FALA) * 1000);
    return `[${k + 1}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[f${k}]`;
  });
  // A chave do ducking é estendida com silêncio (apad): sem isso o sidechaincompress acaba junto com a última fala.
  const junta = `${falas.map((_, k) => `[f${k}]`).join("")}amix=inputs=${falas.length}:normalize=0,volume=1.8,asplit=2[voz][ch];[ch]apad[chave]`;
  // Reel todo narrado: a música vira cama. Trilha normalizada baixa + ducking forte quando a voz fala (antes a música ficava
  // 2,3 dB ACIMA da voz; bug 18/10/2026, scripts/regressao/voz-acima-da-musica.test.mjs).
  // O loudnorm sai em 192 kHz; sem o aresample o amix com a voz (44,1 kHz) cortava os ~3 s finais
  // (bug 24/10/2026, scripts/regressao/final-sem-audio.test.mjs).
  const duck = `[0:a]loudnorm=I=${MUSICA_LUFS}:TP=-2:LRA=11,aresample=44100[cama];[cama][chave]sidechaincompress=threshold=0.015:ratio=14:attack=15:release=600[musica]`;
  const final = "[musica][voz]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100[aout]";
  return [...vozes, junta, duck, final].join(";");
}

// Mistura as falas no MP4 já renderizado (vídeo intacto, só troca o áudio).
export async function mixarNarracao(videoIn, videoOut, { falas, scenes }) {
  const inicios = scenes.map((s) => s.start);
  const args = ["-y", "-v", "error", "-i", videoIn, ...falas.flatMap((f) => ["-i", f.arquivo]),
    "-filter_complex", filtroMixagem(falas, inicios),
    "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
    "-movflags", "+faststart", videoOut];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg mixagem: ${r.stderr.slice(-400)}`);
  return videoOut;
}
