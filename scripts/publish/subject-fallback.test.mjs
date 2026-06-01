// Testa o fallback por assunto: deteccao da pessoa citada na noticia e a
// resolucao da foto no pool media/band/subjects/<pessoa>/.
// Rodar: node --test scripts/publish/subject-fallback.test.mjs

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { detectSubject, subjectFallbackPath, SUBJECTS, SUBJECTS_ROOT } from "./subject-fallback.mjs";

describe("detectSubject", () => {
  test("detecta Jack Irons por titulo", () => {
    assert.equal(detectSubject({ title_pt: "Jack Irons de volta ao estudio" }), "jack-irons");
  });
  test("detecta por tag com hifen", () => {
    assert.equal(detectSubject({ tags: ["pearljam", "jack-irons"] }), "jack-irons");
  });
  test("detecta integrantes por sobrenome", () => {
    assert.equal(detectSubject({ title_pt: "Entrevista com McCready" }), "mike-mccready");
    assert.equal(detectSubject({ title_pt: "Vedder lanca musica solo" }), "eddie-vedder");
    assert.equal(detectSubject({ intro_pt: "Stone Gossard fala do novo disco" }), "stone-gossard");
    assert.equal(detectSubject({ title_pt: "Jeff Ament e a capa de Yield" }), "jeff-ament");
  });
  test("detecta ex-bateristas", () => {
    assert.equal(detectSubject({ title_pt: "Dave Abbruzzese relembra Vs." }), "dave-abbruzzese");
    assert.equal(detectSubject({ title_pt: "Dave Krusen na era Ten" }), "dave-krusen");
    assert.equal(detectSubject({ title_pt: "Matt Cameron deixa a banda" }), "matt-cameron");
  });
  test("noticia generica sem pessoa retorna null", () => {
    assert.equal(detectSubject({ title_pt: "Pearl Jam anuncia turne mundial" }), null);
  });
  test("item vazio nao lanca", () => {
    assert.doesNotThrow(() => detectSubject(null));
    assert.equal(detectSubject({}), null);
  });
  test("primeiro match vence quando cita dois", () => {
    // jack-irons vem antes de eddie-vedder na ordem
    assert.equal(detectSubject({ title_pt: "Jack Irons e Eddie Vedder no estudio" }), "jack-irons");
  });
});

describe("subjectFallbackPath (pools reais em media/band/subjects/)", () => {
  test("Jack Irons resolve pra uma foto do pool dele", async () => {
    const p = await subjectFallbackPath({ id: "abc123", title_pt: "Jack Irons grava bateria" });
    assert.ok(p, "deveria achar foto");
    assert.ok(p.includes(path.join("subjects", "jack-irons")), `caminho fora do pool: ${p}`);
    assert.match(p, /\.jpg$/i);
  });
  test("noticia generica nao resolve (null)", async () => {
    const p = await subjectFallbackPath({ id: "x", title_pt: "Pearl Jam na Billboard" });
    assert.equal(p, null);
  });
  test("todo subject mapeado tem ao menos 1 foto no disco", async () => {
    const faltando = [];
    const fs = await import("node:fs/promises");
    for (const s of SUBJECTS) {
      const dir = path.join(SUBJECTS_ROOT, s.key);
      const files = await fs.readdir(dir).catch(() => []);
      const jpgs = files.filter((f) => /\.jpg$/i.test(f));
      if (jpgs.length === 0) faltando.push(s.key);
    }
    assert.equal(faltando.length, 0, `pools sem foto: ${faltando.join(", ")}`);
  });
});
