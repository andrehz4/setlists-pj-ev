// Importa um corte do baixa-clipehz pro acervo de TRANSIÇÕES do reel
// (media/reels-clips/transicoes/). Sempre mudo, H.264 até 1080p, 30 fps.
//   node scripts/publish/reel/importar-transicao.mjs <arquivo> <nome-curto> [--musica X] [--ini s] [--fim s] [--tags a,b]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const PASTA = path.resolve("media/reels-clips/transicoes");
const DOWNLOADS = "/Users/andrehz/Documents/Githubhz/baixa-clipehz/downloads";

export function lerArgs(argv) {
  const [arquivo, nome, ...resto] = argv;
  const op = {};
  for (let i = 0; i < resto.length; i += 2) op[resto[i].replace(/^--/, "")] = resto[i + 1];
  return { arquivo, nome, ...op };
}

export const nomeValido = (n) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(n || "");

// Argumentos do ffmpeg: corte preciso (re-encode), sem áudio, até 1080p, 30 fps.
export function argsFfmpeg({ entrada, saida, ini, fim }) {
  const a = ["-y"];
  if (ini != null) a.push("-ss", String(ini));
  a.push("-i", entrada);
  if (fim != null) a.push("-t", String(Number(fim) - Number(ini || 0)));
  a.push("-an", "-vf", "scale=-2:'min(1080,ih)',fps=30", "-c:v", "libx264", "-crf", "20", "-preset", "medium",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", saida);
  return a;
}

function duracao(arq) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq], { encoding: "utf8" });
  return Math.round(Number(r.stdout.trim()) * 100) / 100;
}

function main() {
  const op = lerArgs(process.argv.slice(2));
  if (!op.arquivo || !nomeValido(op.nome)) {
    console.error("uso: importar-transicao.mjs <arquivo> <nome-curto-com-hifens> [--musica X] [--ini s] [--fim s] [--tags a,b]");
    process.exit(1);
  }
  const entrada = path.isAbsolute(op.arquivo) ? op.arquivo : path.join(DOWNLOADS, op.arquivo);
  if (!fs.existsSync(entrada)) { console.error(`não achei ${entrada}`); process.exit(1); }
  const saida = path.join(PASTA, `${op.nome}.mp4`);
  const r = spawnSync("ffmpeg", argsFfmpeg({ entrada, saida, ini: op.ini, fim: op.fim }), { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr.split("\n").slice(-3).join("\n")); process.exit(1); }
  const arqJson = path.join(PASTA, "transicoes.json");
  const doc = JSON.parse(fs.readFileSync(arqJson, "utf8"));
  const item = { file: `${op.nome}.mp4`, musica: op.musica || "", origem: path.basename(entrada), dur: duracao(saida),
    ...(op.ini != null ? { ini: Number(op.ini), fim: Number(op.fim) } : {}),
    tags: op.tags ? op.tags.split(",").map((t) => t.trim()) : [] };
  doc.transicoes = [...doc.transicoes.filter((t) => t.file !== item.file), item];
  fs.writeFileSync(arqJson, JSON.stringify(doc, null, 2) + "\n");
  console.log(`[transicao] ${item.file} ${item.dur}s, ${(fs.statSync(saida).size / 1e6).toFixed(1)} MB, mudo`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
