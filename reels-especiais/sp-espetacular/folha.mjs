// Desenha a folha da setlist de sexta igual ao gerador do site (setlist-ibirapuera/folha.js): papel oficial,
// cabeçalho SP 1 (sem o Ibirapuera, como o Eddie escreve), letras de mão por música (PNG do gerador), 2 colunas de 12, traço antes do bis.
// Uso: node reels-especiais/sp-espetacular/folha.mjs  ->  design/uploads/folha.jpg (1100x1400)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const ger = path.join(dir, "..", "..", "setlist-ibirapuera");
const SET = JSON.parse(fs.readFileSync(path.join(dir, "..", "eddie-balanco", "hoje.json"), "utf8"));
const todas = JSON.parse(fs.readFileSync(path.join(ger, "musicas.json"), "utf8")).grupos.flatMap((g) => g.musicas);
const png = (n) => { const m = todas.find((x) => x.nome.toLowerCase() === n.toLowerCase()); if (!m) throw new Error(`sem PNG: ${n}`); return path.join(ger, m.png); };
const BIS = SET.length - 1; // Rockin' in the Free World
const camadas = [];
const pos = (await sharp(path.join(ger, "img/cab-sp1.png")).metadata());
camadas.push({ input: path.join(ger, "img/cab-sp1.png"), left: Math.round(550 - pos.width / 2), top: 40 });
const desloc = [0, 0];
for (const [i, nome] of SET.entries()) {
  const col = i < 12 ? 0 : 1, x = col ? 660 : 100, y = 255 + 90 * (i % 12) + desloc[col];
  const meta = await sharp(png(nome)).metadata(), larg = Math.min(meta.width, 440);
  camadas.push({ input: await sharp(png(nome)).resize(larg).toBuffer(), left: x, top: y });
  if (i === BIS - 1) {
    const t = await sharp(path.join(ger, "img/traco-bis.png")).resize(420).toBuffer();
    camadas.push({ input: t, left: x - 30, top: y + 107 });
    desloc[col] = Math.min(desloc[col] + 20, 40);
  }
}
await sharp(path.join(ger, "img/oficial/papel.jpg")).resize(1100, 1400).composite(camadas).jpeg({ quality: 92 })
  .toFile(path.join(dir, "design", "uploads", "folha.jpg"));
console.log("folha.jpg ok");
