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
import { dedupeByContent } from "./dedupe.mjs";
import { writeStepSummary } from "./_summary.mjs";

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
const ITEMS_DIR = path.join(NEWS_DIR, "items");

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";

// body_pt vai pra items/<id>.json; o index.json fica light com so metadata.
function splitItemBody(it) {
  const { body_pt, ...meta } = it;
  return { meta, body: body_pt ? { id: it.id, body_pt } : null };
}

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); }
  catch (err) {
    if (err.code !== "ENOENT") console.warn(`[news] readJson: ${path.basename(p)} corrompido ou ilegivel (${err.message}), usando fallback`);
    return fallback;
  }
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
  if (src.kind === "shopify") return fetchShopifyItems(src);
  if (src.kind === "pjcom-news") return fetchPjcomNewsItems(src);
  try {
    const feed = await parser.parseURL(src.url);
    const items = (feed.items || []).slice(0, 25).map((it) => ({
      sourceId: src.id,
      sourceLabel: src.label,
      group: src.group,
      title: (it.title || "").trim(),
      link: (it.link || "").trim(),
      pubDate: it.isoDate || it.pubDate || new Date().toISOString(),
      snippet: (it.contentSnippet || it.content || "").slice(0, 800),
      alwaysRelevant: !!src.alwaysRelevant,
    }));
    return { items, error: null };
  } catch (e) {
    console.warn(`[feed] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}

async function fetchRedditItems(src) {
  try {
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
    const items = posts
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
    return { items, error: null };
  } catch (e) {
    console.warn(`[reddit] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}

// Loja oficial via endpoint Shopify JSON nativo. Cada produto retorna
// metadata rica (body_html, vendor, tags, variants, images). Filtra produtos
// com published_at nos ultimos SHOP_NEW_DAYS pra nao polir feed inteiro
// quando estriar. Vendor "Gift Card" e ignorado. Item retorna ja com
// preText (body_html limpo) + preImg (1a imagem) pra pular scrape.
const SHOP_NEW_DAYS = 21;
async function fetchShopifyItems(src) {
  try {
    const res = await got(src.url, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
      timeout: { request: 15000 },
      retry: { limit: 1 },
    }).json();
    const products = Array.isArray(res?.products) ? res.products : [];
    const cutoff = Date.now() - SHOP_NEW_DAYS * 24 * 60 * 60 * 1000;
    const items = products
      .filter((p) => {
        const ts = new Date(p.published_at || p.created_at || 0).getTime();
        if (ts < cutoff) return false;
        if ((p.product_type || "").toLowerCase().includes("gift")) return false;
        return true;
      })
      .map((p) => {
        const handle = p.handle || String(p.id);
        const link = `https://shop.pearljam.com/products/${handle}`;
        const img = p.images?.[0]?.src || p.variants?.[0]?.featured_image?.src || null;
        // body_html cleanup minimal: tira tags HTML e entities comuns
        const bodyText = String(p.body_html || "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;|&apos;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        const vendor = p.vendor || "";
        const variants = (p.variants || []).map((v) => v.title).filter(Boolean).join(" / ");
        // articleText pro curador: tudo que da contexto editorial
        const text = [
          `Produto: ${p.title}`,
          vendor ? `Vendor: ${vendor}` : "",
          variants ? `Formatos: ${variants}` : "",
          "",
          bodyText,
        ].filter(Boolean).join("\n");
        return {
          sourceId: src.id,
          sourceLabel: src.label,
          group: src.group,
          title: p.title,
          link,
          pubDate: p.published_at || p.created_at || new Date().toISOString(),
          snippet: bodyText.slice(0, 800),
          alwaysRelevant: true,
          kind: "shop",       // propagado pra _pending.json
          preText: text,      // pula scrape do extract.mjs
          preImg: img,        // imagem direta do Shopify
        };
      });
    return { items, error: null };
  } catch (e) {
    console.warn(`[shopify] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}

// pearljam.com/news: RSS quebrado, mas o HTML tem JSON inline com "articles": [...].
// Extrai via regex e mapeia pra formato compativel. Cada article vira candidato;
// link aponta pra pagina individual. O scrape do extract.mjs pega corpo depois.
async function fetchPjcomNewsItems(src) {
  try {
    const html = await got(src.url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      timeout: { request: 20000 },
      retry: { limit: 1 },
    }).text();
    // procura o array "articles": [...] dentro do HTML (data inline pra template)
    const m = html.match(/"articles"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
    if (!m) {
      console.warn(`[pjcom-news] JSON inline nao encontrado em ${src.url}`);
      return [];
    }
    let articles;
    try { articles = JSON.parse(m[1]); } catch (e) {
      console.warn(`[pjcom-news] JSON parse falhou: ${e.message}`);
      return [];
    }
    const items = (articles || []).slice(0, 15).map((a) => {
      const slug = a.slug || a.id;
      const link = `https://pearljam.com/news/${slug}`;
      const img = a.square_image_file || a.image_file || null;
      const excerpt = (a.excerpt || a.description || "").slice(0, 800);
      return {
        sourceId: src.id,
        sourceLabel: src.label,
        group: src.group,
        title: (a.title || "").trim(),
        link,
        pubDate: a.publish_date || a.created_at || new Date().toISOString(),
        snippet: excerpt,
        alwaysRelevant: true,
        kind: "pjcom-news",
        preImg: img,
        preText: excerpt,  // evita scrape do pearljam.com que retorna overlay SMS
      };
    });
    return { items, error: null };
  } catch (e) {
    console.warn(`[pjcom-news] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
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
  const sourceResults = [];
  const allWarnings = [];
  for (const src of SOURCES) {
    const { items, error } = await fetchFeedItems(src);
    sourceResults.push({ label: src.label, count: items.length, error });
    if (error) allWarnings.push(`${src.label}: ${error}`);
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

  // Dedupe por similaridade de conteudo dentro do grupo BR. Detecta replicas
  // de wire/press release que portais (Folha, Globo, Terra, CNN, etc) publicam
  // quase identicas com minutos de diferenca. Mantem o item com texto mais longo.
  const { survivors: deduped, removed: brRemoved } = dedupeByContent(all, {
    threshold: 0.65,
    groupFilter: "br",
  });
  if (brRemoved.length > 0) {
    console.log(`[news] dedupe BR: ${brRemoved.length} replica(s) removidas`);
    for (const r of brRemoved) {
      console.log(`  - removido: [${r.item.sourceLabel}] ${r.item.title.slice(0, 60)}`);
      console.log(`    em favor de: [${r.replacedBy.sourceLabel}] ${r.replacedBy.title.slice(0, 60)} (sim=${r.similarity})`);
    }
  }

  deduped.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const fresh = deduped.slice(0, MAX_NEW_PER_RUN);

  const curated = [];
  const pending = [];
  for (const c of fresh) {
    console.log(`[news] processando: ${c.sourceLabel} | ${c.title.slice(0, 70)}`);
    try {
      // Fontes que ja vem com texto/imagem pre-extraidos (shop Shopify, pjcom-news)
      // pulam o scrape do extract.mjs. Demais usam scrape padrao.
      let imgUrl, articleText;
      if (c.preText || c.preImg) {
        articleText = c.preText || "";
        imgUrl = c.preImg || null;
        if (!articleText) {
          const scraped = await scrapeArticle(c.url);
          articleText = scraped.articleText;
          if (!imgUrl) imgUrl = scraped.imgUrl;
        }
      } else {
        ({ imgUrl, articleText } = await scrapeArticle(c.url));
      }
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
        const pendingItem = {
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
        };
        // propaga kind (shop, pjcom-news, etc) pra curador Sonnet detectar
        // e aplicar regra editorial especifica do tipo
        if (c.kind) pendingItem.kind = c.kind;
        pending.push(pendingItem);
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
    } catch (err) {
      console.warn(`[news] ERRO em "${c.title.slice(0, 60)}" (${c.url}): ${err.message}`);
      allWarnings.push(`Item com erro [${c.sourceLabel}] "${c.title.slice(0, 60)}": ${err.message}`);
      // Marca como erro no seen pra nao entrar em loop de reprocessamento infinito.
      // Na proxima run, o item so volta se seen for limpo manualmente.
      seen[c.hash] = { error: true, ts: Date.now(), title: c.title, msg: err.message };
    }
  }

  console.log(`[news] curados agora: ${curated.length} | pendentes pra routine: ${pending.length}`);

  const skippedCount = Math.max(0, fresh.length - curated.length - pending.length);

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
    await writeStepSummary({
      title: "News fetch · modo routine (so coleta)",
      meta: { curator: curator.LABEL, fontes: SOURCES.length, dry: DRY },
      stats: {
        "candidatos novos": all.length,
        "coletados nesta run": pending.length,
        "skipped pelo curator": skippedCount,
        "pending total agora": newPending.items.length,
        "index atual": currentItems.length,
      },
      sources: sourceResults,
      warnings: allWarnings.length ? allWarnings : undefined,
      pending,
      extras: [
        { heading: "Proximo passo", body: "A routine Sonnet remota le `_pending.json`, cura, e roda `node scripts/news/merge-curated.mjs` pra publicar no `index.json`." },
      ],
    });
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

  // split body_pt em items/<id>.json e deixa index.json so com metadata
  if (!DRY) await fs.mkdir(ITEMS_DIR, { recursive: true });
  const lightItems = [];
  for (const it of finalItems) {
    const { meta, body } = splitItemBody(it);
    if (!DRY && body) {
      await fs.writeFile(path.join(ITEMS_DIR, `${body.id}.json`), JSON.stringify(body, null, 2));
    }
    lightItems.push(meta);
  }

  const out = { updated: new Date().toISOString(), items: lightItems };
  if (DRY) {
    console.log("[news] DRY RUN — nao escrevendo arquivos.");
    console.log(JSON.stringify({ added: curated.length, total: finalItems.length }, null, 2));
    console.log("--- primeiros 3 itens (light) ---");
    console.log(JSON.stringify(lightItems.slice(0, 3), null, 2));
  } else {
    await writeJson(INDEX_PATH, out);
    await writeJson(SEEN_PATH, seen);
    console.log(`[news] escrito: ${INDEX_PATH} (${lightItems.length} items, body em items/)`);
  }

  await writeStepSummary({
    title: "News fetch",
    meta: { curator: curator.LABEL, fontes: SOURCES.length, dry: DRY },
    stats: {
      "candidatos novos": all.length,
      "publicados agora": curated.length,
      "skipped pelo curator": skippedCount,
      "total no index": finalItems.length,
      "arquivados (overflow)": overflow.length,
    },
    sources: sourceResults,
    warnings: allWarnings.length ? allWarnings : undefined,
    curated,
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

main().catch((e) => {
  console.error("[news] FATAL:", e);
  process.exit(1);
});
