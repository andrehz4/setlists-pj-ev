// Capas alternativas do carrossel: rodizio diario, encaixe da manchete e SVG.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { COVER_STYLES, coverStyleFor, tarjaColor, fitMeasured, planCover } from "./cover-styles.mjs";
import { coverSvg } from "./cover-styles-svg.mjs";

// Medida falsa e deterministica: meia largura do corpo por caractere.
const fake = async (t, o) => String(t).length * (typeof o === "number" ? o : o.size) * 0.5;

test("rodizio: 4 estilos, um por dia, virando a meia-noite de Brasilia", () => {
  assert.deepEqual(COVER_STYLES, ["card11", "poster", "zine", "ingresso"]);
  const dias = [0, 1, 2, 3, 4].map((d) => coverStyleFor(new Date(Date.UTC(2026, 8, 28 + d, 15)), undefined));
  assert.equal(new Set(dias.slice(0, 4)).size, 4, "4 dias seguidos = 4 estilos diferentes");
  assert.equal(dias[4], dias[0], "quinto dia repete o primeiro");
  const antes = coverStyleFor(new Date("2026-09-29T02:59:00Z"), undefined);
  const depois = coverStyleFor(new Date("2026-09-29T03:01:00Z"), undefined);
  assert.notEqual(antes, depois, "troca as 00:00 BRT (03:00 UTC)");
  assert.equal(antes, coverStyleFor(new Date("2026-09-28T12:00:00Z"), undefined), "23:59 BRT ainda e o dia anterior");
  assert.equal(coverStyleFor(new Date(), "zine"), "zine", "COVER_STYLE forca o estilo");
  assert.equal(coverStyleFor(new Date(0), "lixo"), coverStyleFor(new Date(0), undefined), "valor invalido ignora");
});

test("tarja contrasta com o fundo do ciclo", () => {
  assert.equal(tarjaColor("#0a0a0a"), "#E10600");
  assert.equal(tarjaColor("#E10600"), "#0a0a0a");
  assert.equal(tarjaColor("#a87f2c"), "#0a0a0a");
  assert.equal(tarjaColor("#2a5b9e"), "#E10600");
});

test("manchete: curta fica no corpo maximo; longa reduz e respeita 3 linhas", async () => {
  const spec = { maxW: 968, fsMax: 112, fsMin: 76 };
  const curta = await fitMeasured("novo baterista", spec, fake);
  assert.equal(curta.fs, 112);
  assert.deepEqual(curta.lines, ["NOVO BATERISTA"]);
  const longa = await fitMeasured("Jeff Ament abre o arquivo e apresenta o novo baterista da banda", spec, fake);
  assert.ok(longa.lines.length <= 3 && longa.fs < 112);
  for (const l of longa.lines) assert.ok((await fake(l, longa.fs)) <= 968, `cabe: ${l}`);
});

test("manchete que nao cabe nem no minimo corta com reticencias", async () => {
  const r = await fitMeasured("palavra ".repeat(40), { maxW: 400, fsMax: 60, fsMin: 56 }, fake);
  assert.equal(r.lines.length, 3);
  assert.ok(r.lines[2].endsWith("…"));
  assert.ok((await fake(r.lines[2], 56)) <= 400);
});

test("plano: poster tem foto ate a tarja; zine mede tiras; ultima baseline fixa", async () => {
  const item = { headline: "Pearl Jam anuncia turne", label: "PEARL JAM · TURNÊ" };
  const p = await planCover("poster", item, fake);
  assert.equal(p.photo.h, p.tarja.y + 22);
  assert.equal(p.lines.at(-1).y, 1226);
  assert.ok(p.photo.bw);
  const z = await planCover("zine", item, fake);
  assert.equal(z.lines.at(-1).y, 1214);
  assert.ok(z.lines.every((l) => l.rw > 28 && typeof l.rot === "number"));
  const i = await planCover("ingresso", item, fake);
  assert.equal(i.lines.at(-1).y, 1228);
  assert.equal(i.photo.bw, false);
  await assert.rejects(planCover("xyz", item, fake));
});

test("svg: 1080x1350, escapa texto, foto opcional", async () => {
  for (const style of ["poster", "zine", "ingresso"]) {
    const p = await planCover(style, { headline: "Eddie & <Vedder>", label: "PEARL JAM · EDDIE" }, fake);
    const semFoto = coverSvg(p, "#0a0a0a");
    assert.match(semFoto, /width="1080" height="1350"/);
    assert.match(semFoto, /EDDIE &amp; &lt;VEDDER&gt;/);
    assert.match(semFoto, /somaisumfadepearljam\.com\.br/);
    assert.doesNotMatch(semFoto, /<image/);
    assert.match(coverSvg(p, "#E10600", "data:image/jpeg;base64,AAAA"), /<image[^>]+base64,AAAA/);
  }
});

test("modulo curto: ate 160 linhas e 130 colunas", () => {
  for (const f of ["scripts/publish/cover-styles.mjs", "scripts/publish/cover-styles-svg.mjs"]) {
    const linhas = fs.readFileSync(f, "utf8").split("\n");
    assert.ok(linhas.length <= 160, `${f}: ${linhas.length} linhas`);
    linhas.forEach((l, i) => assert.ok(l.length <= 130, `${f}:${i + 1}`));
  }
});
