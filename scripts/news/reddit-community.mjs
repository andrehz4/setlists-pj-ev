// Fetch da comunidade r/pearljam via RSS (sem necessidade de OAuth).
//   fetchTopDay()  → /top/.rss?t=day,  janela 24h, ideal pro digest
//   fetchTopWeek() → /top/.rss?t=week, janela 7d,  ideal pro spotlight
//
// RSS nao traz score nem flair; posts da feed top sao considerados
// pontuados (score=999) por definicao. Imagem extraida do campo content:encoded.

import got from "got";
import Parser from "rss-parser";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const REDDIT_BASE = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "") || "https://www.reddit.com";
const BASE = `${REDDIT_BASE}/r/pearljam`;

const rssParser = new Parser({
  customFields: { item: [["media:thumbnail", "mediaThumbnail"]] },
});

const IMAGE_HOST_RX = /^https?:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com|imgur\.com)\//i;
const IMAGE_EXT_RX = /\.(jpe?g|png|gif|webp)(\?|$)/i;

function extractImageFromHtml(html) {
  if (!html) return null;
  const m = html.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i);
  return m?.[1]?.replace(/&amp;/g, "&") || null;
}

export function pickCoverImage(post) {
  if (!post) return null;
  if (post.cover_image) return post.cover_image;
  if (post.url && IMAGE_EXT_RX.test(post.url) && /^https?:\/\//.test(post.url)) return post.url;
  if (post.url && IMAGE_HOST_RX.test(post.url)) return post.url;
  return null;
}

function normalizeRssItem(item) {
  const id = item.link?.match(/comments\/([a-z0-9]+)\//i)?.[1] || Math.random().toString(36).slice(2);
  const thumbnailUrl = item.mediaThumbnail?.["$"]?.url || null;
  const contentImage = extractImageFromHtml(item["content:encoded"] || item.content || "");
  const cover = thumbnailUrl && /^https?:\/\//.test(thumbnailUrl) ? thumbnailUrl : contentImage;
  return {
    id,
    permalink: item.link || "",
    title: item.title || "",
    author: item.creator ? `u/${item.creator}` : "u/[deleted]",
    score: 999,            // feed top = pontuado por definicao
    num_comments: 0,
    flair: null,
    selftext: (item.contentSnippet || "").slice(0, 1200),
    is_gallery: false,
    over_18: false,
    locked: false,
    removed: false,
    created_utc: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : 0,
    created_iso: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    cover_image: cover,
    url: item.link || "",
  };
}

function isPublishable(p) {
  if (p.over_18 || p.locked || p.removed) return false;
  if (!p.title || p.title.length < 5) return false;
  return true;
}

async function fetchTop(period, limit = 25) {
  const url = `${BASE}/top/.rss?t=${period}&limit=${limit}`;
  try {
    const xml = await got(url, {
      headers: { "User-Agent": UA },
      timeout: { request: 15000 },
      retry: { limit: 1 },
    }).text();
    const feed = await rssParser.parseString(xml);
    return (feed.items || []).map(normalizeRssItem).filter(isPublishable);
  } catch (err) {
    console.warn(`[reddit] fetchTop(${period}) falhou: ${err.message}. Retornando lista vazia.`);
    return [];
  }
}

export async function fetchTopDay(limit = 25) {
  return fetchTop("day", limit);
}

export async function fetchTopWeek(limit = 25) {
  return fetchTop("week", limit);
}

// Heuristicas pra spotlight: posts que sao fan content de verdade.
// Sem flair no RSS, a deteccao e so por titulo.
const FAN_TITLE_RX = /\b(tattoo|tatuagem|painting|drawing|portrait|sketch|cake|cap|cosplay|build|carved|stitched|knitted|cover of|cover by|i made|i drew|i painted|i (just )?finished|here'?s my|my (first|new|latest))\b/i;

export function isFanContent(p) {
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
