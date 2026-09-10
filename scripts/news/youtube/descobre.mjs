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
  "pearl jam intervista", "eddie vedder intervista",
  "pearl jam entrevista", "eddie vedder entrevista", "pearl jam entrevista legendado",
  "pearl jam interview deutsch", "pearl jam interview sous-titres",
  "eddie vedder interview", "pearl jam documentario", "pearl jam entrevista subtitulada",
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
const cand = [...seen.values()].filter((r) => r.duration >= MIN).sort((a, b) => b.duration - a.duration);

fs.writeFileSync(OUT, JSON.stringify(cand, null, 2));
console.log(`${cand.length} candidatos (>=${MIN}s), de ${all.length} brutos -> ${OUT}`);
console.log(`agora rode: node scripts/news/youtube/galeria.mjs --in ${OUT}`);
