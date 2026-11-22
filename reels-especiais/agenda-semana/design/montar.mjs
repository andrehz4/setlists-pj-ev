// Exemplo do reel com o modelo do Claude Design: pega o MP4 exportado do Design (mudo, 28,7 s), estica cada cena
// pra caber a narração já gravada (gera.mjs), põe os cortes reais do Pearl Jam por baixo da abertura (blend lighten:
// o texto claro do Design fica por cima) e mistura voz + trilha própria + whoosh.
// Uso: node reels-especiais/agenda-semana/design/montar.mjs [--video layout-b.mp4 --saida reel-b.mp4]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { naRaiz } from "../../../scripts/config.mjs";
import { vozDaSemana } from "../../../scripts/publish/narracao/elevenlabs.mjs";
import { trilhaPropria } from "../../../scripts/publish/trilha/ligar.mjs";
import { carregarTransicoes, recorte } from "../../../scripts/publish/reel/transicoes.mjs";
import { materializar } from "../../../scripts/publish/reel/acervo-r2.mjs";
import { sintetizar } from "../../../scripts/publish/narracao/elevenlabs.mjs";
import { ABERTURA, FECHO, textoMapa, textoDia } from "../falas.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url)), saidaVoz = path.join(dir, "..", "saida");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const ENTRADA = path.resolve(dir, arg("video", "agenda-design.mp4")), SAIDA = path.resolve(dir, arg("saida", "reel-exemplo.mp4"));
const run = (a) => { if (spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...a], { stdio: "inherit" }).status) throw new Error("ffmpeg falhou"); };
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString());
const voz = vozDaSemana("2026-W48");
const arqVoz = (t) => path.join(saidaVoz, `voz-${crypto.createHash("sha1").update(`${voz.id}|${t}`).digest("hex").slice(0, 10)}.mp3`);

// Cenas do Design (linha do tempo dele) e a fala de cada uma (textos de falas.mjs; grava só o que falta).
const SHOWS = JSON.parse(fs.readFileSync(naRaiz("media/agenda/shows.json"), "utf8")).shows.filter((s) => !s.fechado && s.data >= "2026-11-24" && s.data <= "2026-11-29");
const doDia = (d) => SHOWS.filter((s) => s.data === d);
const CENAS = [
  { nome: "abertura", d: 3.0, texto: ABERTURA },
  { nome: "mapa", d: 3.5, texto: textoMapa(9, 8) },
  { nome: "quinta", d: 3.0, texto: textoDia("2026-11-26", doDia("2026-11-26")) },
  { nome: "sexta", d: 8.1, texto: textoDia("2026-11-27", doDia("2026-11-27")) },
  { nome: "sabado", d: 8.1, texto: textoDia("2026-11-28", doDia("2026-11-28")) },
  { nome: "fecho", d: 3.0, texto: FECHO },
];
const chave = fs.readFileSync("/Users/andrehz/.elevenlabs-key", "utf8").trim();
let ini = 0, novoIni = 0;
for (const c of CENAS) {
  c.voz = arqVoz(c.texto);
  if (!fs.existsSync(c.voz)) await sintetizar(c.texto, { vozId: voz.id, apiKey: chave, destino: c.voz });
  c.ini = ini; ini += c.d;
  c.alvo = Math.max(c.d, dur(c.voz) + 0.5); // cena nunca corta a fala
  c.novoIni = novoIni; novoIni += c.alvo;
}
const total = novoIni;

// Vídeo: cada cena esticada (setpts) e a abertura com os cortes do PJ por baixo.
const ESCOLHA = ["even-flow-stage-dive.mp4", "even-flow-bateria-cabelo.mp4", "alive-acao11.mp4", "alive-t11.mp4"];
const cortes = materializar(carregarTransicoes().filter((t) => ESCOLHA.includes(t.file)));
const ped = CENAS[0].alvo / cortes.length;
const ins = ["-i", ENTRADA, ...cortes.flatMap((c) => ["-ss", "0.1", "-t", ped.toFixed(3), "-an", "-i", c.arq])];
const f = CENAS.map((c, i) => `[0:v]trim=${c.ini}:${(c.ini + c.d).toFixed(3)},setpts=(PTS-STARTPTS)*${(c.alvo / c.d).toFixed(4)},fps=30,setsar=1[s${i}]`);
cortes.forEach((c, i) => f.push(`[${i + 1}:v]${recorte(c)},scale=1080:1920,fps=30,setsar=1,trim=duration=${ped.toFixed(3)},setpts=PTS-STARTPTS,eq=brightness=-0.24:contrast=1.1:saturation=0.85[k${i}]`));
f.push(`${cortes.map((_, i) => `[k${i}]`).join("")}concat=n=${cortes.length}:v=1:a=0,format=gbrp[pj]`,
  `[s0]format=gbrp[s0g]`, `[s0g][pj]blend=all_mode=lighten,format=yuv420p[ab]`,
  `[ab]${CENAS.slice(1).map((_, i) => `[s${i + 1}]`).join("")}concat=n=${CENAS.length}:v=1:a=0,format=yuv420p[v]`);

// Áudio: fala 0,15 s depois do início da cena, whoosh nas trocas, trilha própria baixa.
const trilha = trilhaPropria({ uso: "reel", semente: "agenda-2026-11-24", plano: [{ de: 0, ate: total, nivel: "cheio" }],
  duracao: total, saida: path.join(dir, "trilha.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");
const base = 1 + cortes.length, whoosh = naRaiz("media/agenda/voz/whoosh.mp3");
ins.push(...CENAS.flatMap((c) => ["-i", c.voz]), "-i", trilha.path, ...CENAS.slice(1).flatMap(() => ["-i", whoosh]));
CENAS.forEach((c, i) => { const ms = Math.round((c.novoIni + 0.15) * 1000); f.push(`[${base + i}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[f${i}]`); });
const iT = base + CENAS.length;
f.push(`[${iT}:a]volume=0.25,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[m]`);
CENAS.slice(1).forEach((c, j) => { const ms = Math.round(Math.max(0, c.novoIni - 0.25) * 1000); f.push(`[${iT + 1 + j}:a]volume=0.5,adelay=${ms}|${ms},aformat=channel_layouts=stereo[w${j}]`); });
const ent = [...CENAS.map((_, i) => `[f${i}]`), "[m]", ...CENAS.slice(1).map((_, j) => `[w${j}]`)];
f.push(`${ent.join("")}amix=inputs=${ent.length}:duration=longest:normalize=0,atrim=0:${total.toFixed(2)},loudnorm=I=-14:TP=-1.5[a]`);
const out = SAIDA;
run([...ins, "-filter_complex", f.join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", total.toFixed(2), out]);
console.log(CENAS.map((c) => `${c.nome.padEnd(9)} ${c.d}s -> ${c.alvo.toFixed(1)}s`).join("\n"));
console.log(`exemplo: ${out} | ${total.toFixed(1)} s | trilha ${trilha.name}`);
