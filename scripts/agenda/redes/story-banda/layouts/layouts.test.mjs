import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUTS, layoutsLigados, temaDoLayout } from "./index.mjs";
import { quadroSvg } from "../render.mjs";
import { variacaoDoDia } from "../variacao.mjs";
import { letraEm, linhasDoNome } from "./G/placas.mjs";

const story = { banda: "Pearl Jam Cover Ribeirão", conta: "@pjcr", contaPura: "pjcr", cidadeBase: "Ribeirão Preto/SP", desde: 2000,
  dia: "2026-11-14", shows: [
    { cidade: "Ribeirão Preto", uf: "SP", lonlat: [-47.81, -21.17], casa: "@pinguim", hora: "20:00" },
    { cidade: "Uberaba", uf: "MG", lonlat: [-47.93, -19.75], casa: null, hora: null }] };

test("layouts novos: cada um tem 4 temas e quadros SVG válidos, vazios no b-roll, sem travessão", () => {
  assert.ok(Object.keys(LAYOUTS).length >= 1);
  for (const nome of Object.keys(LAYOUTS)) {
    const cor = temaDoLayout(nome, "ocre");
    assert.ok(cor.bg, `${nome}: tema sem bg`);
    for (const r of [0.5, 2.8, 4, 8, 12, 15.5, 21]) {
      const svg = quadroSvg(r, story, cor, null, nome);
      assert.match(svg, /^<svg[\s\S]*<\/svg>$/, `${nome} em ${r}s`);
      assert.ok(!svg.includes("—") && !svg.includes("NaN"), `${nome} em ${r}s`);
    }
    assert.doesNotMatch(quadroSvg(5.8, story, cor, null, nome), /<text/, `${nome}: b-roll tem que ficar limpo`);
  }
});

test("layouts novos só entram no rodízio com AGENDA_LAYOUTS_NOVOS=1", () => {
  delete process.env.AGENDA_LAYOUTS_NOVOS;
  assert.deepEqual(layoutsLigados(), []);
  const sem = new Set(Array.from({ length: 30 }, (_, d) => variacaoDoDia(`2026-12-${String(d + 1).padStart(2, "0")}`, story)));
  assert.ok([...sem].every((v) => ["A", "B", "C"].includes(v)));
  process.env.AGENDA_LAYOUTS_NOVOS = "1";
  const com = new Set(Array.from({ length: 30 }, (_, d) => variacaoDoDia(`2026-12-${String(d + 1).padStart(2, "0")}`, story)));
  assert.ok(com.has("G"), "G aparece no mês");
  const dia = ["A", "B", "G"].reduce((u, _, k) => [...u, variacaoDoDia("2026-12-03", story, k, u)], []);
  assert.equal(new Set(dia).size, 3, "bandas do mesmo dia não repetem layout");
  delete process.env.AGENDA_LAYOUTS_NOVOS;
});

test("G: letra gira e para no lugar; nome quebra por palavra", () => {
  assert.equal(letraEm(1, "P", 0, 0.5, 3).ch, "P");
  assert.equal(letraEm(0.1, "P", 0, 0.5, 3).ch, letraEm(0.1, "P", 0, 0.5, 3).ch, "determinístico");
  assert.equal(letraEm(-1, "P", 0, 0.5, 3).ch, "");
  assert.deepEqual(linhasDoNome("Pearl Jam Cover Ribeirão"), ["PEARL JAM", "COVER", "RIBEIRÃO"]);
  assert.deepEqual(linhasDoNome("PJ 90"), ["PJ 90"]);
});
