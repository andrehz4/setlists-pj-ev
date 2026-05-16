// Variacoes de cor da capa: 5 itens variados x 4 cores de marca.
// Saida: tmp/preview/cover-colors/<cor>/NN-<id>.jpg

process.env.SLIDE_LAYOUT = "card02";

import fs from "node:fs/promises";
import path from "node:path";

const idx = JSON.parse(await fs.readFile("media/news/index.json", "utf8"));
const byId = new Map((idx.items || []).map((i) => [i.id, i]));

const { buildCoverSlide } = await import("./slide-image.mjs");

// 5 itens com fotos variadas (foto de banda hi-res, arte de album,
// poster de festival, foto media com realce, hi-res largo).
const PICKS = ["23c6120aaa", "bf1ba4fb94", "befbd1e214", "7ffb597882", "db8d720857"];
const COLORS = [
  { name: "preto",    hex: "#0a0a0a" },
  { name: "vermelho", hex: "#E10600" },
  { name: "ocre",     hex: "#a87f2c" },
  { name: "azul",     hex: "#2a5b9e" },
];

const ROOT = path.resolve("tmp/preview/cover-colors");
await fs.rm(ROOT, { recursive: true, force: true });

for (const c of COLORS) {
  const dir = path.join(ROOT, c.name);
  await fs.mkdir(dir, { recursive: true });
  let n = 0;
  for (const id of PICKS) {
    n++;
    const it = byId.get(id);
    if (!it) { console.log(`${c.name} ${id}: nao encontrado`); continue; }
    const destId = `_preview-cc-${c.name}-${n}`;
    try {
      const r = await buildCoverSlide(it, destId, c.hex);
      const friendly = `${String(n).padStart(2, "0")}-${id}.jpg`;
      await fs.copyFile(r.path, path.join(dir, friendly));
      await fs.rm(r.path, { force: true });
      console.log(`${c.name}  ${friendly}  ${(it.title_pt || "").slice(0, 60)}`);
    } catch (e) {
      console.log(`${c.name}  ERRO ${id}: ${e.message}`);
    }
  }
}
console.log(`\n${COLORS.length} cores x ${PICKS.length} itens em ${ROOT}`);
