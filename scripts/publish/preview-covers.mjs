// Gera a CAPA (Card 11) usando cada noticia do index.json como item lider,
// pra ver as variacoes (fotos e titulos reais; sem title_ig ainda -> fallback
// title_pt). Saida: tmp/preview/covers/NN-<id>.jpg + _manifest.txt

process.env.SLIDE_LAYOUT = "card02";

import fs from "node:fs/promises";
import path from "node:path";

const idx = JSON.parse(await fs.readFile("media/news/index.json", "utf8"));
const items = idx.items || [];

const { buildCoverSlide } = await import("./slide-image.mjs");

const OUT = path.resolve("tmp/preview/covers");
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const manifest = [];
let i = 0;
for (const it of items) {
  i++;
  const nn = String(i).padStart(2, "0");
  const destId = `_preview-cover-${i}`;
  try {
    const r = await buildCoverSlide(it, destId);
    const friendly = `${nn}-${it.id}.jpg`;
    await fs.copyFile(r.path, path.join(OUT, friendly));
    await fs.rm(r.path, { force: true }); // limpa o sintetico do SLIDES_DIR
    const line = `${nn}  ${friendly}  ${(it.title_ig || it.title_pt || "").slice(0, 80)}`;
    manifest.push(line);
    console.log(line);
  } catch (e) {
    const line = `${nn}  ERRO ${it.id}: ${e.message}`;
    manifest.push(line);
    console.log(line);
  }
}

await fs.writeFile(path.join(OUT, "_manifest.txt"), manifest.join("\n") + "\n");
console.log(`\n${i} capas em ${OUT}`);
