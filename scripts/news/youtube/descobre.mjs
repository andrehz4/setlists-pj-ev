// Descobridor de vídeos candidatos a virar "cápsula" (matéria a partir de
// entrevista/doc do YouTube). Roda buscas no yt-dlp (flat, sem baixar nada),
// junta, tira duplicatas e clipes muito curtos, salva um JSON de candidatos.
//
// NÃO precisa de API key: usa a busca do próprio yt-dlp (ytsearchN:).
// Roda LOCAL (yt-dlp com cookies do navegador funciona; no GitHub Actions o
// YouTube costuma bloquear por bot-detection).
//
// Uso:
//   node scripts/news/youtube/descobre.mjs
//   node scripts/news/youtube/descobre.mjs --out /tmp/candidatos.json --per 20 --min 120
//
// Depois: node scripts/news/youtube/galeria.mjs pra curar visualmente.

import { spawn } from "node:child_process";
import fs from "node:fs";

// Buscas focadas em ENTREVISTA/DOC/CONVERSA, multi-língua (o diferencial é o
// conteúdo que só existe em outras línguas). Edite à vontade pra ampliar.
const QUERIES = [
  // multi-língua (o diferencial: conteúdo que só existe em outra língua)
  "pearl jam intervista", "eddie vedder intervista", "pearl jam intervista italiana",
  "pearl jam entrevista", "eddie vedder entrevista", "pearl jam entrevista legendado",
  "pearl jam entrevista subtitulada", "eddie vedder entrevista subtitulada",
  "pearl jam interview deutsch", "pearl jam interview sous-titres",
  "pearl jam interview francais", "pearl jam interview espanol",
  "pearl jam intervju", "pearl jam wywiad", "pearl jam interview nederlands",
  "パール・ジャム インタビュー",
  // conversas LONGAS: onde está o material denso
  "pearl jam podcast interview", "eddie vedder podcast full episode",
  "eddie vedder long interview", "pearl jam full interview",
  "eddie vedder in conversation", "pearl jam career retrospective interview",
  "pearl jam sit down interview", "eddie vedder talks about",
  // integrantes, individualmente
  "jeff ament interview", "stone gossard interview", "matt cameron interview",
  "mike mccready interview", "boom gaspar interview", "josh klinghoffer pearl jam",
  "dave abbruzzese interview", "dave krusen interview", "jack irons interview",
  // projetos paralelos e árvore genealógica
  "mad season interview", "temple of the dog interview", "brad stone gossard band",
  "rndm jeff ament", "three fish band", "mother love bone interview",
  "green river band interview", "mookie blaylock pearl jam",
  // por disco e por época
  "pearl jam ten anniversary interview", "pearl jam vitalogy interview",
  "pearl jam no code interview", "pearl jam yield interview",
  "pearl jam binaural interview", "pearl jam riot act interview",
  "pearl jam backspacer interview", "pearl jam lightning bolt interview",
  "pearl jam gigaton interview", "pearl jam dark matter interview",
  "pearl jam 1991 interview", "pearl jam 1992 interview", "pearl jam 1994 interview",
  "pearl jam 1996 interview", "pearl jam 1998 interview", "pearl jam 2000 interview",
  // rádio e TV, onde há muito arquivo
  "pearl jam rockline radio", "eddie vedder radio interview archive",
  "pearl jam mtv interview archive", "pearl jam tv interview 90s",
  "eddie vedder acoustic radio session",
  // temas que já provaram render matéria
  "eddie vedder songwriting interview", "pearl jam behind the songs",
  "pearl jam ticketmaster", "eddie vedder surfing interview",
  "eddie vedder activism interview", "pearl jam vinyl record store day interview",
];

function arg(nome, def) {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const OUT = arg("out", "/tmp/yt-candidatos.json");
const PER = Number(arg("per", "14"));   // resultados por busca
const MIN = Number(arg("min", "120"));  // duração mínima em s (corta clipes)

function busca(q) {
  return new Promise((resolve) => {
    const args = ["--flat-playlist", "--no-warnings",
      "--print", "%(id)s|||%(title)s|||%(channel)s|||%(duration)s", `ytsearch${PER}:${q}`];
    const c = spawn("yt-dlp", args);
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.on("close", () => resolve(out.trim().split("\n").filter(Boolean).map((ln) => {
      const [id, title, channel, duration] = ln.split("|||");
      return { id, title, channel, duration: Number(duration) || 0, url: `https://youtu.be/${id}` };
    })));
    c.on("error", () => resolve([]));
  });
}

const all = (await Promise.all(QUERIES.map(busca))).flat();
const seen = new Map();
for (const r of all) if (r.id && !seen.has(r.id)) seen.set(r.id, r);
// tira o que já foi curado antes (seleção) ou já virou matéria
const conhecidos = new Set();
try {
  const sel = JSON.parse(fs.readFileSync(new URL("_selecao.json", import.meta.url), "utf8"));
  for (const x of sel) conhecidos.add(x.id);
} catch { /* primeira rodada */ }
try {
  const rasc = JSON.parse(fs.readFileSync(new URL("../../../media/news/youtube-acervo/_rascunhos.json", import.meta.url), "utf8"));
  for (const x of rasc) conhecidos.add(x.videoId);
} catch { /* sem rascunhos ainda */ }

const cand = [...seen.values()]
  .filter((r) => r.duration >= MIN && !conhecidos.has(r.id))
  .sort((a, b) => b.duration - a.duration);
console.log(`${conhecidos.size} vídeos já conhecidos foram ignorados`);

fs.writeFileSync(OUT, JSON.stringify(cand, null, 2));
console.log(`${cand.length} candidatos (>=${MIN}s), de ${all.length} brutos -> ${OUT}`);
console.log(`agora rode: node scripts/news/youtube/galeria.mjs --in ${OUT}`);
