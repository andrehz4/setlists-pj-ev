// Bug do Search Console (22/10/2026): sitemap e canônica apontavam pra forum.html, forum-profile.html e privacidade.html.
// O Cloudflare Pages responde 308 pra versão sem .html, e o Google marca "Página com redirecionamento".
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { RAIZ, naRaiz } from "../config.mjs";

const comHtml = (txt, re) => [...txt.matchAll(re)].map((m) => m[1]).filter((u) => u.endsWith(".html"));

test("prova do bug: <loc> com .html é o formato que redireciona", () => {
  const antigo = "<loc>https://somaisumfadepearljam.com.br/forum.html</loc>";
  assert.deepEqual(comHtml(antigo, /<loc>([^<]+)<\/loc>/g), ["https://somaisumfadepearljam.com.br/forum.html"]);
});

test("sitemap.xml não lista URL terminada em .html", () => {
  const xml = readFileSync(naRaiz("sitemap.xml"), "utf8");
  assert.deepEqual(comHtml(xml, /<loc>([^<]+)<\/loc>/g), []);
});

test("páginas da raiz não declaram canônica terminada em .html", () => {
  const ruins = readdirSync(RAIZ).filter((f) => f.endsWith(".html")).flatMap((f) =>
    comHtml(readFileSync(naRaiz(f), "utf8"), /rel="canonical" href="([^"]+)"/g).map((u) => `${f}: ${u}`));
  assert.deepEqual(ruins, []);
});
