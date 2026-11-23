// Narração do reel da agenda (ElevenLabs). Voz FIXA: a Jessica, a que o Andre aprovou de ouvido em 22/11 (pronúncia
// muda de voz pra voz, então não entra no rodízio do resumão). Cada fala é gravada uma vez (cache pelo hash de
// voz + texto). Abertura e fecho não mudam: ficam gravados no repo (media/agenda/reel-voz/) e não gastam crédito.
// Contas em rodízio (scripts/publish/narracao/chaves.mjs); no Mac sem env, usa /Users/andrehz/.elevenlabs-key.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../config.mjs";
import { sintetizar, VOZES } from "../narracao/elevenlabs.mjs";
import { chavesEmOrdem, erroDeConta } from "../narracao/chaves.mjs";
import { ABERTURA, FECHO } from "./falas.mjs";

export const DIR_FIXAS = naRaiz("media/agenda/reel-voz");
const DIR_PREVIA = naRaiz("reels-especiais/agenda-semana/saida"); // falas já ouvidas e aprovadas na prévia (só no Mac)
const CHAVE_MAC = "/Users/andrehz/.elevenlabs-key";
const FIXAS = new Set([ABERTURA, FECHO]);

export const nomeDoArquivo = (vozId, texto) => `voz-${crypto.createHash("sha1").update(`${vozId}|${texto}`).digest("hex").slice(0, 10)}.mp3`;
export const duracao = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString());

function chaves(env) {
  const lista = chavesEmOrdem(env);
  if (!lista.length && fs.existsSync(CHAVE_MAC)) lista.push({ nome: "mac", chave: fs.readFileSync(CHAVE_MAC, "utf8").trim() });
  return lista;
}

// falas: [{ chave, texto }] -> { voz, falas: [{ chave, texto, arquivo, dur }], aviso } ou { aviso } (sai sem voz).
export async function gravarFalas(falas, { tmpDir = os.tmpdir(), env = process.env, sintetizarImpl = sintetizar } = {}) {
  const voz = VOZES.find((v) => v.nome === "Jessica") || VOZES[0];
  const dirTmp = path.join(tmpDir, "agenda-reel-voz");
  fs.mkdirSync(dirTmp, { recursive: true });
  const plano = falas.map((f) => {
    const nome = nomeDoArquivo(voz.id, f.texto);
    const pronto = [DIR_FIXAS, DIR_PREVIA, dirTmp].map((d) => path.join(d, nome)).find((p) => fs.existsSync(p));
    return { ...f, arquivo: pronto || path.join(FIXAS.has(f.texto) ? DIR_FIXAS : dirTmp, nome), pronto: Boolean(pronto) };
  });
  const faltam = plano.filter((f) => !f.pronto);
  let usada = faltam.length ? null : { nome: "cache" }, motivo = "nenhuma chave";
  for (const c of faltam.length ? chaves(env) : []) {
    try {
      for (const f of faltam) {
        if (fs.existsSync(f.arquivo)) continue;
        fs.mkdirSync(path.dirname(f.arquivo), { recursive: true });
        await sintetizarImpl(f.texto, { vozId: voz.id, apiKey: c.chave, destino: f.arquivo });
      }
      usada = c; break;
    } catch (e) {
      if (!erroDeConta(e)) return { aviso: `reel da agenda SEM voz: narração falhou (${String(e.message).slice(0, 120)})` };
      motivo = `${c.nome}: ${String(e.message).slice(0, 80)}`;
    }
  }
  if (!usada) return { aviso: `reel da agenda SEM voz: faltou crédito no ElevenLabs (${motivo})` };
  for (const f of plano) f.dur = duracao(f.arquivo);
  const gastos = faltam.reduce((n, f) => n + f.texto.length, 0);
  return { voz, falas: plano.map(({ chave, texto, arquivo, dur }) => ({ chave, texto, arquivo, dur })),
    aviso: `voz: ${voz.nome}${usada.nome !== "principal" ? ` (conta ${usada.nome})` : ""} · ${gastos} caracteres gastos` };
}
