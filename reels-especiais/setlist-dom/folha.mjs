// Folha da setlist do domingo no papel oficial, com as letras de mão do gerador do site (setlist-ibirapuera/).
// Cabeçalho SP 2, duas colunas, traço antes do bis. Música sem PNG no gerador sai escrita em fonte de caneta.
// Uso: node reels-especiais/setlist-dom/folha.mjs  ->  design/uploads/folha.jpg (1100x1400), lê setlist.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const ger = path.join(dir, "..", "..", "setlist-ibirapuera");
const norm = (t) => t.toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
const todas = JSON.parse(fs.readFileSync(path.join(ger, "musicas.json"), "utf8")).grupos.flatMap((g) => g.musicas);
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function letra(nome, larg) {
  const m = todas.find((x) => norm(x.nome) === norm(nome));
  if (m) { const meta = await sharp(path.join(ger, m.png)).metadata(); return sharp(path.join(ger, m.png)).resize(Math.min(meta.width, larg)).toBuffer(); }
  console.log("  sem PNG, escrevendo:", nome);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${larg}" height="80"><text x="4" y="58" font-family="Marker Felt" font-size="${Math.min(52, Math.floor((larg - 10) * 1.7 / nome.length))}" fill="#16130f">${esc(nome.toUpperCase())}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function desenharFolha(musicas, saida) {
  const n = musicas.length, linhas = Math.max(12, Math.ceil(n / 2)), passo = Math.min(90, Math.floor(1080 / linhas));
  const larg = Math.round(440 * Math.min(1, passo / 90));
  const camadas = [];
  const cab = path.join(ger, "img/cab-sp2.png"), cm = await sharp(cab).metadata();
  camadas.push({ input: cab, left: Math.round(550 - cm.width / 2), top: 40 });
  const desloc = [0, 0];
  for (const [i, m] of musicas.entries()) {
    const col = i < linhas ? 0 : 1, x = col ? 660 : 100, y = 255 + passo * (i % linhas) + desloc[col];
    camadas.push({ input: await letra(m.nome, larg), left: x, top: y });
    const prox = musicas[i + 1];
    if (prox && prox.bis > 0 && m.bis === 0) { // traço antes do bis, como o Eddie faz
      camadas.push({ input: await sharp(path.join(ger, "img/traco-bis.png")).resize(larg - 20).toBuffer(), left: x - 30, top: y + Math.round(passo * 1.19) });
      desloc[col] = Math.min(desloc[col] + 20, 40);
    }
  }
  await sharp(path.join(ger, "img/oficial/papel.jpg")).resize(1100, 1400).composite(camadas).jpeg({ quality: 92 }).toFile(saida);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "setlist.json"), "utf8"));
  await desenharFolha(s.musicas, path.join(dir, "design", "uploads", "folha.jpg"));
  console.log("folha.jpg ok,", s.musicas.length, "músicas");
}
