// Bug 18/10/2026: no card do reel a última letra da manchete sumia ("ENTROU" virava "ENTROI", "CALIFÓRNI").
// Causa: a máscara da revelação da manchete terminava em x 946 (54 + 892), mas a linha real, com o espaçamento
// entre letras da fonte, passa disso. Correção: a máscara vai até a borda da tela.
import test from "node:test";
import assert from "node:assert/strict";
import "../publish/fontconfig-boot.mjs";
import { layoutWords, measureText, F_ANTON, W } from "../publish/reel/base.mjs";
import { cardSvg } from "../publish/reel/cenas-blocos.mjs";

const item = { title_pt: "Jack Irons recusou ser o baterista do Pearl Jam em 1990, indicou um cantor chamado Eddie e, cinco anos depois, entrou na banda", tags: ["stone-gossard"] };
const size = 66; // manchete com mais de 60 caracteres

async function fimDaLinhaMaisLarga(layout) {
  let max = 0;
  for (const l of layout) max = Math.max(max, 60 + await measureText(l.map((w) => w.text).join(" "), { size, family: F_ANTON, letterSpacing: 0.5 }));
  return max;
}

test("máscara antiga (x 54 + 892) cortava a última letra (prova do bug)", async () => {
  const layout = await layoutWords(item.title_pt, size, 880);
  assert.ok(await fimDaLinhaMaisLarga(layout) > 54 + 892);
});

test("máscara atual cabe a linha inteira e não passa da tela", async () => {
  const layout = await layoutWords(item.title_pt, size, 880);
  const svg = cardSvg(3, { item, n: 4, total: 8, accent: "#E10600", layout });
  const [, x, w] = svg.match(/<clipPath id="card-title-4"><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/).map(Number);
  const fim = await fimDaLinhaMaisLarga(layout);
  assert.ok(x + w >= fim, `máscara termina em ${x + w}, linha em ${fim}`);
  assert.ok(fim <= W, `linha passa da tela: ${fim}`);
});
