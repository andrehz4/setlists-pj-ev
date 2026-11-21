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
const ADD = "Black"; // pedida pela galera: escrita fora da lista, como o Eddie faz com mudança na hora
const LISTA = SET.filter((m) => m !== ADD), BIS = LISTA.length - 1; // Rockin' in the Free World
const camadas = [];
const pos = (await sharp(path.join(ger, "img/cab-sp1.png")).metadata());
camadas.push({ input: path.join(ger, "img/cab-sp1.png"), left: Math.round(550 - pos.width / 2), top: 40 });
const desloc = [0, 0];
const ys = [];
for (const [i, nome] of LISTA.entries()) {
  const col = i < 12 ? 0 : 1, x = col ? 660 : 100, y = 255 + 90 * (i % 12) + desloc[col];
  ys.push({ nome, x, y });
  const meta = await sharp(png(nome)).metadata(), larg = Math.min(meta.width, 440);
  camadas.push({ input: await sharp(png(nome)).resize(larg).toBuffer(), left: x, top: y });
  if (i === BIS - 1) {
    const t = await sharp(path.join(ger, "img/traco-bis.png")).resize(420).toBuffer();
    camadas.push({ input: t, left: x - 30, top: y + 107 });
    desloc[col] = Math.min(desloc[col] + 20, 40);
  }
}
// Black acrescentada na hora, como nas folhas reais do Eddie: mesma caneta preta, ao lado de Porch, menor e torta,
// com traço fino puxando até o ponto em que entrou (entre Porch e Hard Sun)
const pz = ys.find((v) => v.nome === "Porch"), hs = ys.find((v) => v.nome === "Hard Sun");
const bx = 870, by = pz.y + 6;
camadas.push({ input: await sharp(await sharp(png(ADD)).resize(170).toBuffer()).rotate(-7, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: bx, top: by });
const alvoY = hs.y + 14;
const traco = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1400"><g fill="none" stroke="#16130f" stroke-width="4" stroke-linecap="round">
  <path d="M ${bx + 6} ${by + 78} C ${bx - 60} ${alvoY + 6}, 720 ${alvoY + 2}, 645 ${alvoY}"/></g></svg>`;
camadas.push({ input: Buffer.from(traco), left: 0, top: 0 });
await sharp(path.join(ger, "img/oficial/papel.jpg")).resize(1100, 1400).composite(camadas).jpeg({ quality: 92 })
  .toFile(path.join(dir, "design", "uploads", "folha.jpg"));
console.log("folha.jpg ok");
