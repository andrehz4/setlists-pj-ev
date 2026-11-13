// Bug (13/11/2026): banda cadastrada sem ano de início (Love Boat Tribute) aparecia em /agenda/ como "desde undefined".
import test from "node:test";
import assert from "node:assert/strict";
import { paginaAgenda } from "../agenda/pagina.mjs";

const base = { conta: "x", nome: "Banda X", cidade: "Santos", uf: "SP", resumo: "Tributo." };

test("banda sem 'desde' não mostra a linha do ano", () => {
  const html = paginaAgenda({ shows: [], bandas: [base], hoje: "2026-11-13" });
  assert.doesNotMatch(html, /undefined/);
  assert.doesNotMatch(html, /<p class="ag-banda-desde">/);
});

test("banda com 'desde' continua mostrando o ano", () => {
  const html = paginaAgenda({ shows: [], bandas: [{ ...base, desde: 2010 }], hoje: "2026-11-13" });
  assert.match(html, /desde <span>2010<\/span>/);
});
