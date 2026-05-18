// Fetch da comunidade r/pearljam via RSS do Reddit.
//   fetchTopDay()  → /r/pearljam/top.rss?t=day, janela 24h
//   fetchTopWeek() → /r/pearljam/top.rss?t=day, janela 24h (Reddit bloqueia t=week sem OAuth)
//
// RSS e escolhido sobre a JSON API porque o Reddit bloqueia requests JSON de IPs
// de cloud (GitHub Actions, Cloudflare) sem autenticacao OAuth. RSS tem politica
// de acesso mais permissiva por ser consumido por feed readers.
// Score e num_comments nao estao disponiveis no RSS; filtros de spotlight usam
// apenas presenca de imagem e heuristicas de titulo/flair.
//
// ATENCAO: Reddit nao permite mais criar novos apps (reddit.com/prefs/apps desativado).
// NAO sugerir Reddit OAuth como solucao para bloqueios 403.
// Alternativas viaveis: proxy residencial, Pushshift/Arctic Shift, Cloudflare Worker.

import { load as cheerioLoad } from "cheerio";
import { fetchRedditRss } from "./reddit-rss-fetch.mjs";

const PROXY_BASE = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "");
// Subreddits extras (virgula-separados) via env. Default: eddievedder.
// Posts de fora do r/pearljam passam pelo filtro PJ_REL_RX antes de entrar no pipeline.
// Cada sub e buscado separadamente (Reddit bloqueia multi-sub RSS de IPs cloud).
const EXTRA_SUBS = (process.env.REDDIT_EXTRA_SUBS || "eddievedder")
  .split(",").map(s => s.trim()).filter(Boolean);
const ALL_SUBS = ["pearljam", ...EXTRA_SUBS];
const REDDIT_BASE = (PROXY_BASE || "https://www.reddit.com");


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

// Relevancia PJ para posts de subreddits extras (fora do r/pearljam)
const PJ_REL_RX = /\bpearl\s*jam\b|\bvedder\b|\bstone gossard\b|\bjeff ament\b|\bmike mccready\b|\bmatt cameron\b/i;

function isFromPearljamSub(post) {
  return post.permalink && post.permalink.includes("/r/pearljam/");
}

function isRelevantForCommunity(post) {
  if (isFromPearljamSub(post)) return true;
  return PJ_REL_RX.test(post.title) || PJ_REL_RX.test(post.selftext || "");
}

async function fetchTop(period, limit = 25) {
  const errors = [];
  const seen = new Set();
  const merged = [];

  await Promise.all(ALL_SUBS.map(async (sub) => {
    const url = REDDIT_BASE + "/r/" + sub + "/top.rss?t=" + period + "&limit=" + limit;
    try {
      const feed = await fetchRedditRss(url);
      const posts = (feed.items || []).slice(0, limit)
        .map(normalizeRssEntry)
        .filter(isPublishable)
        .filter(isRelevantForCommunity);
      for (const p of posts) {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      }
    } catch (err) {
      console.warn("[reddit] fetchTop RSS(" + period + ") " + sub + " falhou: " + err.message + ".");
      errors.push(sub + ": " + err.message);
    }
  }));

  const fetchError = errors.length ? errors.join("; ") : null;
  return { posts: merged.slice(0, limit), fetchError };
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
