import { test } from "node:test";
import assert from "node:assert/strict";
import { momento, DURACAO } from "./tempo.mjs";
import { quebrarNome } from "./pecas.mjs";
import { quadroSvg } from "./render.mjs";

const story = { banda: "PJ 90", conta: "@pjnoventa", cidadeBase: "São Paulo/SP", desde: 2015, dia: "2026-10-10",
  shows: [{ cidade: "Santo André", uf: "SP", lonlat: [-46.54, -23.67], casa: "@beersfestival", hora: "17:30" }] };
const cor = { bg: "#2a5b9e", pin: "#E10600", strip: "#E10600" };

test("roteiro de 21 s: cortes de b-roll entre as cenas e final segurando", () => {
  assert.ok(DURACAO > 20 && DURACAO < 22);
  assert.equal(momento(5.8).broll, 1);
  assert.equal(momento(14.5).broll, 2);
  assert.equal(momento(20.9).T, 15);
});

test("nome da banda no maior corpo que cabe", () => {
  assert.deepEqual(quebrarNome("PJ 90"), { linhas: ["PJ 90"], f: 240 });
  assert.ok(quebrarNome("Pearl Jam Cover Ribeirão").linhas.length <= 3);
});

test("quadros: SVG válido nas cenas, vazio no b-roll, sem travessão", () => {
  for (const r of [1, 4, 8, 12, 18]) assert.match(quadroSvg(r, story, cor, null), /^<svg[\s\S]*<\/svg>$/);
  assert.doesNotMatch(quadroSvg(5.8, story, cor, null), /<text/);
  assert.ok(!quadroSvg(12, story, cor, null).includes("—"));
});

import { encaixar, variacaoQueCabe } from "./encaixe.mjs";
test("encaixe: fala que cabe não acelera, que passa um pouco acelera, que passa muito troca de variação", () => {
  const e = encaixar({ abertura: 4.72, final: 7.04 });
  assert.equal(e.abertura.atempo, 1);
  assert.ok(e.final.atempo > 1 && e.final.cabe, "final de 7 s acelera um pouco e cabe");
  assert.equal(encaixar({ final: 9 }).final.cabe, false);
  assert.equal(variacaoQueCabe("abertura", [8, 7.5, 5]), 2, "pula as longas e fica com a que cabe");
  assert.equal(variacaoQueCabe("abertura", [9, 9]), null);
});
