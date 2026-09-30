// Narração do reel semanal (módulo apartado, desligado sem REEL_NARRACAO=1 e
// ELEVENLABS_API_KEY). Fluxo: gera a fala de cada cena -> mede a duração ->
// cada cena passa a durar o tempo da sua fala (texto e voz sincronizados) ->
// depois do render, mistura as falas com a trilha abaixando a música.
// Qualquer falha devolve null e o reel sai como antes, só com música.

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { falasDasCenas, FALA_ABERTURA, FALA_FINAL } from "./fala.mjs";
import { sintetizar, vozDaSemana } from "./elevenlabs.mjs";

// Abertura e encerramento são sempre iguais: gerados 1x por voz e guardados no
// repo (vão no mesmo commit do reel). Nome leva hash do texto: mudou a frase,
// gera de novo sozinho. Economiza crédito do ElevenLabs toda semana.
export const DIR_FIXAS = path.resolve("media/news/instagram-reels/narracao");
export function arquivoFixo(texto, voz, dir = DIR_FIXAS) {
  if (texto !== FALA_ABERTURA && texto !== FALA_FINAL) return null;
  const h = createHash("sha1").update(`${voz.id}|${texto}`).digest("hex").slice(0, 8);
  return path.join(dir, `${voz.nome.toLowerCase()}-${texto === FALA_ABERTURA ? "abertura" : "final"}-${h}.mp3`);
}

// Folga depois da fala (a manchete fica um instante na tela) e limites.
const FOLGA = { coldopen: 0.5, outro: 0.6, bloco: 0.8 };
const MIN = { coldopen: 3.0, outro: 2.5, bloco: 3.5 };
const MAX_BLOCO = 9.0;
const INICIO_FALA = 0.25; // a voz entra logo depois do corte

export function narracaoLigada(env = process.env) {
  return env.REEL_NARRACAO === "1" && Boolean(env.ELEVENLABS_API_KEY);
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
    return tipo === "bloco" ? Math.min(d, MAX_BLOCO) : d;
  });
}

// Gera as falas. Devolve { voz, falas: [{ sceneIndex, texto, arquivo, dur }], sceneDurs } ou null.
export async function prepararNarracao(scenes, { weekKey, tmpDir, env = process.env, sintetizarImpl = sintetizar, duracaoImpl = duracaoAudio, dirFixas = DIR_FIXAS }) {
  if (!narracaoLigada(env)) return null;
  const voz = vozDaSemana(weekKey);
  try {
    const dir = path.join(tmpDir, "narracao");
    await fs.mkdir(dir, { recursive: true });
    const falas = [];
    let reaproveitadas = 0;
    for (const f of falasDasCenas(scenes)) {
      const fixo = arquivoFixo(f.texto, voz, dirFixas);
      const arquivo = fixo || path.join(dir, `fala_${String(f.sceneIndex).padStart(2, "0")}.mp3`);
      const jaExiste = fixo && await fs.stat(fixo).then(() => true, () => false);
      if (jaExiste) reaproveitadas++;
      else {
        if (fixo) await fs.mkdir(path.dirname(fixo), { recursive: true });
        await sintetizarImpl(f.texto, { vozId: voz.id, apiKey: env.ELEVENLABS_API_KEY, destino: arquivo });
      }
      falas.push({ ...f, arquivo, dur: duracaoImpl(arquivo) });
    }
    if (reaproveitadas) console.log(`[narracao] ${reaproveitadas} fala(s) fixa(s) reaproveitada(s), sem gastar crédito`);
    const sceneDurs = duracoesSincronizadas(scenes, new Map(falas.map((f) => [f.sceneIndex, f.dur])));
    console.log(`[narracao] voz ${voz.nome}: ${falas.length} falas, reel de ${sceneDurs.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    return { voz, falas, sceneDurs };
  } catch (e) {
    console.warn(`[narracao] FALHOU, reel sai só com música: ${e.message}`);
    return null;
  }
}

// Filtro do ffmpeg: música abaixa quando a voz entra (sidechain) e volta depois.
export function filtroMixagem(falas, inicios) {
  const vozes = falas.map((f, k) => {
    const ms = Math.round((inicios[f.sceneIndex] + INICIO_FALA) * 1000);
    return `[${k + 1}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[f${k}]`;
  });
  const junta = `${falas.map((_, k) => `[f${k}]`).join("")}amix=inputs=${falas.length}:normalize=0,volume=1.8,asplit=2[voz][chave]`;
  const duck = "[0:a][chave]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[musica]";
  const final = "[musica][voz]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=11[aout]";
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
