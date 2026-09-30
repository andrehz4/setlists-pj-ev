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
