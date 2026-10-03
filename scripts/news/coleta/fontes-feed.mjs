// Coletores das fontes de notícia (sources.mjs). Cada um devolve SEMPRE { items, error }: o laço
// principal lê items.length, então formato errado derrubaria a coleta inteira.
import Parser from "rss-parser";
import got from "got";
import { fetchRedditRss } from "../reddit-rss-fetch.mjs";
import { REDDIT_FILTER } from "../sources.mjs";
import { passesRedditFilter } from "../relevance.mjs";
import { fetchSetlistfmItems } from "../setlistfm.mjs";
import { fetchIgOficialItems } from "../ig-oficial.mjs";
import { UA_ROBO } from "../../config.mjs";
import { fetchShopifyItems, fetchPjcomNewsItems } from "./fontes-loja.mjs";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": UA_ROBO },
  customFields: { item: ["dc:creator", "creator"] },
});

const base = (src, extra) => ({ sourceId: src.id, sourceLabel: src.label, group: src.group, ...extra });
const falhou = (tag, src, e) => {
  console.warn(`[${tag}] ${src.id} falhou: ${e.message}`);
  return { items: [], error: e.message };
};

// Item de RSS no formato comum do coletor.
const doRss = (src, it, alwaysRelevant) => base(src, {
  title: (it.title || "").trim(),
  link: (it.link || "").trim(),
  pubDate: it.isoDate || it.pubDate || new Date().toISOString(),
  snippet: (it.contentSnippet || it.content || "").slice(0, 800),
  alwaysRelevant,
});

export async function fetchFeedItems(src) {
  if (src.kind === "reddit") return fetchRedditItems(src);
  if (src.kind === "shopify") return fetchShopifyItems(src);
  if (src.kind === "pjcom-news") return fetchPjcomNewsItems(src);
  if (src.kind === "reddit-search-rss") return fetchRedditSearchItems(src);
  if (src.kind === "setlistfm") return fetchSetlistfmItems(src);
  if (src.kind === "instagram-oficial") return fetchIgOficialItems(src);
  try {
    const feed = await parser.parseURL(src.url);
    return { items: (feed.items || []).slice(0, 25).map((it) => doRss(src, it, !!src.alwaysRelevant)), error: null };
  } catch (e) {
    return falhou("feed", src, e);
  }
}

// Busca do Reddit (RSS) sobre Pearl Jam em qualquer subreddit, menos r/pearljam (que é do
// community-fetch). ATENÇÃO: o Reddit não deixa mais criar app (prefs/apps desativado); NÃO sugerir
// OAuth pra erro 403. O fetch usa curl via reddit-rss-fetch.mjs.
async function fetchRedditSearchItems(src) {
  try {
    const feed = await fetchRedditRss(src.url);
    const items = (feed.items || []).slice(0, 25)
      .filter((it) => !(it.link || "").toLowerCase().includes("/r/pearljam/"))
      .map((it) => doRss(src, it, true));
    return { items, error: null };
  } catch (e) {
    return falhou("reddit-search", src, e);
  }
}

async function fetchRedditItems(src) {
  try {
    const proxyBase = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "");
    const finalUrl = proxyBase && src.url.startsWith("https://www.reddit.com")
      ? src.url.replace("https://www.reddit.com", proxyBase) : src.url;
    const res = await got(finalUrl, {
      headers: { "User-Agent": UA_ROBO, "Accept": "application/json" },
      timeout: { request: 15000 },
      retry: { limit: 1 },
    }).json();
    const posts = res?.data?.children?.map((c) => c.data) || [];
    const items = posts.filter((p) => passesRedditFilter(p, REDDIT_FILTER)).map((p) => base(src, {
      title: p.title,
      link: `https://www.reddit.com${p.permalink}`,
      pubDate: new Date((p.created_utc || 0) * 1000).toISOString(),
      snippet: p.selftext?.slice(0, 800) || "",
      alwaysRelevant: true,
    }));
    return { items, error: null };
  } catch (e) {
    return falhou("reddit", src, e);
  }
}
