// Páginas estáticas de SEO: show, música, disco, banda, índices e sitemap.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { paginaShow, tituloShow, cidadeCurta } from "./show-page.mjs";
import { catalogoMusicas, paginaMusica, tituloMusica, dataDb } from "./musica-page.mjs";
import { mdParaHtml, paginaDisco, tituloDisco, paginaBanda } from "./disco-page.mjs";
import { gerarArquivos, aplicarSitemap } from "./build-seo-pages.mjs";
import { lerDadosSite, lerColecao, lerMembros } from "./dados-site.mjs";
import { slug } from "./layout.mjs";

const LD = h => JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
const SHOW = {
  id: "pj-2015-11-22", artist: "Pearl Jam", date: "2015-11-22", venue: "Estádio do Maracanã", city: "Rio de Janeiro, BR",
  tour: "Latin American Tour 2015", source: "pearljam.com (oficial)", songs: ["Oceans", "Black <b>", "Yellow Ledbetter"],
  note: "Nota do show.", soundcheck: ["Inside Job"],
};
const TEN = { id: "ten", title: "Ten", year: 1991, artist: "Pearl Jam", songs: ["Once", "Black", "Oceans"] };
const COVERS = { id: "covers", title: "Covers & tributos", year: 0, artist: "Ambos", songs: ["Rockin' in the Free World"] };
const DADOS = {
  shows: [SHOW, { ...SHOW, id: "pj-2005-12-02", date: "2005-12-02", city: "São Paulo, BR", songs: ["Black"] }],
  albums: [TEN, COVERS],
  songsDb: { black: { title: "Black", type: "Pearl Jam Original", timesPlayed: 626, firstPlayed: "Oct. 22, 1990" },
    "rockin in the free world": { type: "Cover", timesPlayed: 500 } },
  interpretacoes: { _meta: {}, black: { text_pt: "Interpretação de Black.", byShow_pt: { "pj-2005-12-02": "No Pacaembu." } },
    "rockin' in the free world": { text_pt: "Versão do Neil Young." }, once: { text: "só em inglês" } },
  notas: { _meta: {}, black: "Nota de tradução.", "don't gimme no lip": "Nota A.", "dont gimme no lip": "Nota B." },
  midia: {}, membros: [{ id: "eddie", name: "Eddie Vedder", role: "Vocal", bio: { born: "1964" }, text: "A <em>voz</em>." }],
  ensaios: { ten: "# Ten (1991) · Pearl Jam\n\n## Contexto\n\nTexto com *itálico* e **negrito**.\n\n- item um\n- item dois\n\n> citação" },
  capas: new Set(["ten"]),
};

test("show: título com preposição certa, setlist escapado e linkado, MusicEvent", () => {
  assert.equal(tituloShow(SHOW), "Pearl Jam no Rio de Janeiro, 22/11/2015: setlist completo");
  assert.equal(cidadeCurta("Dana Point, CA, US"), "Dana Point");
  const h = paginaShow(SHOW, DADOS.shows, { "pj-2015-11-22": { photos: 9 } }, new Set(["oceans"]));
  assert.ok(h.includes("<li>Black &lt;b&gt;</li>"));
  assert.ok(h.includes('<a href="/musica/oceans">Oceans</a>'));
  assert.equal((h.match(/photo-\d-thumb\.jpg/g) || []).length, 4);
  assert.equal(LD(h)[0]["@type"], "MusicEvent");
  assert.ok(!h.includes("—"));
});

test("catálogo: só música com texto em PT, junta chaves repetidas, ignora agrupamento de ano 0", () => {
  const c = catalogoMusicas(DADOS);
  assert.deepEqual(c.map(m => m.slug).sort(), ["black", "dont-gimme-no-lip", "rockin-in-the-free-world"]);
  const black = c.find(m => m.slug === "black");
  assert.equal(black.album.id, "ten");
  assert.equal(black.shows.length, 1, "o outro show tem \"Black <b>\", que é outra música");
  assert.equal(c.find(m => m.slug === "rockin-in-the-free-world").album, null);
  assert.equal(c.find(m => m.slug === "dont-gimme-no-lip").nota, "Nota A.");
});

test("música: título, estatística, interpretação, show linkado e sem letra", () => {
  const c = catalogoMusicas(DADOS);
  const black = c.find(m => m.slug === "black");
  assert.equal(tituloMusica(black), "Black, do Pearl Jam: significado e interpretação");
  assert.match(tituloMusica(c.find(m => m.slug === "rockin-in-the-free-world")), /versão do Pearl Jam/);
  const h = paginaMusica(black, c);
  assert.ok(h.includes("Tocada 626 vezes ao vivo") && h.includes("22/10/1990"));
  assert.ok(h.includes('<a href="/disco/ten">Ten</a>'));
  assert.ok(h.includes("<p>No Pacaembu.</p>"));
  assert.equal(LD(h)[0]["@type"], "MusicComposition");
  assert.equal(dataDb("Jul. 14, 2022"), "14/07/2022");
});

test("disco: markdown do ensaio, faixas com link e MusicAlbum", () => {
  const html = mdParaHtml(DADOS.ensaios.ten);
  assert.ok(!html.includes("<h1>") && html.includes("<h2>Contexto</h2>"));
  assert.ok(html.includes("<em>itálico</em>") && html.includes("<strong>negrito</strong>"));
  assert.ok(html.includes("<ul><li>item um</li><li>item dois</li></ul>") && html.includes("<blockquote>citação</blockquote>"));
  const h = paginaDisco(TEN, DADOS, catalogoMusicas(DADOS));
  assert.ok(h.includes('<a href="/musica/black">Black</a>') && h.includes("<li>Once</li>"));
  assert.equal(LD(h)[0].numTracks, 3);
  assert.equal(tituloDisco({ title: "Into the Wild (EV, 2007)" }), "Into the Wild");
});

test("banda: tira HTML do texto e lista os integrantes", () => {
  const h = paginaBanda(DADOS.membros);
  assert.ok(h.includes("<p>A voz.</p>") && LD(h)[0].member[0].name === "Eddie Vedder");
});

test("sitemap: seção seo substitui a antiga de shows, não mexe nas notícias e é idempotente", () => {
  const base = "<urlset>\n<!-- news:start -->\nX\n<!-- news:end -->\n<!-- shows:start -->\nY\n<!-- shows:end -->\n</urlset>";
  const s = aplicarSitemap(base, [["/show/", "0.8"]]);
  assert.ok(s.includes("<!-- news:start -->\nX\n<!-- news:end -->") && !s.includes("shows:start"));
  assert.equal(aplicarSitemap(s, [["/show/", "0.8"]]), s);
  const arq = gerarArquivos(DADOS, "<urlset>\n</urlset>");
  assert.ok(arq["musica/black.html"] && arq["disco/ten.html"] && arq["banda/index.html"] && !arq["disco/covers.html"]);
});

test("leitores de dados", () => {
  assert.deepEqual(lerColecao("x\nconst ALBUMS = [{\"id\":\"ten\"}];\ny", "ALBUMS"), [{ id: "ten" }]);
  assert.throws(() => lerColecao("nada", "SHOWS"));
  const html = "const PJ_MEMBERS = (function() {\nreturn [{ id: 'a', name: 'A', role: 'R', bio: {}, text: 't', palette: {} }];\n})();";
  assert.deepEqual(lerMembros(html), [{ id: "a", name: "A", role: "R", bio: {}, text: "t" }]);
  assert.equal(slug("Don't Gimme No Lip"), "dont-gimme-no-lip");
});

test("páginas de SEO em dia com o site (senão: node scripts/seo/build-seo-pages.mjs)", () => {
  const arquivos = gerarArquivos(lerDadosSite(), fs.readFileSync("sitemap.xml", "utf8"));
  for (const [p, conteudo] of Object.entries(arquivos)) {
    assert.ok(fs.existsSync(p) && fs.readFileSync(p, "utf8") === conteudo, `${p} desatualizado`);
  }
});

test("módulo curto: até 160 linhas e 130 colunas", () => {
  for (const f of fs.readdirSync("scripts/seo").filter(f => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))) {
    const linhas = fs.readFileSync(`scripts/seo/${f}`, "utf8").split("\n");
    assert.ok(linhas.length <= 160, `${f}: ${linhas.length}`);
    linhas.forEach((l, i) => assert.ok(l.length <= 130, `${f}:${i + 1}`));
  }
});
