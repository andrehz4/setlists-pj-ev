// Narração do reel "Som x Letra" (ElevenLabs v4, voz Liam, 1,2x com atempo): cada frase do gancho gravada à parte e
// emendada com respiro, então os tempos de cada frase saem exatos pro texto na tela. Também grava a pergunta do CTA.
// Uso: node analise-musica/voz.mjs roteiros/<slug>.json <pasta_reel> [chave=/Users/andrehz/.elevenlabs-key]
// Saída na pasta: gancho.wav, cta.wav, voz.json ({abertura_s, frases[{t0,t1,texto}], cta_s}). Reaproveita o que já existe.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { sintetizar, VOZES } from "../scripts/publish/narracao/elevenlabs.mjs";

const [roteiroArq, pasta, chaveArq] = process.argv.slice(2);
const rt = JSON.parse(fs.readFileSync(roteiroArq, "utf8"));
const apiKey = fs.readFileSync(chaveArq || "/Users/andrehz/.elevenlabs-key", "utf8").trim();
const LIAM = VOZES.find((v) => v.nome === "Liam").id;
const RESPIRO = 0.3, SR = 44100;
const SIL = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03";
const ff = (a) => execFileSync("ffmpeg", ["-y", "-v", "error", ...a]);
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const dir = path.join(pasta, "voz");
fs.mkdirSync(dir, { recursive: true });

async function fala(id, texto) {
  const bruto = path.join(dir, `${id}-bruto.mp3`);
  if (!fs.existsSync(bruto)) await sintetizar(texto, { vozId: LIAM, apiKey, destino: bruto });
  const final = path.join(dir, `${id}.wav`);
  ff(["-i", bruto, "-af", `${SIL},areverse,${SIL},areverse,atempo=1.2`, "-ar", String(SR), "-ac", "1", final]);
  return final;
}

const frases = [];
const partes = [];
let t = 0;
for (const [i, texto] of rt.gancho.entries()) {
  const f = await fala(`gancho-${i + 1}`, texto);
  const d = dur(f);
  frases.push({ t0: +t.toFixed(2), t1: +(t + d).toFixed(2), texto });
  partes.push(f);
  t += d + RESPIRO;
}
// emenda com silêncio entre as frases
const filtro = partes.map((_, i) => `[${i}]apad=pad_dur=${RESPIRO}[a${i}]`).join(";") + ";" +
  partes.map((_, i) => `[a${i}]`).join("") + `concat=n=${partes.length}:v=0:a=1[s]`;
ff([...partes.flatMap((p) => ["-i", p]), "-filter_complex", filtro, "-map", "[s]", path.join(pasta, "gancho.wav")]);
const cta = await fala("cta", `Qual o seu sentimento escutando ${rt.faixa}?`);
fs.copyFileSync(cta, path.join(pasta, "cta.wav"));
const abertura = Math.max(7, Math.ceil((t - RESPIRO + 0.6) * 10) / 10);
const saida = { abertura_s: abertura, frases, cta_s: +dur(cta).toFixed(2) };
fs.writeFileSync(path.join(pasta, "voz.json"), JSON.stringify(saida, null, 1));
console.log(`[voz] ${rt.faixa}: gancho ${(t - RESPIRO).toFixed(2)} s, abertura ${abertura} s, cta ${saida.cta_s} s`);
