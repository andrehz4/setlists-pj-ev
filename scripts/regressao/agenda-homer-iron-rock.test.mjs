// Agenda (14/11/2026): The Homer postou "28/11 Iron Rock" (nome da casa, sem cidade). O extrator leu como cidade
// e o story de 28/11 ia sair com "IRON ROCK" no lugar da cidade. Correção manual em media/agenda/correcoes.json,
// aplicada pela coleta a cada run (scripts/agenda/correcoes.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { montarAgenda } from "../agenda/montar.mjs";
import { aplicarCorrecoes, lerCorrecoes } from "../agenda/correcoes.mjs";

const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/agenda-pj90-homer.json", import.meta.url), "utf8"));
const HOMER = { conta: "thehomerpj", nome: "The Homer", uf: "MG" };
const ID = "thehomerpj-2026-11-28-iron-rock";

test("regra antiga: 'Iron Rock' (casa) saía como cidade (prova do bug)", () => {
  const s = montarAgenda(HOMER, [fx.thehomerpj], "2026-11-01").find((x) => x.data === "2026-11-28");
  assert.equal(s.id, ID);
  assert.equal(s.cidade, "Iron Rock");
});

test("com a correção do arquivo real, Iron Rock vira casa e o id não muda", async () => {
  const corr = await lerCorrecoes();
  const s = aplicarCorrecoes(montarAgenda(HOMER, [fx.thehomerpj], "2026-11-01"), corr).find((x) => x.data === "2026-11-28");
  assert.equal(s.id, ID);
  assert.equal(s.casaNome, "Iron Rock");
  assert.notEqual(s.cidade, "Iron Rock");
});

test("campo fora da lista derruba a coleta (não aceita correção torta em silêncio)", () => {
  assert.throws(() => aplicarCorrecoes([{ id: "x" }], { x: { banda: "outra" } }), /campo não permitido/);
});
