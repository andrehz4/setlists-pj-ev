// Grava a narração do roteiro.json (ElevenLabs v4, Jessica e Liam), corta o silêncio das pontas e acelera até o
// ritmo pedido (atempo, sem mudar o tom). Técnica da fábrica-quiz (motor/top5/ritmo.mjs): o speed da API não
// funciona no eleven_v4. Confere cada fala no whisper (mlx) e grava voz/tempos.json.
// Uso: node gerar-voz.mjs [ppm=195] [chave=reserva5]
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { sintetizar, VOZES } from "../../scripts/publish/narracao/elevenlabs.mjs";

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const PPM = Number(process.argv[2] || 195);
const MAX = 1.2;
const apiKey = fs.readFileSync(`/Users/andrehz/.elevenlabs-key-${process.argv[3] || "reserva5"}`, "utf8").trim();
const WHISPER = "/Users/andrehz/.venvs/anosrep-whisper/bin/mlx_whisper";
const SIL = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03";
const ID = { jessica: VOZES[0].id, liam: VOZES[1].id };

const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const ff = (a) => execFileSync("ffmpeg", ["-y", "-v", "error", ...a]);
const palavras = (t) => t.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

const roteiro = JSON.parse(fs.readFileSync(path.join(AQUI, "roteiro.json"), "utf8"));
const dir = path.join(AQUI, "voz");
fs.mkdirSync(dir, { recursive: true });
const out = [];
for (const c of roteiro.cenas.filter((x) => x.voz !== "nenhuma" && x.fala)) {
  const bruto = path.join(dir, `${c.id}-bruto.mp3`);
  if (!fs.existsSync(bruto)) await sintetizar(c.fala, { vozId: ID[c.voz], apiKey, destino: bruto });
  const seco = path.join(dir, `${c.id}-seco.wav`);
  ff(["-i", bruto, "-af", `${SIL},areverse,${SIL},areverse,silenceremove=stop_periods=-1:stop_duration=0.14:stop_threshold=-42dB`, seco]);
  const n = palavras(c.fala);
  const f = Math.min(MAX, Math.max(1, (dur(seco) * PPM) / (60 * n)));
  const final = path.join(dir, `${c.id}.wav`);
  ff(["-i", seco, "-af", `atempo=${f.toFixed(3)},apad=pad_dur=0.05`, final]);
  fs.rmSync(seco);
  const d = dur(final);
  const r = spawnSync(WHISPER, [final, "--language", "pt", "--output-dir", "/tmp", "--output-format", "txt", "--verbose", "False"], { encoding: "utf8" });
  const ouvido = r.status === 0 ? fs.readFileSync(`/tmp/${c.id}.txt`, "utf8").trim() : "(whisper falhou)";
  out.push({ id: c.id, voz: c.voz, arquivo: `voz/${c.id}.wav`, dur: +d.toFixed(2), fator: +f.toFixed(2), ppm: Math.round((n / d) * 60), fala: c.fala, ouvido });
  console.log(`${c.id} ${c.voz} ${d.toFixed(2)}s x${f.toFixed(2)} ${Math.round((n / d) * 60)}ppm | ${ouvido}`);
}
fs.writeFileSync(path.join(dir, "tempos.json"), JSON.stringify(out, null, 1));
console.log(`total de fala: ${out.reduce((s, x) => s + x.dur, 0).toFixed(1)} s`);
