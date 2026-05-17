// Fetch da comunidade r/pearljam via API JSON do Reddit (mesmo padrao do fetch-news.mjs).
//   fetchTopDay()  → /r/pearljam/top.json?t=day,  janela 24h, ideal pro digest
//   fetchTopWeek() → /r/pearljam/top.json?t=week, janela 7d,  ideal pro spotlight
//
// Usa REDDIT_PROXY_URL que ja lida com OAuth. Retorna score, flair e
// num_comments reais (RSS nao fornecia esses campos).

import got from "got";
import { Buffer } from "node:buffer";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const REDDIT_BASE = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "") || "https://www.reddit.com";
const BASE = `${REDDIT_BASE}/r/pearljam`;

// Cache de token OAuth dentro do processo (valido por ~1h)
let _oauthToken = null;
let _tokenExpiry = 0;

async function getOAuthToken() {
  if (_oauthToken && Date.now() < _tokenExpiry) return _oauthToken;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await got.post("https://www.reddit.com/api/v1/access_token", {
      headers: {
        "User-Agent": UA,
        "Authorization": `Basic ${credentials}`,
      },
      form: { grant_type: "client_credentials" },
      timeout: { request: 10000 },
    }).json();

    if (res.access_token) {
      _oauthToken = res.access_token;
      _tokenExpiry = Date.now() + ((res.expires_in || 3600) * 1000) - 60_000;
      console.log("[reddit] OAuth token obtido com sucesso");
      return _oauthToken;
    }
    console.warn(`[reddit] OAuth retornou sem access_token: ${JSON.stringify(res)}`);
  } catch (err) {
    console.warn(`[reddit] falha ao obter OAuth token: ${err.message}. Usando proxy sem auth.`);
  }
  return null;
}

const IMAGE_HOST_RX = /^https?:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com|imgur\.com)\//i;
const IMAGE_EXT_RX = /\.(jpe?g|png|gif|webp)(\?|$)/i;

export function pickCoverImage(post) {
  if (!post) return null;
  if (post.cover_image) return post.cover_image;
  if (post.url && IMAGE_EXT_RX.test(post.url) && /^https?:\/\//.test(post.url)) return post.url;
  if (post.url && IMAGE_HOST_RX.test(post.url)) return post.url;
  return null;
}

function extractPreviewImage(p) {
  try {
    const src = p.preview?.images?.[0]?.source?.url;
    if (src) return src.replace(/&amp;/g, "&");
  } catch { /* */ }
  return null;
}

function normalizeJsonPost(p) {
  const permalink = `https://www.reddit.com${p.permalink}`;
  const directImg = p.post_hint === "image" ? p.url : null;
  const previewImg = extractPreviewImage(p);
  const thumbImg = p.thumbnail && /^https?:\/\//.test(p.thumbnail) ? p.thumbnail : null;
  const cover = directImg || previewImg || thumbImg || null;
  return {
    id: p.id,
    permalink,
    title: p.title || "",
    author: p.author ? `u/${p.author}` : "u/[deleted]",
    score: p.score || 0,
    num_comments: p.num_comments || 0,
    flair: p.link_flair_text || null,
    selftext: (p.selftext || "").slice(0, 1200),
    is_gallery: !!p.is_gallery,
    over_18: !!p.over_18,
    locked: !!p.locked,
    removed: !!(p.removed_by_category || p.removal_reason),
    created_utc: p.created_utc || 0,
    created_iso: new Date((p.created_utc || 0) * 1000).toISOString(),
    cover_image: cover,
    url: permalink,
  };
}

function isPublishable(p) {
  if (p.over_18 || p.locked || p.removed) return false;
  if (!p.title || p.title.length < 5) return false;
  return true;
}

async function fetchTop(period, limit = 25) {
  const token = await getOAuthToken();

  // Com OAuth: usa oauth.reddit.com (sem restricao de periodo nem bloqueio de IP).
  // Sem OAuth: usa proxy (pode falhar em t=week se Reddit bloquear o IP do runner).
  const url = token
    ? `https://oauth.reddit.com/r/pearljam/top.json?t=${period}&limit=${limit}`
    : `${BASE}/top.json?t=${period}&limit=${limit}`;
  const headers = token
    ? { "User-Agent": UA, "Accept": "application/json", "Authorization": `Bearer ${token}` }
    : { "User-Agent": UA, "Accept": "application/json" };

  try {
    const res = await got(url, {
      headers,
      timeout: { request: 15000 },
      retry: { limit: 1 },
    }).json();
    const posts = (res?.data?.children || []).map((c) => c.data);
    return { posts: posts.map(normalizeJsonPost).filter(isPublishable), fetchError: null };
  } catch (err) {
    console.warn(`[reddit] fetchTop(${period}) falhou: ${err.message}. Retornando lista vazia.`);
    return { posts: [], fetchError: err.message };
  }
}

export async function fetchTopDay(limit = 25) {
  return fetchTop("day", limit);
}

export async function fetchTopWeek(limit = 25) {
  return fetchTop("week", limit);
}

// Heuristicas pra spotlight: posts que sao fan content de verdade.
// Com JSON API temos flair real: verifica primeiro, cai no titulo como fallback.
const FAN_TITLE_RX = /\b(tattoo|tatuagem|painting|drawing|portrait|sketch|cake|cap|cosplay|build|carved|stitched|knitted|cover of|cover by|i made|i drew|i painted|i (just )?finished|here'?s my|my (first|new|latest))\b/i;
const FAN_FLAIR_RX = /\b(fan art|art|photo|tattoo|oc|original content|merch|collection)\b/i;

export function isFanContent(p) {
  if (p.flair && FAN_FLAIR_RX.test(p.flair)) return true;
  if (FAN_TITLE_RX.test(p.title)) return true;
  return false;
}

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
