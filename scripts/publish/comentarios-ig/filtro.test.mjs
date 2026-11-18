import test from "node:test";
import assert from "node:assert/strict";
import { tipoIngresso } from "./filtro.mjs";

test("comentários reais de venda viram 'venda'", () => {
  for (const t of ["Tenho 2 ingressos para o dia 22, inteira. Se tiver interesse me chame no direct pf.",
    "Tenho dois ingressos a preço de custo para o dia 20.", "Estou com um ingresso à venda",
    "Vendo 2 ingressos meia entrada dia 22 domingo", "Repasso o ingresso por 850 cada"]) {
    assert.equal(tipoIngresso(t), "venda", t);
  }
});

test("procura vira 'procura' e comentário de música fica de fora", () => {
  assert.equal(tipoIngresso("Procuro 2 pro domingo"), "procura");
  assert.equal(tipoIngresso("Alguém vendendo pra sexta?"), "procura");
  for (const t of ["Black e Sirens!!!!!", "Domingo estarei la, se Deus permitir.", "Tô vivendo p/ chegar sexta 🙌",
    "Infelizmente vou trabalhar neste feriado"]) assert.equal(tipoIngresso(t), null, t);
});
