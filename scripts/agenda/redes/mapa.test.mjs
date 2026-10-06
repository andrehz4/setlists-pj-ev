import { test } from "node:test";
import assert from "node:assert/strict";
import { localizar, cidadesDoDia, projecao } from "./mapa.mjs";
import { afastar, svgMapa } from "./arte-mapa.mjs";

test("localiza cidade pelo IBGE, com apelido e com reserva no meio do estado", () => {
  const b = localizar("Bragança Pta", "SP");
  assert.equal(b.nome, "Bragança Paulista");
  assert.deepEqual(b.pos.map(Math.round), [-47, -23]);
  const x = localizar("Cidade Que Não Existe", "RJ");
  assert.equal(x.nome, "Cidade Que Não Existe");
  assert.ok(x.pos[0] > -45 && x.pos[0] < -40, "cai dentro do RJ");
  assert.equal(x.aproximado, true);
  assert.equal(localizar("São Bernardo", "SP").nome, "São Bernardo do Campo", "nome cortado que só um município completa");
  assert.equal(localizar("Santo", "SP").aproximado, true, "começo ambíguo não chuta");
  assert.equal(localizar("Lugar", null), null);
});

test("cidades do dia: um ponto por cidade, sem estado fica de fora", () => {
  const c = cidadesDoDia([
    { banda: "a", cidade: "Bragança Pta", uf: "SP" }, { banda: "b", cidade: "Bragança Paulista", uf: "SP" },
    { banda: "c", cidade: "Rio de Janeiro", uf: "RJ" }, { banda: "d", cidade: "Barreiro", uf: null },
  ]);
  assert.deepEqual(c.map((x) => [x.cidade, x.shows.length]), [["Bragança Paulista", 2], ["Rio de Janeiro", 1]]);
});

test("projeção cabe no quadro e pinos sobrepostos se afastam", () => {
  const proj = projecao([[-46.5, -23.5], [-43.2, -22.9]], { x: 0, y: 0, w: 1000, h: 700 });
  for (const p of [[-46.5, -23.5], [-43.2, -22.9]]) { const [x, y] = proj(p); assert.ok(x > 0 && x < 1000 && y > 0 && y < 700); }
  const [a, b] = afastar([[500, 900], [505, 902]]);
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) >= 50);
});

test("arte: título com contagem, @ das bandas e sem travessão", () => {
  const svg = svgMapa([{ banda: "blaymorphed", cidade: "Santo André", uf: "SP" }, { banda: "pjnoventa", cidade: "Santo André", uf: "SP" }], "2026-10-10");
  assert.match(svg, /SÁBADO 10\/10  ·  2 SHOWS EM 1 CIDADE/);
  assert.match(svg, /@blaymorphed  ·  @pjnoventa/);
  assert.ok(!svg.includes("—"));
});
