// Prepara os clipes do reel "Som x Letra" já em 9:16 com o ROSTO CENTRALIZADO (regra dos reels/stories:
// recorte segue a trilha de rosto do acervo; nunca recorte no meio, senão sai só ombro).
// Uso: node analise-musica/preparar_clipes.mjs <pasta_saida> <abertura: a,b,c...> <fundo: x,y,z...> [lento=2] [fundo_s=42]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { carregarTransicoes, recorte } from "../scripts/publish/reel/transicoes.mjs";
import { urlDo } from "../scripts/publish/reel/acervo-r2.mjs";

const [saida, abertura, fundo, lentoArg, fundoArg] = process.argv.slice(2);
const LENTO = Number(lentoArg || 2), FUNDO_S = Number(fundoArg || 42);
const lista = carregarTransicoes();
const cache = path.join(saida, "acervo");
fs.mkdirSync(cache, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);

function vertical(nome, destino, lento) {
  const t = lista.find((x) => x.file === `${nome}.mp4`);
  if (!t) throw new Error(`trecho fora do acervo: ${nome}`);
  const bruto = path.join(cache, t.file);
  if (!fs.existsSync(bruto)) execFileSync("curl", ["-sf", "-o", bruto, urlDo(t.file)]);
  // crop ANTES do setpts: a trilha de rosto usa o tempo de dentro do corte
  ff(["-i", bruto, "-an", "-vf", `${recorte(t)},scale=1080:1920,setpts=${lento}*PTS,fps=30,eq=saturation=0.8`,
    "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", destino]);
}

abertura.split(",").forEach((n, i) => vertical(n, path.join(saida, `clipe-${i + 1}.mp4`), 1));
const partes = fundo.split(",").map((n, i) => { const p = path.join(cache, `lento-${i}.mp4`); vertical(n, p, LENTO); return p; });
const txt = path.join(cache, "lista.txt");
fs.writeFileSync(txt, Array(4).fill(partes.map((p) => `file '${p}'`).join("\n")).join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", txt, "-t", String(FUNDO_S), "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p",
  path.join(saida, "fundo.mp4")]);
console.log(`[clipes] abertura ${abertura.split(",").length} + fundo ${FUNDO_S}s com rosto centralizado -> ${saida}`);
