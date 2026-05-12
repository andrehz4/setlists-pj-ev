// Fetch da comunidade r/pearljam, com 2 modos:
//   fetchTopDay()  → top.json?t=day,  janela 24h, ideal pro digest
//   fetchTopWeek() → top.json?t=week, janela 7d,  ideal pro spotlight
//
// Diferenca do reddit-pj existente (em sources.mjs): aquele filtra posts pra
// virarem noticias individuais (score>=100 + flair noticioso). Aqui o objetivo
// e' agregar OU pegar fan content, sem filtro de relevancia regex (o sub inteiro
// e' relevante por definicao).
//
// Parse de imagens (pra spotlight):
//   - post.url terminando em .jpg/.png/.gif → imagem direta
//   - is_gallery=true → media_metadata tem objetos { s: { u: "url&amp;..." } } → primeira
//   - thumbnail valido se nada acima
//
// Cuidados:
//   - URLs de gallery vem com & HTML-encoded ("&amp;"); decodificar antes do GET
//   - over_18, locked, removed_by_category sao filtrados aqui
//   - selftext_html pode conter HTML; usamos selftext puro (markdown)

import got from "got";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
// Em CI (GH Actions), Reddit bloqueia IP do runner. Usa proxy Cloudflare Worker
// se REDDIT_PROXY_URL estiver definido (formato: https://reddit-proxy.<acc>.workers.dev).
// Fallback: chamada direta pro Reddit (funciona em dev local).
const REDDIT_BASE = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "") || "https://www.reddit.com";
const BASE = `${REDDIT_BASE}/r/pearljam`;

const IMAGE_HOST_RX = /^https?:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com|imgur\.com)\//i;
const IMAGE_EXT_RX = /\.(jpe?g|png|gif|webp)(\?|$)/i;

function decodeHtmlEntities(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/");
}

// Extrai URL da imagem cover do post, priorizando: gallery cover → url direta → preview.
// Retorna null se nao houver imagem utilizavel.
export function pickCoverImage(post) {
  if (!post) return null;

  // 1) gallery: pega o primeiro media_metadata
  if (post.is_gallery && post.media_metadata && post.gallery_data?.items?.length) {
    const firstId = post.gallery_data.items[0]?.media_id;
    const meta = firstId && post.media_metadata[firstId];
    const url = meta?.s?.u || meta?.p?.[meta.p.length - 1]?.u;
    if (url) return decodeHtmlEntities(url);
  }

  // 2) url direta apontando pra imagem
  if (post.url && IMAGE_EXT_RX.test(post.url) && /^https?:\/\//.test(post.url)) {
    return decodeHtmlEntities(post.url);
  }

  // 3) host de imagem conhecido (i.redd.it sem extensao, imgur)
  if (post.url && IMAGE_HOST_RX.test(post.url)) {
    return decodeHtmlEntities(post.url);
  }

  // 4) preview do reddit (resolucao alta)
  const preview = post.preview?.images?.[0]?.source?.url;
  if (preview) return decodeHtmlEntities(preview);

  // 5) thumbnail (baixa res, ultimo recurso)
  if (post.thumbnail && /^https?:\/\//.test(post.thumbnail) && post.thumbnail !== "self") {
    return decodeHtmlEntities(post.thumbnail);
  }

  return null;
}

// Normaliza post bruto do reddit pra shape interno consumivel pelos curators.
function normalizePost(post) {
  return {
    id: post.id,
    permalink: `https://www.reddit.com${post.permalink}`,
    title: post.title,
    author: post.author ? `u/${post.author}` : "u/[deleted]",
    score: post.score || 0,
    num_comments: post.num_comments || 0,
    flair: post.link_flair_text || null,
    selftext: (post.selftext || "").slice(0, 1200),
    is_gallery: !!post.is_gallery,
    over_18: !!post.over_18,
    locked: !!post.locked,
    removed: !!post.removed_by_category,
    created_utc: post.created_utc,
    created_iso: new Date((post.created_utc || 0) * 1000).toISOString(),
    cover_image: pickCoverImage(post),
    url: post.url,
  };
}

// Filtros base, comum aos dois modos.
function isPublishable(p) {
  if (p.over_18 || p.locked || p.removed) return false;
  if (!p.title || p.title.length < 5) return false;
  return true;
}

async function fetchTop(period, limit = 25) {
  const url = `${BASE}/top.json?t=${period}&limit=${limit}`;
  const res = await got(url, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeout: { request: 15000 },
    retry: { limit: 1 },
  }).json();
  const posts = (res?.data?.children || []).map((c) => c.data);
  return posts.map(normalizePost).filter(isPublishable);
}

export async function fetchTopDay(limit = 25) {
  return fetchTop("day", limit);
}

export async function fetchTopWeek(limit = 25) {
  return fetchTop("week", limit);
}

// Heuristicas pra spotlight: posts que sao "fan content" de verdade.
const FAN_FLAIRS = new Set(["Fan Content", "Fan Art", "Cover", "Photography", "Video", "History"]);
// Merch SO entra se NAO for venda. "Selling X", "for sale" excluidos.
const MERCH_OK_RX = /\b(my collection|got this|picked up|spinning|finally|i found|score|haul|gift|present)\b/i;
const MERCH_BAD_RX = /\b(selling|for sale|trade|wts|wtb|price|\$\d|\beuro\b|\bgbp\b|\bcad\b)\b/i;

const FAN_TITLE_RX = /\b(tattoo|tatuagem|painting|drawing|portrait|sketch|cake|cap|cosplay|build|carved|stitched|knitted|cover of|cover by|i made|i drew|i painted|i (just )?finished|here'?s my|my (first|new|latest))\b/i;

export function isFanContent(p) {
  // Merch: so se nao for venda
  if (p.flair === "Merch") {
    if (MERCH_BAD_RX.test(p.title)) return false;
    return MERCH_OK_RX.test(p.title) || (p.selftext && MERCH_OK_RX.test(p.selftext));
  }
  if (FAN_FLAIRS.has(p.flair)) return true;
  if (FAN_TITLE_RX.test(p.title)) return true;
  return false;
}

// Seleciona o melhor candidato a spotlight: maior score, com imagem, fan content,
// que nao esteja em `seenIds` (set de community_post_id ja publicados).
export function pickSpotlightCandidate(posts, seenIds, opts = {}) {
  const { minScore = 50 } = opts;
  const candidates = posts
    .filter((p) => p.score >= minScore)
    .filter((p) => p.cover_image)
    .filter(isFanContent)
    .filter((p) => !seenIds.has(p.id))
    .sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}
