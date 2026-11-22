// PRÉVIA do reel "Agenda da semana" (sai na terça, cobre terça a domingo). Abre com o Pearl Jam de verdade (acervo de
// transições, mudo), mapa acendendo as cidades, uma cena por dia (foto de perfil da banda enquanto não há acervo de
// covers) e fecho "toda terça tem". Narração ElevenLabs (voz da semana do resumão), cada fala gravada 1x (cache por texto).
// Uso: node reels-especiais/agenda-semana/gera.mjs [--inicio 2026-11-24]  ->  saida/reel.mp4
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { naRaiz } from "../../scripts/config.mjs";
import { sintetizar, vozDaSemana } from "../../scripts/publish/narracao/elevenlabs.mjs";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";
import { carregarTransicoes, recorte } from "../../scripts/publish/reel/transicoes.mjs";
import { materializar } from "../../scripts/publish/reel/acervo-r2.mjs";
import { somaDias } from "../../scripts/agenda/redes/semana.mjs";
import { cidadesDoDia } from "../../scripts/agenda/redes/mapa.mjs";
import { ABERTURA, FECHO, textoMapa, textoDia } from "./falas.mjs";
import { W, H, abertura, mapa, dia, fecho, nomeDia } from "./cenas.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url)), saida = path.join(dir, "saida");
fs.mkdirSync(saida, { recursive: true });
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const INICIO = arg("inicio", "2026-11-24"), FIM = somaDias(INICIO, 5);
const run = (a) => { const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...a], { stdio: "inherit" }); if (r.status) throw new Error("ffmpeg falhou"); };
const dur = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString());
const png = async (svg, nome) => { const f = path.join(saida, `${nome}.png`); await sharp(Buffer.from(svg)).png().toFile(f); return f; };

const todos = JSON.parse(fs.readFileSync(naRaiz("media/agenda/shows.json"), "utf8")).shows;
const shows = todos.filter((s) => !s.fechado && s.data >= INICIO && s.data <= FIM).sort((a, b) => a.data.localeCompare(b.data));
const dias = [...new Set(shows.map((s) => s.data))];
const nc = cidadesDoDia(shows).length;

// Falas (falas.mjs): abertura, mapa, um dia por vez ("Na sexta, cidade, banda."), fecho. A casa nunca é falada.
const falas = [
  { cena: "abertura", texto: ABERTURA },
  { cena: "mapa", texto: textoMapa(shows.length, nc) },
  ...dias.map((d) => ({ cena: d, texto: textoDia(d, shows.filter((s) => s.data === d)) })),
  { cena: "fecho", texto: FECHO },
];
const voz = vozDaSemana("2026-W48");
const chave = fs.readFileSync("/Users/andrehz/.elevenlabs-key", "utf8").trim();
for (const f of falas) {
  f.arq = path.join(saida, `voz-${crypto.createHash("sha1").update(`${voz.id}|${f.texto}`).digest("hex").slice(0, 10)}.mp3`);
  if (!fs.existsSync(f.arq)) await sintetizar(f.texto, { vozId: voz.id, apiKey: chave, destino: f.arq });
  f.dur = dur(f.arq);
}
const fala = (c) => falas.find((f) => f.cena === c);

// Segmentos de vídeo (sem áudio), depois concatenados.
const segs = [];
const still = (img, d, nome, zoom = true) => {
  const out = path.join(saida, `seg-${nome}.mp4`);
  const vf = zoom ? `scale=1134:2016,crop=${W}:${H}:x='27*t/${d}':y='48*t/${d}'` : "null";
  run(["-loop", "1", "-t", d.toFixed(3), "-i", img, "-vf", `${vf},fps=30,setsar=1,format=yuv420p`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out]);
  segs.push({ out, d });
};

// 1) Abertura: 4 cortes do Pearl Jam (mudos), 0,75 s cada, com a pergunta por cima.
const ESCOLHA = ["even-flow-stage-dive.mp4", "even-flow-bateria-cabelo.mp4", "alive-acao11.mp4", "alive-t11.mp4"];
const cortes = materializar(carregarTransicoes().filter((t) => ESCOLHA.includes(t.file)));
const dAb = Math.max(3, fala("abertura").dur + 0.4), pedaco = dAb / cortes.length;
{
  const out = path.join(saida, "seg-abertura.mp4"), sobre = await png(abertura(), "abertura");
  const ins = cortes.flatMap((c) => ["-ss", "0.1", "-t", pedaco.toFixed(3), "-an", "-i", c.arq]);
  const f = cortes.map((c, i) => `[${i}:v]${recorte(c)},scale=${W}:${H},fps=30,setsar=1,trim=duration=${pedaco.toFixed(3)},setpts=PTS-STARTPTS[c${i}]`);
  f.push(`${cortes.map((_, i) => `[c${i}]`).join("")}concat=n=${cortes.length}:v=1:a=0[cc]`, `[cc][${cortes.length}:v]overlay=0:0,format=yuv420p[v]`);
  run([...ins, "-loop", "1", "-t", dAb.toFixed(3), "-i", sobre, "-filter_complex", f.join(";"), "-map", "[v]", "-c:v", "libx264", "-r", "30", "-t", dAb.toFixed(3), out]);
  segs.push({ out, d: dAb });
}
// 2) Mapa: as cidades acendem uma a uma em 70% da cena.
const periodo = `${INICIO.slice(8)}/${INICIO.slice(5, 7)} A ${FIM.slice(8)}/${FIM.slice(5, 7)}`;
const dMapa = Math.max(3.2, fala("mapa").dur + 0.7), passo = (dMapa * 0.7) / nc;
for (let k = 1; k <= nc; k++) still(await png(mapa(shows, k, periodo), `mapa-${k}`), k < nc ? passo : dMapa - passo * (nc - 1), `mapa-${k}`, false);
// 3) Um dia por cena: o destaque passa de show em show.
for (const d of dias) {
  const doDia = shows.filter((s) => s.data === d), dDia = Math.max(2.5, fala(d).dur + 0.5);
  for (let i = 0; i < doDia.length; i++) still(await png(dia(d, doDia, i), `dia-${d}-${i}`), dDia / doDia.length, `dia-${d}-${i}`);
}
// 4) Fecho
still(await png(fecho(), "fecho"), Math.max(2.5, fala("fecho").dur + 0.8), "fecho", false);

const lista = path.join(saida, "lista.txt");
fs.writeFileSync(lista, segs.map((s) => `file '${s.out}'`).join("\n"));
const mudo = path.join(saida, "mudo.mp4");
run(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", mudo]);
const total = dur(mudo);

// Áudio: cada fala entra 0,15 s depois do início da sua cena; whoosh nas trocas; trilha própria baixa por baixo.
const inicios = {}; let t = 0;
inicios.abertura = 0; t = dAb; inicios.mapa = t; t += dMapa;
for (const d of dias) { inicios[d] = t; t += Math.max(2.5, fala(d).dur + 0.5); }
inicios.fecho = t;
const trilha = trilhaPropria({ uso: "reel", semente: `agenda-${INICIO}`, plano: [{ de: 0, ate: total, nivel: "cheio" }],
  duracao: total, saida: path.join(saida, "trilha.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");
const whoosh = naRaiz("media/agenda/voz/whoosh.mp3");
const trocas = Object.values(inicios).slice(1);
const ins = ["-i", mudo, ...falas.flatMap((f) => ["-i", f.arq]), "-i", trilha.path, ...trocas.flatMap(() => ["-i", whoosh])];
const af = falas.map((f, i) => { const ms = Math.round((inicios[f.cena] + 0.15) * 1000); return `[${i + 1}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[f${i}]`; });
const iT = falas.length + 1;
af.push(`[${iT}:a]volume=0.25,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[m]`);
trocas.forEach((tt, j) => { const ms = Math.round(Math.max(0, tt - 0.25) * 1000); af.push(`[${iT + 1 + j}:a]volume=0.5,adelay=${ms}|${ms},aformat=channel_layouts=stereo[w${j}]`); });
const ent = [...falas.map((_, i) => `[f${i}]`), "[m]", ...trocas.map((_, j) => `[w${j}]`)];
af.push(`${ent.join("")}amix=inputs=${ent.length}:duration=longest:normalize=0,atrim=0:${total.toFixed(2)},loudnorm=I=-14:TP=-1.5[a]`);
const out = path.join(saida, "reel.mp4");
run([...ins, "-filter_complex", af.join(";"), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", total.toFixed(2), out]);
console.log(falas.map((f) => `${f.cena.padEnd(10)} ${f.dur.toFixed(1)}s  ${f.texto}`).join("\n"));
console.log(`reel: ${out} | ${total.toFixed(1)} s | voz ${voz.nome} | trilha ${trilha.name}`);
