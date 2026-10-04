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
  assert.match(e.image[0], /og\.jpg$/);
  assert.match(e.description, /Blaymorphed toca Pearl Jam em São Paulo\/SP, no @stones_bar/);
});

test("página: show público entra com @ da banda e da casa; evento fechado fica de fora", () => {
  const html = paginaAgenda({ shows: [show, { ...show, id: "y", data: "2026-10-16", fechado: true, casa: "sergiovedder" }],
    bandas: [{ conta: "blaymorphed", nome: "Blaymorphed", cidade: "Santo André", uf: "SP", desde: 2000, resumo: "Desde 2000." }],
    hoje: "2026-10-10" });
  assert.match(html, /@stones_bar/);
  assert.match(html, /outubro de 2026/);
  assert.match(html, /<time class="ag-data" datetime="2026-10-11">/);
  assert.doesNotMatch(html, /sergiovedder/);
  assert.equal((html.match(/"MusicEvent"/g) || []).length, 1);
  assert.match(html, /amanhã: Blaymorphed em São Paulo\/SP/, "faixa do próximo show");
  assert.match(html, /21h30/);
  assert.match(html, /1 show na agenda/);
  assert.equal((html.match(/<h1/g) || []).length, 1, "um h1 só");
  assert.ok(!html.includes("—"), "sem travessão");
});

test("calendário: mês cheio vira grade, show passado sai, filtro por UF só com CSS", () => {
  const varios = Array.from({ length: 6 }, (_, i) => ({ ...show, id: `v${i}`, data: `2026-10-${12 + i}`, uf: i % 2 ? "RJ" : "SP" }));
  const html = paginaAgenda({ shows: [{ ...show, id: "velho", data: "2026-10-01" }, ...varios], bandas: [], hoje: "2026-10-10" });
  assert.match(html, /ag-mes--grade/);
  assert.match(html, /ag-ini-5/, "1º de outubro de 2026 é quinta");
  assert.doesNotMatch(html, /datetime="2026-10-01"/);
  assert.match(html, /id="ag-uf-RJ"/);
  assert.match(html, /:has\(#ag-uf-SP:checked\)/);
});

test("sem casa nem hora: mostra local a confirmar", () => {
  const html = paginaAgenda({ shows: [{ ...show, casa: null, hora: null }], bandas: [], hoje: "2026-10-10" });
  assert.match(html, /local a confirmar/);
});

test("sitemap: seção da agenda é idempotente e não mexe no resto", () => {
  const base = "<urlset>\n<url><loc>a</loc></url>\n</urlset>";
  const um = aplicarSitemap(base);
  assert.equal(aplicarSitemap(um), um);
  assert.match(um, /<loc>a<\/loc>/);
  assert.match(um, /\/agenda\//);
  assert.match(aplicarSitemap(base, "2026-10-04"), /<lastmod>2026-10-04<\/lastmod>/);
});
