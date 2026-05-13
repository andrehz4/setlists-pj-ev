// Orquestrador do fetch-news.
// Fluxo: le seen.json/index.json → busca RSS (N fontes) → dedupe → scrape +
// imagem + curator selecionado → merge → escreve index.json/seen.json/archive.
//
// Flags:
//   --curator <anthropic|gemini|routine>  backend de curadoria (default: env NEWS_CURATOR ou anthropic)
//   --dry-run                              nao escreve nada (so imprime resultado)
//   --fixtures                             usa scripts/news/__fixtures__/ em vez de rede (todo)
//   --no-claude                            (compat) alias pra --curator=routine + dry-run
//
// Modos especiais:
//   curator=routine  : itens viram PENDING, sao escritos em media/news/_pending.json
//                      pra Claude routine pegar e curar com merge-curated.mjs depois.

import fs from "node:fs/promises";
import path from "node:path";
import Parser from "rss-parser";
import got from "got";
import { SOURCES, REDDIT_FILTER } from "./sources.mjs";
import { isRelevant, canonicalize, sha10, passesRedditFilter } from "./relevance.mjs";
import { scrapeArticle } from "./extract.mjs";
import { cacheImage, gcOrphanImages, ensureImgDir } from "./image-cache.mjs";
import { loadCurator } from "./curators/_shared.mjs";

// --- args ---
const args = process.argv.slice(2);
function argVal(name) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return null;
}
const DRY = args.includes("--dry-run");
const FIXTURES = args.includes("--fixtures");
const LEGACY_NO_CLAUDE = args.includes("--no-claude");
let CURATOR_NAME = argVal("curator") || process.env.NEWS_CURATOR || "anthropic";
if (LEGACY_NO_CLAUDE) CURATOR_NAME = "routine"; // backward compat

const MAX_NEW_PER_RUN = 3;
const TOP_KEEP = 30;
const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}
async function writeJson(p, data) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": UA },
  customFields: { item: ["dc:creator", "creator"] },
});

async function fetchFeedItems(src) {
  if (src.kind === "reddit") return fetchRedditItems(src);
  try {
    const feed = await parser.parseURL(src.url);
    return (feed.items || []).slice(0, 25).map((it) => ({
      sourceId: src.id,
      sourceLabel: src.label,
      group: src.group,
      title: (it.title || "").trim(),
      link: (it.link || "").trim(),
      pubDate: it.isoDate || it.pubDate || new Date().toISOString(),
      snippet: (it.contentSnippet || it.content || "").slice(0, 800),
      alwaysRelevant: !!src.alwaysRelevant,
    }));
  } catch (e) {
    console.warn(`[feed] ${src.id} falhou: ${e.message}`);
    return [];
  }
}

async function fetchRedditItems(src) {
  try {
    // Em CI, Reddit bloqueia IP do runner (403). Reescreve URL pra usar proxy
    // se REDDIT_PROXY_URL estiver definido.
    const proxyBase = process.env.REDDIT_PROXY_URL?.replace(/\/+$/, "");
    let finalUrl = src.url;
    if (proxyBase && src.url.startsWith("https://www.reddit.com")) {
      finalUrl = src.url.replace("https://www.reddit.com", proxyBase);
    }
    const res = await got(finalUrl, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
      timeout: { request: 15000 },
      retry: { limit: 1 },
    }).json();
    const posts = res?.data?.children?.map((c) => c.data) || [];
    return posts
      .filter((p) => passesRedditFilter(p, REDDIT_FILTER))
      .map((p) => ({
        sourceId: src.id,
        sourceLabel: src.label,
        group: src.group,
        title: p.title,
        link: `https://www.reddit.com${p.permalink}`,
        pubDate: new Date((p.created_utc || 0) * 1000).toISOString(),
        snippet: p.selftext?.slice(0, 800) || "",
        alwaysRelevant: true,
      }));
  } catch (e) {
    console.warn(`[reddit] ${src.id} falhou: ${e.message}`);
    return [];
  }
}

async function main() {
  await fs.mkdir(NEWS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await ensureImgDir();

  const curator = await loadCurator(CURATOR_NAME);
  const isRoutineMode = curator.NAME === "routine";

  const seen = await readJson(SEEN_PATH, {});
  const current = await readJson(INDEX_PATH, { updated: null, items: [] });
  const currentItems = Array.isArray(current.items) ? current.items : [];
  const pendingBefore = await readJson(PENDING_PATH, { items: [] });
  const pendingBeforeItems = Array.isArray(pendingBefore.items) ? pendingBefore.items : [];

  console.log(`[news] curator: ${curator.LABEL} | fontes: ${SOURCES.length} | seen: ${Object.keys(seen).length} | current: ${currentItems.length} | dry: ${DRY}`);

  const all = [];
  for (const src of SOURCES) {
    const items = await fetchFeedItems(src);
    for (const it of items) {
      if (!it.link || !it.title) continue;
      const url = canonicalize(it.link);
      if (!it.alwaysRelevant && !isRelevant(`${it.title} ${it.snippet}`)) continue;
      const h = sha10(url);
      if (seen[h]) continue;
      // se ja esta em _pending, tambem pula
      if (pendingBeforeItems.some((p) => p.id === h)) continue;
      all.push({ ...it, url, hash: h });
    }
    await sleep(400);
  }

  console.log(`[news] candidatos novos pos-filtros: ${all.length}`);

  all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const fresh = all.slice(0, MAX_NEW_PER_RUN);

  const curated = [];
  const pending = [];
  for (const c of fresh) {
    console.log(`[news] processando: ${c.sourceLabel} | ${c.title.slice(0, 70)}`);
    const { imgUrl, articleText } = await scrapeArticle(c.url);
    const localImg = await cacheImage(imgUrl, c.hash);

    const out = await curator.curate({
      title: c.title,
      sourceLabel: c.sourceLabel,
      articleText: articleText || c.snippet,
      url: c.url,
      pubDate: c.pubDate,
    });

    if (out === "SKIP") {
      console.log(`[news] SKIP: ${c.title.slice(0, 70)}`);
      seen[c.hash] = { skipped: true, ts: Date.now(), title: c.title };
      continue;
    }

    if (out === "PENDING") {
      // modo routine: empilha em _pending.json com texto bruto pra Claude curar depois
      pending.push({
        id: c.hash,
        url: c.url,
        source: c.sourceId,
        sourceLabel: c.sourceLabel,
        group: c.group,
        pubDate: c.pubDate,
        fetchedAt: new Date().toISOString(),
        img: localImg,
        title_orig: c.title,
        article_text: articleText || c.snippet || "",
      });
      // NAO marca seen aqui; so marca depois que a routine commitar.
      continue;
    }

    curated.push({
      id: c.hash,
      url: c.url,
      source: c.sourceId,
      sourceLabel: c.sourceLabel,
      group: c.group,
      pubDate: c.pubDate,
      fetchedAt: new Date().toISOString(),
      img: localImg,
      title_pt: out.titulo_pt,
      intro_pt: out.intro_pt,
      body_pt: out.corpo_pt,
      tags: out.tags,
    });
    seen[c.hash] = { firstSeen: Date.now(), title: c.title };
  }

  console.log(`[news] curados agora: ${curated.length} | pendentes pra routine: ${pending.length}`);

  // Em modo routine, escreve _pending.json e termina (NAO altera index.json).
  if (isRoutineMode) {
    const newPending = {
      generatedAt: new Date().toISOString(),
      items: [...pendingBeforeItems, ...pending],
    };
    if (DRY) {
      console.log("[news] DRY RUN routine — nao escrevendo arquivos.");
      console.log(JSON.stringify({ pending_total: newPending.items.length, novos: pending.length }, null, 2));
    } else {
      await writeJson(PENDING_PATH, newPending);
      await writeJson(SEEN_PATH, seen); // skipped marcados; pendentes ficam de fora
      console.log(`[news] escrito: ${PENDING_PATH} (${newPending.items.length} aguardando curadoria)`);
    }
    return;
  }

  // merge normal (anthropic/gemini): novos no topo, dedupe por id, mantem top TOP_KEEP
  const map = new Map();
  for (const it of curated) map.set(it.id, it);
  for (const it of currentItems) if (!map.has(it.id)) map.set(it.id, it);
  const merged = [...map.values()].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const finalItems = merged.slice(0, TOP_KEEP);
  const overflow = merged.slice(TOP_KEEP);

  if (overflow.length > 0) {
    const byMonth = new Map();
    for (const it of overflow) {
      const ym = (it.pubDate || new Date().toISOString()).slice(0, 7);
      if (!byMonth.has(ym)) byMonth.set(ym, []);
      byMonth.get(ym).push(it);
    }
    for (const [ym, items] of byMonth) {
      const p = path.join(ARCHIVE_DIR, `${ym}.json`);
      const existing = await readJson(p, { items: [] });
      const seenIds = new Set((existing.items || []).map((x) => x.id));
      const merged2 = [...(existing.items || []), ...items.filter((x) => !seenIds.has(x.id))];
      await writeJson(p, { month: ym, items: merged2 });
    }
  }

  const keepHashes = finalItems.filter((i) => i.img).map((i) => i.id);
  if (!DRY) await gcOrphanImages(keepHashes);

  const out = { updated: new Date().toISOString(), items: finalItems };
  if (DRY) {
    console.log("[news] DRY RUN — nao escrevendo arquivos.");
    console.log(JSON.stringify({ added: curated.length, total: finalItems.length }, null, 2));
    console.log("--- primeiros 3 itens ---");
    console.log(JSON.stringify(finalItems.slice(0, 3), null, 2));
  } else {
    await writeJson(INDEX_PATH, out);
    await writeJson(SEEN_PATH, seen);
    console.log(`[news] escrito: ${INDEX_PATH} (${finalItems.length} items)`);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

main().catch((e) => {
  console.error("[news] FATAL:", e);
  process.exit(1);
});
