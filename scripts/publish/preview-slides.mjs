// Gera amostras locais do layout card02 pra validacao visual do Andre.
// NAO publica nada, NAO commita. Saida em tmp/preview/.
//
// Uso: node scripts/publish/preview-slides.mjs
//
// Pega items reais do index.json. Como a routine ainda nao gerou title_ig
// (Fase 2 acabou de subir), tambem renderiza 1 variante com title_ig
// SIMULADO pro Andre ver como fica a manchete chamativa de verdade.

process.env.SLIDE_LAYOUT = "card02";

import fs from "node:fs/promises";
import path from "node:path";

const idx = JSON.parse(await fs.readFile("media/news/index.json", "utf8"));
const items = (idx.items || []).filter((i) => i.img && i.img.startsWith("/media/news/img/"));
if (items.length < 4) {
  console.error("index.json tem poucos items com img pra preview");
  process.exit(1);
}

const { buildSlide, buildCoverSlide } = await import("./slide-image.mjs");

const OUT = path.resolve("tmp/preview");
await fs.mkdir(OUT, { recursive: true });

async function copyOut(srcPath, friendly) {
  const dst = path.join(OUT, friendly);
  await fs.copyFile(srcPath, dst);
  console.log(`  -> ${dst}`);
  return dst;
}

// 1. SOLO (Card 02) com fallback real (sem title_ig, usa title_pt)
const solo = items[3];
console.log(`\n[1] SOLO card02 (fallback title_pt): ${solo.id} "${(solo.title_pt || "").slice(0, 60)}"`);
let r = await buildSlide(solo);
await copyOut(r.path, "1-solo-fallback-titulo-pt.jpg");

// 2. SOLO (Card 02) com title_ig SIMULADO (como a routine vai gerar)
const soloIg = { ...items[4], title_ig: "McCready salva a música de uma escola inteira" };
console.log(`\n[2] SOLO card02 (title_ig SIMULADO): "${soloIg.title_ig}"`);
// remove cache pra forcar render do mesmo id com o titulo novo
await fs.rm(path.resolve(`media/news/instagram-slides/${soloIg.id}.card02.jpg`), { force: true });
r = await buildSlide(soloIg);
await copyOut(r.path, "2-solo-titulo-ig-simulado.jpg");

// 3. CARROSSEL: capa (Card 11) do item lider + 1 slide de noticia
const carItems = items.slice(0, 4);
const lead = { ...carItems[0], title_ig: "Vote na música que define o Pearl Jam" };
console.log(`\n[3] CAPA carrossel (Card 11), lider: ${lead.id} title_ig SIMULADO "${lead.title_ig}"`);
const cov = await buildCoverSlide(lead, "_preview-cover");
await copyOut(cov.path, "3-capa-carrossel-card11.jpg");

console.log(`\n[4] Slide de noticia do carrossel (Card 02): ${carItems[1].id}`);
r = await buildSlide(carItems[1]);
await copyOut(r.path, "4-carrossel-noticia-card02.jpg");

console.log(`\nPronto. ${4} amostras em ${OUT}`);
