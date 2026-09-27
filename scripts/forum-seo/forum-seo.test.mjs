// Testes das páginas de tópico pro Google (functions/). Sem rede: fetch e caches simulados.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { esc, textoPlano, idValido, paginaTopico, sitemapXml, cabecalhosApi } from "../../functions/_lib/forum-seo.js";
import { onRequestGet as paginaGet } from "../../functions/t/[id].js";
import { onRequestGet as sitemapGet } from "../../functions/sitemap-forum.xml.js";

const ID = "d2f887fc-8ab8-48cd-86e2-e7153ca21059";
const TOPICO = {
  id: ID, title: "Qual música do PJ já te fez chorar? <b>", body: "Abertura **forte**\n\n[img]data:image/png;base64,AAAA[/img]Segunda linha",
  category: "geral", display_name: "Fã & Cia", created_at: "2026-05-18 21:13:57.222875+00", last_post_at: "2026-05-27 20:06:04+00",
};
const POSTS = [{ body: "Black, sempre </script><script>alert(1)</script>", display_name: "Rafa", created_at: "2026-05-19 10:00:00+00" }];

test("textoPlano tira base64, tags e markdown", () => {
  const t = textoPlano(TOPICO.body);
  assert.equal(t, "Abertura forte\n\n Segunda linha");
  assert.ok(!t.includes("base64"));
});

test("esc e idValido", () => {
  assert.equal(esc(`<a href="x">'&`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
  assert.ok(idValido(ID));
  assert.ok(!idValido("../etc"));
  assert.ok(!idValido(""));
});

test("página do tópico: título, canonical, respostas escapadas e JSON-LD válido", () => {
  const html = paginaTopico({ topic: TOPICO, posts: POSTS, total_posts: 1 });
  assert.match(html, /<title>Qual música do PJ já te fez chorar\? &lt;b&gt; \| Fórum/);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://setlists-pj-ev.pages.dev/t/${ID}">`));
  assert.ok(html.includes("Fã &amp; Cia"));
  assert.ok(html.includes(`forum-topic.html?id=${ID}`));
  assert.ok(!html.includes("<script>alert"), "resposta não pode injetar script");
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(ld["@type"], "DiscussionForumPosting");
  assert.equal(ld.comment.length, 1);
  assert.equal(ld.datePublished, "2026-05-18T21:13:57.222Z");
  assert.ok(!html.includes("—"), "sem travessão");
});

test("sitemap lista /t/<id> com lastmod", () => {
  const xml = sitemapXml([TOPICO]);
  assert.ok(xml.includes(`<loc>https://setlists-pj-ev.pages.dev/t/${ID}</loc>`));
  assert.ok(xml.includes("<lastmod>2026-05-27</lastmod>"));
});

test("cabeçalhos repassam o IP do visitante", () => {
  const h = cabecalhosApi(new Request("https://x", { headers: { "cf-connecting-ip": "200.1.2.3" } }));
  assert.equal(h["X-Forwarded-For"], "200.1.2.3");
  assert.equal(h.Origin, "https://setlists-pj-ev.pages.dev");
});

// Ambiente simulado do Cloudflare Pages
function ctx(url, { flag = "1", id } = {}) {
  const esperas = [];
  return { request: new Request(url), env: { FORUM_SEO: flag }, params: { id },
    next: () => new Response("estatico", { status: 404 }), waitUntil: p => esperas.push(p) };
}
function simular(respostaApi) {
  const guardado = new Map();
  globalThis.caches = { default: { match: async k => guardado.get(k.url), put: async (k, v) => { guardado.set(k.url, v); } } };
  globalThis.fetch = async url => (typeof respostaApi === "function" ? respostaApi(url) : respostaApi);
  return guardado;
}
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status });

test("flag desligada: rota não responde", async () => {
  simular(json({}));
  const r = await paginaGet(ctx(`https://s/t/${ID}`, { flag: "0", id: ID }));
  assert.equal(await r.text(), "estatico");
});

test("id inválido e tópico inexistente dão 404", async () => {
  simular(json({ detail: "x" }, 404));
  assert.equal((await paginaGet(ctx("https://s/t/abc", { id: "abc" }))).status, 404);
  assert.equal((await paginaGet(ctx(`https://s/t/${ID}`, { id: ID }))).status, 404);
});

test("API fora do ar dá 503 com Retry-After e não entra no cache", async () => {
  const guardado = simular(json({}, 500));
  const r = await paginaGet(ctx(`https://s/t/${ID}`, { id: ID }));
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("Retry-After"), "600");
  assert.equal(guardado.size, 0);
});

test("página ok entra no cache por 1h", async () => {
  const guardado = simular(json({ topic: TOPICO, posts: POSTS, total_posts: 1 }));
  const r = await paginaGet(ctx(`https://s/t/${ID}`, { id: ID }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Cache-Control"), "public, max-age=3600");
  assert.equal(guardado.size, 1);
});

test("sitemap pagina a API até acabar", async () => {
  const chamadas = [];
  simular(url => { chamadas.push(url); return json({ items: [TOPICO], total: 1 }); });
  const r = await sitemapGet(ctx("https://s/sitemap-forum.xml"));
  assert.equal(r.status, 200);
  assert.equal(chamadas.length, 1);
  assert.match(await r.text(), /\/t\/d2f887fc/);
});

test("arquivos do módulo curtos: até 160 linhas e 130 colunas", () => {
  const raiz = path.resolve("functions");
  const arquivos = ["_lib/forum-seo.js", "_lib/cache.js", "t/[id].js", "sitemap-forum.xml.js"];
  for (const a of arquivos) {
    const linhas = fs.readFileSync(path.join(raiz, a), "utf8").split("\n");
    assert.ok(linhas.length <= 160, `${a}: ${linhas.length} linhas`);
    linhas.forEach((l, i) => assert.ok(l.length <= 130, `${a}:${i + 1} tem ${l.length} colunas`));
  }
});
