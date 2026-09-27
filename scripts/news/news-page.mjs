// Página estática completa de uma notícia (/n/<id>), pensada pro Google ler.
//
// Antes o /n/<id> era só um stub que redirecionava pra /#news/<id>. O Google ignora
// o que vem depois do "#", então tratava as notícias como redirect pra home e não
// indexava nenhuma. Agora a página tem o texto inteiro, sem redirect, e o link
// "Abrir no site" leva pra versão interativa.

export const SITE_BASE = process.env.SITE_BASE || "https://setlists-pj-ev.pages.dev";
const NOME = "Só mais um fã de Pearl Jam";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Mesmo formato do site (_newsBodyHtml no index.html): parágrafos por linha em branco, _itálico_.
export function corpoHtml(body) {
  return String(body || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/_([^_]+)_/g, "<em>$1</em>")}</p>`).join("\n");
}

export function dataExtenso(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}

const imagemDe = it => (it.img ? `${SITE_BASE}${it.img}` : `${SITE_BASE}/og.jpg`);

// Até `n` notícias com tag em comum (mais recentes primeiro); completa com as mais recentes.
export function relacionadas(item, todos, n = 4) {
  const tags = new Set(item.tags || []);
  const outros = todos.filter(x => x.id !== item.id);
  const porData = (a, b) => String(b.pubDate || "").localeCompare(String(a.pubDate || ""));
  const comTag = outros.filter(x => (x.tags || []).some(t => tags.has(t))).sort(porData);
  const escolhidas = comTag.slice(0, n);
  for (const x of [...outros].sort(porData)) {
    if (escolhidas.length >= n) break;
    if (!escolhidas.includes(x)) escolhidas.push(x);
  }
  return escolhidas;
}

export function paginaNoticia(item, body, relacionadasLista = []) {
  const url = `${SITE_BASE}/n/${encodeURIComponent(item.id)}`;
  const titulo = item.title_pt || "Notícia";
  const desc = String(item.intro_pt || "").slice(0, 300);
  const img = imagemDe(item);
  const logo = { "@type": "ImageObject", url: `${SITE_BASE}/og.jpg` };
  const site = { "@type": "Organization", name: NOME, url: `${SITE_BASE}/`, logo };
  const ld = [{
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: titulo,
    description: desc,
    image: [img],
    datePublished: item.pubDate || undefined,
    dateModified: item.fetchedAt || item.pubDate || undefined,
    inLanguage: "pt-BR",
    mainEntityOfPage: url,
    author: site,
    publisher: site,
    isBasedOn: item.url || undefined,
    keywords: (item.tags || []).join(", ") || undefined,
  }, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: NOME, item: `${SITE_BASE}/` },
      { "@type": "ListItem", position: 2, name: "Notícias", item: `${SITE_BASE}/#news` },
      { "@type": "ListItem", position: 3, name: titulo, item: url },
    ],
  }];
  const leia = relacionadasLista.map(r =>
    `<li><a href="/n/${esc(encodeURIComponent(r.id))}">${esc(r.title_pt || "Notícia")}</a></li>`).join("\n");
  const rotulo = esc(item.sourceLabel || (item.url ? "fonte original" : ""));
  const fonte = item.url ? `<a href="${esc(item.url)}" rel="noopener">${rotulo}</a>` : rotulo;
  const quando = item.pubDate ? `<time datetime="${esc(item.pubDate)}">${esc(dataExtenso(item.pubDate))}</time> · ` : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)} | ${NOME}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${NOME}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
${item.pubDate ? `<meta property="article:published_time" content="${esc(item.pubDate)}">\n` : ""}\
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>
body{margin:0;background:#f4eee2;color:#1d1a16;font:18px/1.65 Georgia,"Times New Roman",serif}
.wrap{max-width:720px;margin:0 auto;padding:20px 16px 48px}
header a,nav a,footer a{color:#a8322b;text-decoration:none;font:600 13px/1.4 system-ui,sans-serif;letter-spacing:.04em}
nav{margin:14px 0 6px;font:13px system-ui,sans-serif;color:#6d655b}
h1{font-size:clamp(26px,5vw,38px);line-height:1.15;margin:8px 0 12px}
.meta{font:14px/1.5 system-ui,sans-serif;color:#6d655b;margin:0 0 18px}
.meta a{color:#a8322b}
figure{margin:0 0 20px}figure img{width:100%;height:auto;border-radius:6px;display:block}
.intro{font-size:20px;color:#3a342d}
.cta{display:inline-block;margin:24px 0;padding:11px 18px;background:#a8322b;color:#fff;border-radius:4px;
text-decoration:none;font:600 15px system-ui,sans-serif}
aside h2{font:700 15px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#6d655b}
aside li{margin:8px 0}aside a{color:#1d1a16}
footer{margin-top:40px;border-top:1px solid #d9cfbf;padding-top:14px}
</style>
</head>
<body>
<div class="wrap">
<header><a href="/">${NOME.toUpperCase()}</a></header>
<nav><a href="/">Início</a> › <a href="/#news">Notícias</a></nav>
<article>
<h1>${esc(titulo)}</h1>
<p class="meta">${quando}Fonte: ${fonte}</p>
${item.img ? `<figure><img src="${esc(item.img)}" alt="${esc(titulo)}"></figure>\n` : ""}\
${desc && !String(body || "").trim().startsWith(desc.slice(0, 60)) ? `<p class="intro">${esc(desc)}</p>\n` : ""}\
${corpoHtml(body)}
</article>
<a class="cta" href="/#news/${esc(encodeURIComponent(item.id))}">Abrir no site</a>
${leia ? `<aside><h2>Leia também</h2><ul>\n${leia}\n</ul></aside>\n` : ""}\
<footer><a href="/">Setlists, cifras e notícias de Pearl Jam e Eddie Vedder</a></footer>
</div>
</body>
</html>
`;
}
