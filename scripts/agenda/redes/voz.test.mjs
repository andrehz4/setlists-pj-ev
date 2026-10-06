import { test } from "node:test";
import assert from "node:assert/strict";
import { falasNecessarias, falasDoStory, arquivoDaFala, nomeFalado } from "./voz.mjs";

test("falas fixas: 3 aberturas por banda + 3 finais, nome falado do jeito certo", () => {
  const f = falasNecessarias(["PJ 90", "Lost Dogs"]);
  assert.equal(f.length, 9);
  assert.ok(f.some((t) => t.includes("P J Noventa")));
  assert.equal(nomeFalado("Lost Dogs"), "Lost Dogs");
});

test("story do dia: rodízio pelo dia e arquivo pelo texto (mesma frase = mesmo arquivo)", () => {
  const a = falasDoStory("Lost Dogs", "2026-10-10"), b = falasDoStory("Lost Dogs", "2026-10-11");
  assert.notEqual(a.textos.abertura, b.textos.abertura);
  assert.equal(a.abertura, arquivoDaFala(a.textos.abertura));
  assert.ok(!Object.values(a.textos).join(" ").includes("—"));
});
