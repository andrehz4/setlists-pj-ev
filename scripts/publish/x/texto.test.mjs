import test from "node:test";
import assert from "node:assert/strict";
import { textoNoticia, tamanhoX, linkMateria, LIMITE } from "./texto.mjs";

const item = { id: "x-1", title_pt: "Título", intro_pt: "Frase um. ".repeat(40) };

test("sem link por padrão (API cobra mais por URL)", () => {
  assert.doesNotMatch(textoNoticia(item), /https?:/);
});

test("com link: X conta URL como 23 e o texto cabe em 280", () => {
  const t = textoNoticia(item, { link: linkMateria("x-1") });
  assert.match(t, /Matéria completa: https:\/\/somaisumfadepearljam\.com\.br\/n\/x-1$/m);
  assert.equal(tamanhoX("https://exemplo.com/um/caminho/bem/comprido/mesmo"), 23);
  assert.ok(tamanhoX(t) <= LIMITE);
});

test("corte não para em abreviação (Jr.)", () => {
  const t = textoNoticia({ id: "a", title_pt: "T".repeat(150), intro_pt: "Abe Laboriel Jr. tocou no Ohana. " + "Mais texto aqui. ".repeat(20) });
  assert.doesNotMatch(t, /Jr\.\n/);
});

test("conferir aponta estouro, travessão e falta de link", async () => {
  const { problemas } = await import("./conferir.mjs");
  assert.deepEqual(problemas("Oi — tchau"), ["tem travessão", "sem link da matéria", "sem #PearlJam"]);
  assert.deepEqual(problemas("Oi\n\nhttps://somaisumfadepearljam.com.br/n/a\n\n#PearlJam"), []);
});
