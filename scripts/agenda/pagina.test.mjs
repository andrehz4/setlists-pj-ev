import { test } from "node:test";
import assert from "node:assert/strict";
import { paginaAgenda, eventoLd } from "./pagina.mjs";
import { aplicarSitemap } from "./sitemap.mjs";

const show = { id: "x", banda: "blaymorphed", nome: "Blaymorphed", data: "2026-10-11", hora: "21:30", casa: "stones_bar",
  casaNome: null, cidade: "São Paulo", uf: "SP", fechado: false, observacao: null, fonte: "https://ig/p" };

test("evento no padrão do Google (MusicEvent com contexto, horário e endereço)", () => {
  const e = eventoLd(show);
  assert.equal(e["@context"], "https://schema.org");
  assert.equal(e.startDate, "2026-10-11T21:30:00-03:00");
  assert.equal(e.location.address.addressLocality, "São Paulo");
  assert.equal(e.performer.sameAs, "https://www.instagram.com/blaymorphed/");
});

test("página: show público entra com @ da banda e da casa; evento fechado fica de fora", () => {
  const html = paginaAgenda({ shows: [show, { ...show, id: "y", data: "2026-10-16", fechado: true, casa: "sergiovedder" }],
    bandas: [{ conta: "blaymorphed", nome: "Blaymorphed", cidade: "Santo André", uf: "SP", desde: 2000, resumo: "Desde 2000." }] });
  assert.match(html, /@stones_bar/);
  assert.match(html, /outubro de 2026/);
  assert.doesNotMatch(html, /16\/10/);
  assert.equal((html.match(/"MusicEvent"/g) || []).length, 1);
});

test("sitemap: seção da agenda é idempotente e não mexe no resto", () => {
  const base = "<urlset>\n<url><loc>a</loc></url>\n</urlset>";
  const um = aplicarSitemap(base);
  assert.equal(aplicarSitemap(um), um);
  assert.match(um, /<loc>a<\/loc>/);
  assert.match(um, /\/agenda\//);
});
