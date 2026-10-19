// Bugs da arte "Agenda da semana" (18/10/2026; os dois primeiros achados pelo Claude Design na arte antiga):
// 1. a data em vermelho sumia quando o fundo da semana era vermelho;
// 2. com 10+ shows, a linha "+ N show(s)" caía em cima do rodapé;
// 3. na capa nova, cidade e @ da casa saíam grudados ("FRANCA/SP@therootsfranca"): o SVG junta os espaços entre tspans.
import test from "node:test";
import assert from "node:assert/strict";
import { svgSemana } from "../agenda/redes/arte-semana.mjs";
import { svgCapa, Y_RESTO, Y_RODAPE } from "../agenda/redes/carrossel/svg-capa.mjs";
import { CORES } from "../agenda/redes/carrossel/svg-base.mjs";

const show = (data, i) => ({ data, nome: `Banda ${i}`, banda: `banda${i}`, casa: `casa${i}`, cidade: "Franca", uf: "SP" });
const doze = Array.from({ length: 12 }, (_, i) => show(`2026-10-${String(12 + (i % 7)).padStart(2, "0")}`, i));
const ys = (svg, re) => [...svg.matchAll(re)].map((m) => Number(m[1]));

test("arte antiga: data vermelha no fundo vermelho (prova do bug 1)", () => {
  const svg = svgSemana(doze, "2026-10-12", "2026-10-18", "#E10600");
  assert.match(svg, /<rect [^>]*fill="#E10600"\/>/);
  assert.match(svg, /fill="#E10600">QUI 15\/10/);
});

test("capa nova: no vermelho o dia usa a cor do título sobre o ingresso creme, não o fundo", () => {
  const svg = svgCapa(doze, "2026-10-12", "2026-10-18", "vermelho");
  const cor = svg.match(/fill="([^"]+)" text-anchor="middle">QUI</)[1];
  assert.equal(cor, CORES.vermelho.titulo); // texto em cima do ingresso creme, legível
});

test("arte antiga: + N show(s) em cima do rodapé (prova do bug 2)", () => {
  const svg = svgSemana(doze, "2026-10-12", "2026-10-18");
  const resto = ys(svg, /y="(\d+)"[^>]*>\+ \d+ show/g)[0], rodape = ys(svg, /y="(\d+)"[^>]*>agenda completa/g)[0];
  assert.ok(rodape - resto < 30, `resto ${resto}, rodapé ${rodape}`);
});

test("capa nova: + N show(s) com folga do rodapé e depois do último ingresso", () => {
  const svg = svgCapa(doze, "2026-10-12", "2026-10-18", "azul");
  assert.match(svg, /\+ 3 show\(s\)/);
  assert.ok(Y_RODAPE - Y_RESTO >= 60);
  const ultimoIngresso = Math.max(...ys(svg, /<path d="M60,([\d.]+)/g));
  assert.ok(ultimoIngresso + 92 < Y_RESTO, `ingresso termina perto de ${ultimoIngresso + 92}`);
});

test("cidade e @ da casa com separação explícita (bug 3)", () => {
  const svg = svgCapa(doze.slice(0, 2), "2026-10-12", "2026-10-18", "azul");
  assert.match(svg, />FRANCA\/SP<\/tspan><tspan dx="14" [^>]*>@casa0</);
});
