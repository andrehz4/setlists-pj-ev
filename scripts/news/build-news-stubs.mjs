// Gera paginas estaticas n/<id>.html pra cada noticia do index.json.
//
// Por que existem: o site e SPA com deep-link por hash (/#news/<id>), que
// crawler de rede social nao executa. Os links compartilhados (Telegram,
// bio do IG) apontam pra /n/<id>, que antes caia na home com preview
// generico. O stub e um HTML minimo com og:/twitter:/JSON-LD proprios do
// item + redirect imediato pra /#news/<id> (leitor humano nem percebe).
//
// Tambem regenera a secao de noticias do sitemap.xml (entre os marcadores
// <!-- news:start --> e <!-- news:end -->; cria os marcadores se faltarem).
//
// Quem chama: run-publish.mjs no inicio de cada run (gera so o que falta,
// idempotente) e o proprio publish commita n/ + sitemap.xml. Fica fora do
// caminho da routine de curadoria de proposito: o validador do auto-merge
// so aceita paths media/news/, e stubs ficam na raiz (n/).
//
// CLI (backfill manual): node scripts/news/build-news-stubs.mjs

import fs from "node:fs/promises";
import path from "node:path";

const SITE_BASE = process.env.SITE_BASE || "https://setlists-pj-ev.pages.dev";
const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const STUBS_DIR = path.resolve("n");
const SITEMAP_PATH = path.resolve("sitemap.xml");

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function stubHtml(item) {
  const url = `${SITE_BASE}/n/${encodeURIComponent(item.id)}`;
  const target = `/#news/${encodeURIComponent(item.id)}`;
  const title = item.title_pt || "Notícia";
  const desc = (item.intro_pt || "").slice(0, 300);
  const img = item.img ? `${SITE_BASE}${item.img}` : `${SITE_BASE}/og.jpg`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: desc,
    image: [img],
    datePublished: item.pubDate || undefined,
    inLanguage: "pt-BR",
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: "Só mais um fã de Pearl Jam", logo: { "@type": "ImageObject", url: `${SITE_BASE}/og.jpg` } },
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — Só mais um fã de Pearl Jam</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Só mais um fã de Pearl Jam">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
${item.pubDate ? `<meta property="article:published_time" content="${esc(item.pubDate)}">` : ""}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script>location.replace(${JSON.stringify(target)});</script>
<noscript><meta http-equiv="refresh" content="0;url=${esc(target)}"></noscript>
</head>
<body>
<p>Redirecionando pra <a href="${esc(target)}">${esc(title)}</a>…</p>
</body>
</html>
`;
}

function buildSitemapNewsSection(items) {
  const lines = [];
  for (const it of items) {
    lines.push("  <url>");
    lines.push(`    <loc>${esc(`${SITE_BASE}/n/${encodeURIComponent(it.id)}`)}</loc>`);
    if (it.pubDate) lines.push(`    <lastmod>${esc(it.pubDate.slice(0, 10))}</lastmod>`);
    lines.push("    <changefreq>monthly</changefreq>");
    lines.push("    <priority>0.6</priority>");
    lines.push("  </url>");
  }
  return lines.join("\n");
}

async function updateSitemap(items) {
  let xml = await fs.readFile(SITEMAP_PATH, "utf8");
  const START = "<!-- news:start -->";
  const END = "<!-- news:end -->";
  const section = `${START}\n${buildSitemapNewsSection(items)}\n${END}`;
  if (xml.includes(START) && xml.includes(END)) {
    xml = xml.replace(new RegExp(`${START}[\\s\\S]*?${END}`), section);
  } else {
    xml = xml.replace("</urlset>", `${section}\n</urlset>`);
  }
  await fs.writeFile(SITEMAP_PATH, xml);
}

// Gera stubs que faltam (ou cujo titulo mudou) + sitemap. Retorna quantos
// stubs foram escritos; 0 = nada mudou, nada a commitar.
export async function buildNewsStubs({ force = false } = {}) {
  let indexDoc;
  try {
    indexDoc = JSON.parse(await fs.readFile(INDEX_PATH, "utf8"));
  } catch {
    return 0; // sem index legivel, nada a fazer (quem valida o index e o publish)
  }
  const items = (indexDoc.items || []).filter((it) => it && it.id && /^[\w-]+$/.test(it.id));
  if (items.length === 0) return 0;
  await fs.mkdir(STUBS_DIR, { recursive: true });
  let written = 0;
  for (const it of items) {
    const p = path.join(STUBS_DIR, `${it.id}.html`);
    const html = stubHtml(it);
    if (!force) {
      try {
        const cur = await fs.readFile(p, "utf8");
        if (cur === html) continue;
      } catch {}
    }
    await fs.writeFile(p, html);
    written++;
  }
  if (written > 0) await updateSitemap(items);
  return written;
}

// CLI: backfill manual de todos os stubs.
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const n = await buildNewsStubs({ force: process.argv.includes("--force") });
  console.log(`[stubs] ${n} stub(s) escritos em n/ + sitemap.xml atualizado`);
}
