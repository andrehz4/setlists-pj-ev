import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import "../../../publish/fontconfig-boot.mjs";
import { measureText } from "../../../publish/reel/base.mjs";
import { F_ANTON } from "../../../publish/fontconfig-boot.mjs";
import { planoDoCarrossel, paginasDaCapa, resumoCurto, bandasDaSemana, svgsDoCarrossel, MAX_SLIDES } from "./montar.mjs";
import { caber, corDoCiclo } from "./svg-base.mjs";
import { quebrar, iniciais } from "./svg-banda.mjs";

const show = (data, banda, casa) => ({ data, nome: banda.toUpperCase(), banda, casa, cidade: "Franca", uf: "SP" });

test("plano: capa + 1 por banda (ordem do 1º show) + chamada; contas certas em cada slide", () => {
  const lista = [show("2026-10-16", "b", "casa2"), show("2026-10-15", "a", "casa1"), show("2026-10-17", "a", "casa3")];
  const p = planoDoCarrossel(lista);
  assert.deepEqual(p.map((s) => s.tipo), ["capa", "banda", "banda", "chamada"]);
  assert.deepEqual(p[0].contas, ["a", "b"]);
  assert.deepEqual(p[1].contas, ["a", "casa1", "casa3"]);
  assert.deepEqual(p[3].contas, []);
});

test("plano: nunca passa de 10 slides; capas têm prioridade, depois bandas, chamada se sobrar", () => {
  const lista = Array.from({ length: 12 }, (_, i) => show("2026-10-15", `banda${i}`, null));
  const p = planoDoCarrossel(lista);
  assert.equal(p.length, MAX_SLIDES);
  assert.deepEqual(p.map((s) => s.tipo), ["capa", "capa", ...Array(8).fill("banda")]);
  assert.equal(bandasDaSemana(lista).length, 12); // as que sobram ficam na capa
});

test("semana cheia: 2ª página da capa (dividida por igual) em vez de '+ N shows'; + N só depois de 18", () => {
  const n = (k) => Array.from({ length: k }, (_, i) => show(`2026-10-${String(19 + (i % 7)).padStart(2, "0")}`, "a", null));
  assert.deepEqual(paginasDaCapa(n(9)).map((p) => [p.shows.length, p.parte, p.resto]), [[9, null, 0]]);
  assert.deepEqual(paginasDaCapa(n(10)).map((p) => [p.shows.length, p.parte, p.resto]), [[5, "1/2", 0], [5, "2/2", 0]]);
  assert.deepEqual(paginasDaCapa(n(20)).map((p) => [p.shows.length, p.parte, p.resto]), [[9, "1/2", 0], [9, "2/2", 2]]);
  const capas = planoDoCarrossel(n(10)).filter((s) => s.tipo === "capa");
  assert.equal(capas.length, 2);
});

test("resumo curto = 1ª frase; quebra em até 3 linhas com reticências", () => {
  assert.equal(resumoCurto("Formada em 2016. Toca muito."), "Formada em 2016.");
  const l = quebrar("palavra ".repeat(80), 26, "sb", 660, 3);
  assert.equal(l.length, 3);
  assert.ok(l[2].endsWith("…"));
});

test("iniciais e cor do ciclo", () => {
  assert.equal(iniciais("Pearl Jam Cover Ribeirão"), "PJC");
  assert.equal(iniciais("PJ 90"), "PJ90");
  assert.equal(corDoCiclo("#E10600"), "vermelho");
  assert.equal(corDoCiclo("#123456"), "azul");
});

// A largura do desenho é estimada; aqui mede com a fonte real que o texto cabe no espaço (nomes reais + pior caso).
test("nomes de banda cabem no ingresso medindo com a fonte real", async () => {
  const bandas = JSON.parse(fs.readFileSync(new URL("../../../../media/agenda/bandas.json", import.meta.url)));
  const nomes = [...(bandas.bandas || bandas).map((b) => b.nome.toUpperCase()), "PEARL JAM COVER RIBEIRÃO PRETO TRIBUTO"];
  for (const nome of nomes) {
    const size = caber(nome, 46, "anton", 706);
    const real = await measureText(nome, { size, family: F_ANTON });
    assert.ok(real <= 706, `${nome}: ${real}px em 706`);
  }
});

test("todos os slides geram SVG válido nas 4 cores (sem foto)", async () => {
  const lista = [show("2026-10-15", "a", "casa1"), show("2026-10-16", "b", null)];
  for (const cor of ["preto", "vermelho", "ocre", "azul"]) {
    const s = await svgsDoCarrossel(lista, [], "2026-10-12", "2026-10-18", cor, { dirFotos: "/nao/existe" });
    assert.equal(s.length, 4);
    for (const sl of s) assert.match(sl.svg, /^<svg[\s\S]*<\/svg>$/);
  }
});
