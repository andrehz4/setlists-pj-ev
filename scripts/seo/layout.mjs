// Molde comum das páginas estáticas de SEO (show, música, disco, banda e índices).
// Cada página passa só o que muda: título, descrição, URL, JSON-LD e o corpo.
import { SITE_BASE, esc } from "./base.mjs";
import { GA_SNIPPET } from "./analytics.mjs";

export const NOME = "Só mais um fã de Pearl Jam";
export { SITE_BASE, esc };

// Menu que aparece em toda página: é por ele que o Google navega entre as seções.
export const SECOES = [
  ["/", "Início"], ["/show/", "Shows"], ["/musica/", "Músicas"], ["/disco/", "Discos"],
  ["/noticias/", "Notícias"], ["/banda/", "Banda"], ["/forum.html", "Fórum"],
];

const CSS = `body{margin:0;background:#f4eee2;color:#1d1a16;font:18px/1.65 Georgia,"Times New Roman",serif}
.wrap{max-width:760px;margin:0 auto;padding:20px 16px 48px}
header a{color:#a8322b;text-decoration:none;font:700 13px/1.4 system-ui,sans-serif;letter-spacing:.06em}
.menu{display:flex;flex-wrap:wrap;gap:4px 14px;margin:10px 0 4px;font:13px system-ui,sans-serif}
.menu a{color:#6d655b;text-decoration:none}.menu a:hover{color:#a8322b}
.trilha{margin:14px 0 6px;font:13px system-ui,sans-serif;color:#6d655b}.trilha a{color:#a8322b;text-decoration:none}
h1{font-size:clamp(26px,5vw,38px);line-height:1.15;margin:8px 0 12px}
h2{font:700 15px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#6d655b;margin-top:30px}
h3{font-size:20px;margin:24px 0 8px}
.meta{font:15px/1.5 system-ui,sans-serif;color:#6d655b}.meta a{color:#a8322b}
a{color:#1d1a16}blockquote{margin:16px 0;padding-left:16px;border-left:3px solid #d9cfbf;color:#3a342d}
ol.set,ul.cols{columns:2 240px;column-gap:28px}ol.set li,ul.cols li{break-inside:avoid;margin:3px 0}
.capa{width:220px;max-width:60%;height:auto;border-radius:4px;float:right;margin:0 0 12px 16px}
.fotos{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.fotos img{width:100%;height:auto;border-radius:4px;display:block}
.cta{display:inline-block;margin:24px 0;padding:11px 18px;background:#a8322b;color:#fff;border-radius:4px;
text-decoration:none;font:600 15px system-ui,sans-serif}
footer{clear:both;margin-top:40px;border-top:1px solid #d9cfbf;padding-top:14px;font:13px system-ui,sans-serif}
footer a{color:#a8322b;text-decoration:none}`;

export const breadcrumb = itens => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: itens.map(([nome, url], i) => ({ "@type": "ListItem", position: i + 1, name: nome, item: url })),
});

// trilha: [["Músicas", "/musica/"], ...] (a página atual não entra; o h1 já diz onde está)
export function pagina({ titulo, h1 = titulo, descricao, url, ld = [], trilha = [], corpo, imagem, tipoOg = "website" }) {
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
<style>
${CSS}
</style>
${GA_SNIPPET}
</head>
<body>
<div class="wrap">
<header><a href="/">${NOME.toUpperCase()}</a></header>
<nav class="menu">${SECOES.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<nav class="trilha">${migalhas}</nav>
<h1>${esc(h1)}</h1>
${corpo}
<footer><a href="/">Setlists, cifras, músicas e notícias de Pearl Jam e Eddie Vedder</a></footer>
</div>
</body>
</html>
`;
}

// Parágrafos a partir de texto com linhas em branco (mesmo formato das notícias e interpretações).
export const paragrafos = texto => String(texto || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p).replace(/_([^_]+)_/g, "<em>$1</em>")}</p>`).join("\n");

export const slug = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, "").trim().replace(/ +/g, "-");
