// Teste standalone do transporte Reddit RSS (curl bypass).
// Independente do pipeline — nao toca seen.json, index.json ou curators.
// Uso: node scripts/news/test-reddit-fetch.mjs

import { fetchRedditRss } from "./reddit-rss-fetch.mjs";

const SUBS = ["pearljam", "eddievedder"];
let allOk = true;

for (const sub of SUBS) {
  const url = `https://www.reddit.com/r/${sub}/top.rss?t=day&limit=5`;
  try {
    const feed = await fetchRedditRss(url);
    const count = (feed.items || []).length;
    console.log(`[ok] r/${sub}: ${count} post(s)`);
    if (count > 0) console.log(`     primeiro: "${(feed.items[0].title || "").slice(0, 80)}"`);
  } catch (err) {
    console.error(`[erro] r/${sub}: ${err.message}`);
    allOk = false;
  }
}

process.exit(allOk ? 0 : 1);
