// Gera um slide Card 02 REAL pra cada noticia do index.json.
// Dados reais, sem simulacao: title_ig se existir, senao fallback title_pt
// (estado atual ate a routine gerar os titulos chamativos).
// Saida: tmp/preview/feed/NN-<id>.jpg + _manifest.txt

process.env.SLIDE_LAYOUT = "card02";

import fs from "node:fs/promises";
import path from "node:path";

const idx = JSON.parse(await fs.readFile("media/news/index.json", "utf8"));
const items = idx.items || [];

const { buildSlide } = await import("./slide-image.mjs");

const OUT = path.resolve("tmp/preview/feed");
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const manifest = [];
let i = 0;
for (const it of items) {
  i++;
  const nn = String(i).padStart(2, "0");
  const usou = it.title_ig ? "title_ig" : "title_pt(fallback)";
  try {
    const r = await buildSlide(it);
    const friendly = `${nn}-${it.id}.jpg`;
    await fs.copyFile(r.path, path.join(OUT, friendly));
    const line = `${nn}  ${friendly}  [${usou}]  ${(it.title_ig || it.title_pt || "").slice(0, 80)}`;
    manifest.push(line);
    console.log(line);
  } catch (e) {
    const line = `${nn}  ERRO ${it.id}: ${e.message}`;
    manifest.push(line);
    console.log(line);
  }
}

await fs.writeFile(path.join(OUT, "_manifest.txt"), manifest.join("\n") + "\n");
console.log(`\n${i} slides em ${OUT}`);
