import { test } from "node:test";
import assert from "node:assert/strict";
import { preposicao, saudacao, showsDoDiaPorUf, contasDoShow, horaCurta } from "./regiao.mjs";
import { showsDaSemana, legendaSemana, contasDaSemana, segundaDa, diaSemana } from "./semana.mjs";
import { svgStory } from "./arte-story.mjs";
import { svgSemana } from "./arte-semana.mjs";

const sh = (o) => ({ banda: "blaymorphed", nome: "Blaymorphed", cidade: "Mauá", uf: "SP", ...o });
const SHOWS = [
  sh({ id: "a", data: "2026-10-05", casa: "comics_smashburger", hora: "20:00" }),
  sh({ id: "b", data: "2026-10-10", banda: "blackcirclepj", nome: "Black Circle", cidade: "Rio de Janeiro", uf: "RJ" }),
  sh({ id: "c", data: "2026-10-10", casa: "acervodotuzzibar" }),
  sh({ id: "d", data: "2026-10-10", fechado: true }),
  sh({ id: "e", data: "2026-10-10", uf: null }),
  sh({ id: "f", data: "2026-10-12" }),
];

test("saudação usa o artigo certo do estado", () => {
  assert.equal(saudacao("RJ"), "ALÔ, PESSOAL DO RJ!");
  assert.equal(saudacao("SP"), "ALÔ, PESSOAL DE SP!");
  assert.equal(preposicao("BA"), "da");
  assert.equal(preposicao("MG"), "de");
});

test("shows do dia: agrupa por estado, ignora fechado e sem UF", () => {
  const g = showsDoDiaPorUf(SHOWS, "2026-10-10");
  assert.deepEqual(g.map(([uf, l]) => [uf, l.map((s) => s.id)]), [["RJ", ["b"]], ["SP", ["c"]]]);
  assert.deepEqual(showsDoDiaPorUf(SHOWS, "2026-10-06"), []);
});

test("contas e hora curta", () => {
  assert.deepEqual(contasDoShow(SHOWS[0]), ["blaymorphed", "comics_smashburger"]);
  assert.deepEqual(contasDoShow(SHOWS[1]), ["blackcirclepj"]);
  assert.equal(horaCurta("20:00"), "20h");
  assert.equal(horaCurta("21:30"), "21h30");
  assert.equal(horaCurta(null), null);
});

test("semana: segunda da semana e janela de 7 dias", () => {
  assert.equal(segundaDa("2026-10-05"), "2026-10-05");
  assert.equal(segundaDa("2026-10-11"), "2026-10-05");
  assert.equal(segundaDa("2026-10-08"), "2026-10-05");
  assert.equal(diaSemana("2026-10-10"), "sáb");
  assert.deepEqual(showsDaSemana(SHOWS, "2026-10-05").map((s) => s.id), ["a", "b", "c", "e"]);
});

test("legenda da semana tem @ da banda e @ da casa, sem fechado", () => {
  const l = legendaSemana(showsDaSemana(SHOWS, "2026-10-05"), "2026-10-05");
  assert.match(l, /seg 05\/10 · @blaymorphed no @comics_smashburger, Mauá\/SP \(20h\)/);
  assert.match(l, /sáb 10\/10 · @blackcirclepj Rio de Janeiro\/RJ/);
  assert.match(l, /05\/10 a 11\/10/);
  assert.match(l, /somaisumfadepearljam\.com\.br\/agenda/);
  assert.ok(!l.includes("—"), "sem travessão");
  assert.ok(l.length <= 2200);
});

test("contas da semana sem repetição", () => {
  assert.deepEqual(contasDaSemana(showsDaSemana(SHOWS, "2026-10-05")),
    ["blaymorphed", "comics_smashburger", "blackcirclepj", "acervodotuzzibar"]);
});

test("artes escapam texto e cortam o excesso", () => {
  const story = svgStory("SP", [sh({ data: "2026-10-05", nome: "R&B <x>", casa: "bar" })]);
  assert.match(story, /R&amp;B &lt;X&gt;|R&amp;B &lt;x&gt;/);
  assert.match(story, /PESSOAL DE SP/);
  const muitos = Array.from({ length: 12 }, (_, i) => sh({ id: `m${i}`, data: "2026-10-06" }));
  const sem = svgSemana(muitos, "2026-10-05", "2026-10-11");
  assert.match(sem, /\+ 3 show\(s\) na agenda do site/);
});
