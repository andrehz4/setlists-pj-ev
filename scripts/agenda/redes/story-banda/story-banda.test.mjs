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

import { variacaoDoDia, KM_MIN_ROTA } from "./variacao.mjs";
import { kmDaRota, pernas } from "./mapa-rota.mjs";
import { caneta } from "./mapa-papel.mjs";
const rib = { ...story, cidadeBase: "Ribeirão Preto/SP", baseLonlat: [-47.81, -21.18], shows: [{ cidade: "Três Lagoas", uf: "MS", lonlat: [-51.7, -20.78] }] };
const casa = { ...story, baseLonlat: [-46.54, -23.67] };
test("mapa: rodízio A/B/C por dia, rota só com estrada de verdade", () => {
  const dias = ["2026-10-10", "2026-10-11", "2026-10-12"];
  assert.deepEqual(new Set(dias.map((d) => variacaoDoDia(d, rib))), new Set(["A", "B", "C"]));
  const diaC = dias.find((d) => variacaoDoDia(d, rib) === "C");
  assert.equal(variacaoDoDia(diaC, casa), "B", "show na própria cidade: sem rota, cai pro papel");
  assert.ok(kmDaRota(rib) > KM_MIN_ROTA && kmDaRota(rib) < 450);
  assert.equal(kmDaRota(casa), 0);
  assert.equal(pernas(casa)[0].laco, true);
  const longe = { ...rib, shows: [{ ...rib.shows[0], aproximado: true }] };
  assert.equal(variacaoDoDia(diaC, longe), "B", "cidade fora da lista do IBGE: sem rota (km seria inventado)");
  assert.equal(variacaoDoDia(diaC, { ...rib, baseLonlat: null }), "B", "sem cidade de origem: sem rota");
});

test("mapa B e C: SVG válido em todas as fases, sem travessão", () => {
  for (const v of ["B", "C"]) for (const st of [story, rib, casa]) for (const r of [6.5, 7.9, 8.6, 9.4, 10.5]) {
    const svg = quadroSvg(r, st, cor, null, v);
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!svg.includes("NaN") && !svg.includes("—"), `${v} ${r}`);
  }
  assert.match(quadroSvg(8.9, rib, cor, null, "C"), /KM DE ESTRADA/);
  assert.match(quadroSvg(9.2, story, cor, null, "B"), /Permanent Marker/);
  const c = caneta(100, 100, 64, 1.3);
  assert.ok(c.len > 400 && c.len < 600, "círculo à caneta com volta e pouco");
});
