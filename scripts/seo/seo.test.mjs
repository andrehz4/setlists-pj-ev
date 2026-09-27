// Páginas estáticas de show (/show/<id>) e índice /show/.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { paginaShow, tituloShow, cidadeCurta } from "./show-page.mjs";
import { gerarArquivos } from "./build-show-pages.mjs";
import { lerDadosSite, lerColecao } from "./dados-site.mjs";

const SHOW = {
  id: "pj-2015-11-22", artist: "Pearl Jam", date: "2015-11-22", venue: "Estádio do Maracanã", city: "Rio de Janeiro, BR",
  tour: "Latin American Tour 2015", source: "pearljam.com (oficial)", songs: ["Oceans", "Black <b>", "Yellow Ledbetter"],
  note: "Nota do show.", soundcheck: ["Inside Job"],
};

test("título com cidade, data e preposição certa", () => {
  assert.equal(tituloShow(SHOW), "Pearl Jam no Rio de Janeiro, 22/11/2015: setlist completo");
  assert.equal(tituloShow({ ...SHOW, city: "São Paulo, BR" }), "Pearl Jam em São Paulo, 22/11/2015: setlist completo");
  assert.equal(cidadeCurta("Dana Point, CA, US"), "Dana Point");
});

test("página do show: setlist escapado, canonical, MusicEvent e sem travessão", () => {
  const h = paginaShow(SHOW, [SHOW, { ...SHOW, id: "pj-2005-12-02", date: "2005-12-02" }], { "pj-2015-11-22": { photos: 9 } });
  assert.match(h, /<link rel="canonical" href="https:\/\/setlists-pj-ev\.pages\.dev\/show\/pj-2015-11-22">/);
  assert.ok(h.includes("<li>Black &lt;b&gt;</li>"));
  assert.ok(h.includes("<h2>Passagem de som</h2>"));
  assert.equal((h.match(/photo-\d-thumb\.jpg/g) || []).length, 4, "no máximo 4 fotos");
  assert.ok(h.includes('<a href="/show/pj-2005-12-02">'));
  assert.ok(!h.includes('<a href="/show/pj-2015-11-22">'), "não linka pra si mesmo");
  const ld = JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(ld[0]["@type"], "MusicEvent");
  assert.equal(ld[0].location.name, "Estádio do Maracanã");
  assert.ok(!h.includes("—"));
});

test("sitemap ganha a seção de shows sem mexer nas notícias", () => {
  const base = "<urlset>\n<!-- news:start -->\nX\n<!-- news:end -->\n</urlset>";
  const s = gerarArquivos({ shows: [SHOW], midia: {} }, base)["sitemap.xml"];
  assert.ok(s.includes("<!-- news:start -->\nX\n<!-- news:end -->"));
  assert.ok(s.includes("<loc>https://setlists-pj-ev.pages.dev/show/pj-2015-11-22</loc>"));
  const de_novo = gerarArquivos({ shows: [SHOW], midia: {} }, s)["sitemap.xml"];
  assert.equal(de_novo, s, "idempotente");
});

test("lerColecao lê o JSON embutido", () => {
  assert.deepEqual(lerColecao("x\nconst ALBUMS = [{\"id\":\"ten\"}];\ny", "ALBUMS"), [{ id: "ten" }]);
  assert.throws(() => lerColecao("nada", "SHOWS"));
});

test("páginas de show em dia com o index.html (senão: node scripts/seo/build-show-pages.mjs)", () => {
  const arquivos = gerarArquivos(lerDadosSite(), fs.readFileSync("sitemap.xml", "utf8"));
  for (const [p, conteudo] of Object.entries(arquivos)) {
    assert.ok(fs.existsSync(p) && fs.readFileSync(p, "utf8") === conteudo, `${p} desatualizado`);
  }
});

test("módulo curto: até 160 linhas e 130 colunas", () => {
  for (const f of ["dados-site.mjs", "show-page.mjs", "build-show-pages.mjs"]) {
    const linhas = fs.readFileSync(`scripts/seo/${f}`, "utf8").split("\n");
    assert.ok(linhas.length <= 160, `${f}: ${linhas.length}`);
    linhas.forEach((l, i) => assert.ok(l.length <= 130, `${f}:${i + 1}`));
  }
});
