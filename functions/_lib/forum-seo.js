// Páginas de tópico pro Google (módulo apartado, ligado por FORUM_SEO=1 no Cloudflare).
// Funções puras: recebem o JSON da API do fórum e devolvem HTML/XML prontos.
// O fórum interativo continua em forum-topic.html; esta página só existe pra ser lida.

export const SITE = "https://setlists-pj-ev.pages.dev";
export const API = "https://perpetual-energy-production-1a69.up.railway.app";
const NOME = "Só mais um fã de Pearl Jam";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const idValido = id => UUID.test(String(id || ""));

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Corpo cru do fórum (tags [img]/[audio] com base64, markdown leve) vira texto limpo.
export function textoPlano(bruto) {
  return String(bruto || "")
    .replace(/\[(img|audio|audio-url)(:[a-z]+)?\][\s\S]*?\[\/\1\]/gi, " ")
    .replace(/\[\/?[a-z-]+(:[a-z]+)?\]/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const paragrafos = t => textoPlano(t).split(/\n+/).filter(Boolean)
  .map(p => `<p>${esc(p)}</p>`).join("\n");
function resumo(t, n = 160) {
  const s = textoPlano(t).replace(/\s+/g, " ");
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
function isoData(s) {
  const d = new Date(String(s || "").replace(" ", "T").replace(/\+00$/, "Z"));
  return isNaN(d) ? undefined : d.toISOString();
}
function dataBr(s) {
  const iso = isoData(s);
  return iso ? iso.slice(0, 10).split("-").reverse().join("/") : "";
}

export function paginaTopico({ topic, posts = [], total_posts }) {
  const url = `${SITE}/t/${topic.id}`;
  const forum = `${SITE}/forum-topic.html?id=${encodeURIComponent(topic.id)}`;
  const desc = resumo(topic.body);
  const ld = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    text: resumo(topic.body, 500),
    url,
    datePublished: isoData(topic.created_at),
    author: { "@type": "Person", name: topic.display_name },
    inLanguage: "pt-BR",
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: total_posts ?? posts.length,
    },
    comment: posts.slice(0, 30).map(p => ({
      "@type": "Comment",
      text: resumo(p.body, 500),
      datePublished: isoData(p.created_at),
      author: { "@type": "Person", name: p.display_name },
    })),
  };
  const hora = s => `<time datetime="${esc(isoData(s) || "")}">${dataBr(s)}</time>`;
  const respostas = posts.map(p => `<article class="resp"><h3>${esc(p.display_name)} ${hora(p.created_at)}</h3>
${paragrafos(p.body)}</article>`).join("\n");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(topic.title)} | Fórum ${NOME}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${NOME}">
<meta property="og:title" content="${esc(topic.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE}/og.jpg">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>
body{font:17px/1.6 Georgia,serif;max-width:720px;margin:0 auto;padding:24px 16px;background:#f6f1e7;color:#1a1714}
a{color:#c1272d} h1{line-height:1.2} .meta,time{color:#6b6259;font-size:14px}
.resp{border-top:1px solid #d8cfc0;padding-top:12px;margin-top:16px} .resp h3{font-size:15px;margin:0 0 6px}
.cta{display:inline-block;margin:20px 0;padding:10px 18px;background:#c1272d;color:#fff;text-decoration:none;border-radius:4px}
</style>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','G-234ZL5MF0T');
addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');s.async=true;
s.src='https://www.googletagmanager.com/gtag/js?id=G-234ZL5MF0T';document.head.appendChild(s);},1000);},{once:true});
</script>
</head>
<body>
<nav><a href="${SITE}/forum.html">Fórum</a> › ${esc(topic.category)}</nav>
<article>
<h1>${esc(topic.title)}</h1>
<p class="meta">por ${esc(topic.display_name)} em ${hora(topic.created_at)} · ${total_posts ?? posts.length} respostas</p>
${paragrafos(topic.body)}
</article>
<a class="cta" href="${esc(forum)}">Responder no fórum</a>
<section><h2>Respostas</h2>
${respostas || "<p>Ninguém respondeu ainda. Seja a primeira resposta.</p>"}
</section>
<a class="cta" href="${esc(forum)}">Ver o tópico completo e responder</a>
</body>
</html>`;
}

export function sitemapXml(topicos) {
  const urls = topicos.map(t => `  <url>
    <loc>${SITE}/t/${esc(t.id)}</loc>${isoData(t.last_post_at) ? `
    <lastmod>${isoData(t.last_post_at).slice(0, 10)}</lastmod>` : ""}
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// Chamada à API como o site faria: Origin define o site (pj) e o IP do visitante
// vai no X-Forwarded-For, pra o rate limit do backend contar cada um separado.
export function cabecalhosApi(request) {
  const h = { Origin: SITE, Accept: "application/json" };
  const ip = request?.headers?.get?.("cf-connecting-ip");
  if (ip) h["X-Forwarded-For"] = ip;
  return h;
}
