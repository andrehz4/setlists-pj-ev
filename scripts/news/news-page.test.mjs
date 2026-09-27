// Página estática de notícia (/n/<id>): tem que ser legível pelo Google, sem redirect.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { paginaNoticia, relacionadas, corpoHtml, dataExtenso } from "./news-page.mjs";

const ITEM = {
  id: "abc123", title_pt: "Eddie <b>Vedder</b> & amigos", intro_pt: "Resumo curto da notícia.",
  pubDate: "2026-09-23T13:34:54.000Z", fetchedAt: "2026-09-24T10:00:00.000Z", img: "/media/news/img/abc123.jpg",
  url: "https://exemplo.com/materia", sourceLabel: "Rolling Stone Brasil", tags: ["eddie", "discos"],
};
const CORPO = "Primeiro parágrafo com _itálico_.\n\nSegundo <script>alert(1)</script> parágrafo.";

test("página sem redirect, com canonical e título sem travessão", () => {
  const h = paginaNoticia(ITEM, CORPO, []);
  assert.ok(!h.includes("location.replace") && !h.includes("http-equiv=\"refresh\""));
  assert.match(h, /<link rel="canonical" href="https:\/\/setlists-pj-ev\.pages\.dev\/n\/abc123">/);
  assert.match(h, /<title>Eddie &lt;b&gt;Vedder&lt;\/b&gt; &amp; amigos \| Só mais um fã de Pearl Jam<\/title>/);
  assert.ok(!h.includes("—"));
});

test("texto completo, escapado, com itálico e link da fonte", () => {
  const h = paginaNoticia(ITEM, CORPO, []);
  assert.ok(h.includes("<p>Primeiro parágrafo com <em>itálico</em>.</p>"));
  assert.ok(!h.includes("<script>alert"));
  assert.ok(h.includes('<a href="https://exemplo.com/materia" rel="noopener">Rolling Stone Brasil</a>'));
  assert.ok(h.includes('href="/#news/abc123">Abrir no site'));
});

test("dados estruturados: NewsArticle e BreadcrumbList válidos", () => {
  const h = paginaNoticia(ITEM, CORPO, []);
  const ld = JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(ld[0]["@type"], "NewsArticle");
  assert.equal(ld[0].author.name, "Só mais um fã de Pearl Jam");
  assert.deepEqual(ld[0].image, ["https://setlists-pj-ev.pages.dev/media/news/img/abc123.jpg"]);
  assert.equal(ld[0].dateModified, "2026-09-24T10:00:00.000Z");
  assert.equal(ld[1]["@type"], "BreadcrumbList");
});

test("resumo não se repete quando o corpo já começa com ele", () => {
  assert.ok(paginaNoticia(ITEM, CORPO, []).includes('class="intro"'));
  assert.ok(!paginaNoticia(ITEM, "Resumo curto da notícia. E segue.", []).includes('class="intro"'));
});

test("relacionadas: tag em comum primeiro, depois as mais recentes, sem a própria", () => {
  const todos = [ITEM,
    { id: "a", tags: ["outra"], pubDate: "2026-09-26" },
    { id: "b", tags: ["eddie"], pubDate: "2026-01-01" },
    { id: "c", tags: [], pubDate: "2026-09-25" }];
  assert.deepEqual(relacionadas(ITEM, todos, 2).map(x => x.id), ["b", "a"]);
  assert.ok(!relacionadas(ITEM, todos).some(x => x.id === "abc123"));
});

test("leia também vira link normal que o Google segue", () => {
  const h = paginaNoticia(ITEM, CORPO, [{ id: "xyz", title_pt: "Outra notícia" }]);
  assert.ok(h.includes('<a href="/n/xyz">Outra notícia</a>'));
});

test("utilitários", () => {
  assert.equal(corpoHtml(""), "");
  assert.equal(dataExtenso("2026-09-23T13:34:54.000Z"), "23 de setembro de 2026");
  assert.equal(dataExtenso("lixo"), "");
});

test("módulo curto: até 160 linhas e 130 colunas", () => {
  for (const f of ["scripts/news/news-page.mjs", "scripts/news/build-news-stubs.mjs"]) {
    const linhas = fs.readFileSync(f, "utf8").split("\n");
    assert.ok(linhas.length <= 160, `${f}: ${linhas.length} linhas`);
    linhas.forEach((l, i) => assert.ok(l.length <= 130, `${f}:${i + 1}`));
  }
});

test("índice /noticias/ agrupa por mês e linka todas", async () => {
  const { paginaIndiceNoticias } = await import("./news-page.mjs");
  const h = paginaIndiceNoticias([ITEM, { id: "b", title_pt: "Outra", pubDate: "2026-08-02T10:00:00Z" }]);
  assert.ok(h.includes("<h2>setembro de 2026</h2>") && h.includes("<h2>agosto de 2026</h2>"));
  assert.ok(h.includes('<a href="/n/abc123">') && h.includes('<a href="/n/b">'));
  assert.match(h, /<link rel="canonical" href="https:\/\/setlists-pj-ev\.pages\.dev\/noticias\/">/);
});
