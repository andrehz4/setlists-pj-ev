// Testes do slide de citação "moldura" das cápsulas.
//   node --test scripts/publish/citacao/citacao.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolverAutor, carregarCatalogo, arquivoRetrato } from "./retratos.mjs";
import { quebrarCitacao, svgCitacao } from "./slide-citacao.mjs";

const DIR = path.dirname(new URL(import.meta.url).pathname);

test("autor com contexto separa nome e contexto e acha retrato", () => {
  const a = resolverAutor("Eddie Vedder, em 1990", "cap-x");
  assert.equal(a.nome, "Eddie Vedder");
  assert.equal(a.contexto, "em 1990");
  assert.equal(a.slug, "eddie-vedder");
  assert.match(a.foto, /eddie-vedder-[1-4]\.jpg$/);
});

test("contexto com vírgula extra fica inteiro", () => {
  const a = resolverAutor("Jeff Ament, segundo Dave Krusen, em 2020");
  assert.equal(a.slug, "jeff-ament");
  assert.equal(a.contexto, "segundo Dave Krusen, em 2020");
});

test("apelido e acento não atrapalham", () => {
  assert.equal(resolverAutor("stone").slug, "stone-gossard");
  assert.equal(resolverAutor("  Mike McCready ").slug, "mike-mccready");
});

test("quem não tem retrato sai sem foto, com o nome como veio", () => {
  for (const autor of ["David Letterman", "Pearl Jam, em 1991", "Eddie Vedder e Stone Gossard", "as filhas de Eddie Vedder"]) {
    const a = resolverAutor(autor);
    assert.equal(a.foto, null, autor);
    assert.ok(a.nome.length > 0);
  }
});

test("autor vazio cai no Eddie (mesmo padrão do slide antigo)", () => {
  assert.equal(resolverAutor("").slug, "eddie-vedder");
});

test("mesma cápsula sempre pega a mesma foto do Eddie", () => {
  const f = resolverAutor("Eddie Vedder", "cap-abc").foto;
  for (let i = 0; i < 5; i++) assert.equal(resolverAutor("Eddie Vedder", "cap-abc").foto, f);
});

test("todo retrato do catálogo existe em disco e é quadrado", async () => {
  const sharp = (await import("sharp")).default;
  for (const [slug, p] of Object.entries(carregarCatalogo())) {
    for (let n = 1; n <= p.fotos.length; n++) {
      const arq = arquivoRetrato(slug, n);
      assert.ok(fs.existsSync(arq), `falta ${arq}: rode build-retratos.mjs`);
      const m = await sharp(arq).metadata();
      assert.equal(m.width, m.height, arq);
    }
  }
});

test("quebra respeita a largura máxima medida", async () => {
  const medir = async (t, fs) => t.length * fs * 0.5;
  const r = await quebrarCitacao("uma frase comprida o bastante pra quebrar em várias linhas no slide", { maxW: 400, fsMax: 60, fsMin: 30, maxLines: 4 }, medir);
  assert.ok(r.linhas.length <= 4);
  for (const l of r.linhas) assert.ok((await medir(l, r.fs)) <= 400 || !l.includes(" "));
});

test("svg tem @smufdpj, escapa o texto e só desenha o círculo com foto", async () => {
  const base = { quote: "Rock & <roll>", bg: "#141821", accent: "#e04b53" };
  const sem = await svgCitacao({ ...base, autor: { nome: "David Letterman", contexto: "" }, fotoUri: null });
  assert.match(sem, /@smufdpj/);
  assert.match(sem, /Rock &amp; &lt;roll&gt;/);
  assert.doesNotMatch(sem, /<image/);
  const com = await svgCitacao({ ...base, autor: { nome: "Eddie Vedder", contexto: "em 1990" }, fotoUri: "data:image/jpeg;base64,AA==" });
  assert.match(com, /<image/);
  assert.match(com, /em 1990/);
});

test("Regra 0: arquivos do módulo ficam curtos", () => {
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs"))) {
    const linhas = fs.readFileSync(path.join(DIR, f), "utf8").split("\n").length;
    assert.ok(linhas <= 150, `${f} tem ${linhas} linhas`);
  }
});
