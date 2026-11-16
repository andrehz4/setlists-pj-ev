import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PALETAS, cssDoSlide, htmlDoSlide, resolverPaleta, rotulos } from "./paletas.mjs";

const MODELO = new URL("../../../media/carrossel/ranking/modelo.html", import.meta.url);

test("paleta por nome e paleta parcial por cima da amarela", () => {
  assert.equal(resolverPaleta("verde").destaque, PALETAS.verde.destaque);
  const p = resolverPaleta({ destaque: "#00ff00" });
  assert.equal(p.destaque, "#00ff00");
  assert.equal(p.fundo, PALETAS.amarelo.fundo);
});

test("paleta desconhecida ou cor inválida derruba", () => {
  assert.throws(() => resolverPaleta("roxo-inexistente"), /paleta desconhecida/);
  assert.throws(() => resolverPaleta({ alerta: "vermelho" }), /cor inválida em alerta/);
});

test("todas as paletas prontas são válidas", () => {
  for (const nome of Object.keys(PALETAS)) assert.ok(resolverPaleta(nome));
});

test("css mostra só o slide pedido e troca as variáveis", () => {
  const css = cssDoSlide(PALETAS.azul, "slide-03");
  assert.match(css, /--destaque:#4FC3F7/);
  assert.match(css, /\[data-screen-label="slide-03"\]\{display:block/);
});

test("modelo do repo: 10 slides, cores em variáveis, sem hex da paleta solto", () => {
  const html = fs.readFileSync(MODELO, "utf8");
  assert.equal(rotulos(html).length, 10);
  const corpo = html.slice(html.indexOf("</style>"));
  assert.doesNotMatch(corpo, /#FFCC1A|#14110F|#E0361C/i, "cor da paleta escrita direto no slide");
  assert.match(htmlDoSlide(html, PALETAS.rosa, "slide-01"), /--destaque:#FF3D7F/);
});

test("html que não é export do Design derruba", () => {
  assert.throws(() => htmlDoSlide("<html></html>", PALETAS.amarelo, "slide-01"), /helmet/);
});
