// Bug 18/10/2026: a abertura do reel (e do story no padrão reel) mostrava o selo "CLIPE · MUDO", mas o vídeo tem
// trilha e narração. O selo mentia pra quem assistia. Correção: o selo foi desligado no átomo que o desenha.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { coldOpenSvg } from "../publish/reel/cenas-abertura-final.mjs";
import { kineticSvg } from "../publish/reel/cenas-blocos.mjs";

test("o render pede o selo nas cenas com clipe (prova de que ele aparecia)", () => {
  const render = fs.readFileSync(new URL("../publish/reel/render.mjs", import.meta.url), "utf8");
  assert.match(render, /showChip: ctx\.mode === "overlay"/);
});

test("abertura e cena cinética com clipe não dizem MUDO", () => {
  for (const t of [0.5, 1, 2]) {
    const abertura = coldOpenSvg(t, { accent: "#E10600", itemCount: 8, rangeLabel: "12 A 18 OUT", showChip: true });
    const cinetica = kineticSvg(t, { item: { title_pt: "Pearl Jam anuncia show", tags: ["pearl-jam"] }, n: 1, total: 8, accent: "#E10600", showChip: true });
    assert.doesNotMatch(abertura + cinetica, /MUDO/);
  }
});
