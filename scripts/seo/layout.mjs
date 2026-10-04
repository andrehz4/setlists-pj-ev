// Molde comum das páginas estáticas de SEO (show, música, disco, banda e índices).
// Cada página passa só o que muda: título, descrição, URL, JSON-LD e o corpo.
import { SITE_BASE, esc } from "./base.mjs";
import { GA_SNIPPET } from "./analytics.mjs";
import { CABECA_SITE, topoSite, TEMA_JS, abaDaUrl } from "./casca-site.mjs";

export const NOME = "Só mais um fã de Pearl Jam";
export { SITE_BASE, esc };

// Menu que aparece em toda página: é por ele que o Google navega entre as seções.
export const SECOES = [
  ["/", "Início"], ["/show/", "Shows"], ["/agenda/", "Agenda"], ["/musica/", "Músicas"], ["/disco/", "Discos"],
  ["/noticias/", "Notícias"], ["/banda/", "Banda"], ["/forum.html", "Fórum"],
];

export const breadcrumb = itens => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: itens.map(([nome, url], i) => ({ "@type": "ListItem", position: i + 1, name: nome, item: url })),
});

// trilha: [["Músicas", "/musica/"], ...] (a página atual não entra; o h1 já diz onde está)
// Opcionais de página desenhada à parte (ex: /agenda/): cabeca (HTML extra no <head>), classeWrap (classe a mais
// no container) e h1Proprio (o corpo traz o próprio <h1>; o molde não imprime o dele). Toda página usa a cara do site
// principal (topo ticket, abas da home com a da seção ativa, tema claro/escuro; ver casca-site.mjs).
export function pagina({ titulo, h1 = titulo, descricao, url, ld = [], trilha = [], corpo, imagem, tipoOg = "website",
  cabeca = "", classeWrap = "", h1Proprio = false }) {
  const img = imagem || `${SITE_BASE}/og.jpg`;
  const bc = breadcrumb([[NOME, `${SITE_BASE}/`], ...trilha.map(([n, u]) => [n, SITE_BASE + u]), [h1, url]]);
  const dados = [...(Array.isArray(ld) ? ld : [ld]), bc];
  const migalhas = [["/", "Início"], ...trilha.map(([n, u]) => [u, n])]
    .map(([u, n]) => `<a href="${esc(u)}">${esc(n)}</a>`).join(" › ");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)} | ${NOME}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="max-image-preview:large">
<meta property="og:type" content="${tipoOg}">
<meta property="og:site_name" content="${NOME}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(h1)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(dados).replace(/</g, "\\u003c")}</script>
${CABECA_SITE}
${cabeca}${GA_SNIPPET}
</head>
<body>
${topoSite(abaDaUrl(url))}
<div class="${classeWrap || "seo-wrap"}">
${h1Proprio ? "" : `<nav class="trilha" aria-label="Você está em">${migalhas}</nav>\n<h1>${esc(h1)}</h1>\n`}${corpo}
<footer><a href="/">Setlists, cifras, músicas e notícias de Pearl Jam e Eddie Vedder</a></footer>
</div>
${TEMA_JS}
</body>
</html>
`;
}

// Parágrafos a partir de texto com linhas em branco (mesmo formato das notícias e interpretações).
export const paragrafos = texto => String(texto || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p).replace(/_([^_]+)_/g, "<em>$1</em>")}</p>`).join("\n");

export const slug = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, "").trim().replace(/ +/g, "-");
