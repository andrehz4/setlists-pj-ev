// Fetch da comunidade r/pearljam via RSS do Reddit.
//   fetchTopDay()  → /r/pearljam/top.rss?t=day, janela 24h
//   fetchTopWeek() → /r/pearljam/top.rss?t=day, janela 24h (Reddit bloqueia t=week sem OAuth)
//
// RSS e escolhido sobre a JSON API porque o Reddit bloqueia requests JSON de IPs
// de cloud (GitHub Actions, Cloudflare) sem autenticacao OAuth. RSS tem politica
// de acesso mais permissiva por ser consumido por feed readers.
// Score e num_comments nao estao disponiveis no RSS; filtros de spotlight usam
// apenas presenca de imagem e heuristicas de titulo/flair.

import Parser from "rss-parser";
import { load as cheerioLoad } from "cheerio";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const PROXY_BASE = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "");
const RSS_BASE = (PROXY_BASE || "https://www.reddit.com") + "/r/pearljam";

const rssParser = new Parser({
  headers: {
    "User-Agent": UA,
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 15000,
});

const IMAGE_HOST_RX = /^https?:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com|imgur\.com)\//i;
const IMAGE_EXT_RX = /\.(jpe?g|png|gif|webp)(\?|$)/i;

export function pickCoverImage(post) {
  if (!post) return null;
  if (post.cover_image) return post.cover_image;
  if (post.url && IMAGE_EXT_RX.test(post.url) && /^https?:\/\//.test(post.url)) return post.url;
  if (post.url && IMAGE_HOST_RX.test(post.url)) return post.url;
  return null;
}

function extractIdFromPermalink(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("comments");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch { /* */ }
  return url;
}

function extractImageFromHtml(html) {
  if (!html) return null;
  try {
    const $ = cheerioLoad(html);
    const src = $("img").first().attr("src");
    if (src && /^https?:\/\//.test(src)) return src.replace(/&amp;/g, "&");
  } catch { /* */ }
  return null;
}

function normalizeRssEntry(entry) {
  const permalink = entry.link || "";
  const flair = (entry.categories || [])[0]?.label || null;

  let cover_image = extractImageFromHtml(entry.content);
  if (!cover_image && permalink) {
    if (IMAGE_EXT_RX.test(permalink) || IMAGE_HOST_RX.test(permalink)) cover_image = permalink;
  }

  const selftext = (entry.contentSnippet || "")
    .replace(/\[link\]\s*\[comments\]/g, "")
    .trim()
    .slice(0, 1200);

  const author = entry.author
    ? (entry.author.startsWith("u/") ? entry.author : `u/${entry.author}`)
    : "u/[deleted]";

  return {
    id: extractIdFromPermalink(permalink),
    permalink,
    title: entry.title || "",
    author,
    score: 0,        // nao disponivel no RSS
    num_comments: 0, // nao disponivel no RSS
    flair,
    selftext,
    is_gallery: false,
    over_18: false,
    locked: false,
    removed: false,
    created_utc: entry.isoDate ? new Date(entry.isoDate).getTime() / 1000 : 0,
    created_iso: entry.isoDate || new Date().toISOString(),
    cover_image,
    url: permalink,
  };
}

function isPublishable(p) {
  if (!p.title || p.title.length < 5) return false;
  return true;
}

async function fetchTop(period, limit = 25) {
  const url = `${RSS_BASE}/top.rss?t=${period}&limit=${limit}`;
  try {
    const feed = await rssParser.parseURL(url);
    const posts = (feed.items || []).slice(0, limit).map(normalizeRssEntry).filter(isPublishable);
    return { posts, fetchError: null };
  } catch (err) {
    console.warn(`[reddit] fetchTop RSS(${period}) falhou: ${err.message}. Retornando lista vazia.`);
    return { posts: [], fetchError: err.message };
  }
}

export async function fetchTopDay(limit = 25) {
  return fetchTop("day", limit);
}

export async function fetchTopWeek(limit = 25) {
  // Reddit bloqueia t=week sem OAuth; usa t=day como fallback
  return fetchTop("day", limit);
}

// Heuristicas pra spotlight: posts que sao fan content de verdade.
// Flair vem do RSS via <category>; titulo e fallback quando flair nao existe.
const FAN_TITLE_RX = /\b(tattoo|tatuagem|painting|drawing|portrait|sketch|cake|cap|cosplay|build|carved|stitched|knitted|cover of|cover by|i made|i drew|i painted|i (just )?finished|here'?s my|my (first|new|latest))\b/i;
const FAN_FLAIR_RX = /\b(fan art|art|photo|tattoo|oc|original content|merch|collection)\b/i;

export function isFanContent(p) {
  if (p.flair && FAN_FLAIR_RX.test(p.flair)) return true;
  if (FAN_TITLE_RX.test(p.title)) return true;
  return false;
}

export function pickSpotlightCandidate(posts, seenIds, opts = {}) {
  const { minScore = 0 } = opts;
  const candidates = posts
    .filter((p) => p.score >= minScore)
    .filter((p) => p.cover_image)
    .filter(isFanContent)
    .filter((p) => !seenIds.has(p.id));
  return candidates[0] || null;
}
