// Prova da data (23/11/2026): show só entra se a data estiver escrita na fonte. Nasceu do caso Blaymorphed: a agenda
// semanal do Santo Rock virou show numa quinta 26 que ninguém anunciou.
import test from "node:test";
import assert from "node:assert/strict";
import { dataEscrita, separarSemProva } from "../agenda/prova/index.mjs";

test("formatos reais das bandas contam como prova", () => {
  assert.ok(dataEscrita("The Homer Pearl jam Agenda:\n\n28/11 Iron Rock", "2026-11-28"));
  assert.ok(dataEscrita("🔥 SEXTA | 27/11 – PEARL JAM COVER", "2026-11-27"));
  assert.ok(dataEscrita("show dia 27.11 no bar", "2026-11-27"));
  assert.ok(dataEscrita("📍DIA 19 DE NOVEMBRO 21H", "2026-11-19"));
  assert.ok(dataEscrita("🔥ÚLTIMOS SHOWS DE NOVEMBRO🔥\n\n27. SEXTA-FEIRA \n🏠 livemusicbar", "2026-11-27"));
  assert.ok(dataEscrita("Novembro 2026\nSEX 27 - SANTO ROCK BAR", "2026-11-27"));
});

test("data que não está escrita não tem prova", () => {
  assert.ok(!dataEscrita("Sábado tem loveboat_tribute no Studio Rock", "2026-11-28"));
  assert.ok(!dataEscrita("🔥 SEXTA | 27/11 – PEARL JAM COVER", "2026-11-26"));
  assert.ok(!dataEscrita("27. SEXTA-FEIRA sem mês nenhum", "2026-11-27"));
  assert.ok(!dataEscrita("dia 127 de rock 11/2026", "2026-11-27"));
});

test("show sem prova fica segurado; aprovado à mão e arte lida passam; AGENDA_PROVA=0 desliga", () => {
  const posts = new Map([["L1", { legenda: "Sábado tem show" }], ["L2", { legenda: "agenda na imagem", arte: [{ data: "2026-11-27" }] }]]);
  const a = { id: "a", data: "2026-11-28", fonte: "L1" }, b = { id: "b", data: "2026-11-27", fonte: "L2" }, c = { id: "c", data: "2026-11-29", fonte: "SUMIU" };
  assert.deepEqual(separarSemProva([a, b, c], posts, new Set(), {}).semProva.map((s) => s.id), ["a", "c"]);
  assert.deepEqual(separarSemProva([a, b, c], posts, new Set(["a"]), {}).semProva.map((s) => s.id), ["c"]);
  assert.equal(separarSemProva([a, b, c], posts, new Set(), { AGENDA_PROVA: "0" }).semProva.length, 0);
});
