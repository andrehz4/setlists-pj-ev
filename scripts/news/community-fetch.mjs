// Orquestrador do pipeline de comunidade. Pra rodar:
//   node scripts/news/community-fetch.mjs --mode=digest   [--dry-run]
//   node scripts/news/community-fetch.mjs --mode=spotlight [--dry-run]
//   node scripts/news/community-fetch.mjs --mode=both     [--dry-run]
//
// Diferenca do fetch-news.mjs:
//   - Fonte unica (r/pearljam), nao itera SOURCES
//   - Output entra no MESMO media/news/index.json, mas com source dedicada
//     ("reddit-community-digest" ou "reddit-community-spotlight")
//   - Dedupe usa media/news/seen.json com prefixo cd- / cs- pra nao bater com news
//
// Digest:
//   - 1x/dia (idealmente manha BRT)
//   - Pega top.json?t=day, agrega 10-15 posts, gera 1 materia
//   - Dedupe: usa key "cd-YYYYMMDD" no seen.json (1 digest por dia)
//
// Spotlight:
//   - 1x/dia (idealmente noite BRT)
//   - Pega top.json?t=week, filtra fan content com imagem, pega melhor nao publicado
//   - Dedupe: usa key "cs-<sha10(permalink)>" no seen.json (post nao repete)

import fs from "node:fs/promises";
import path from "node:path";
import {
  fetchTopDay,
  fetchTopWeek,
  pickSpotlightCandidate,
} from "./reddit-community.mjs";
import { sha10 } from "./relevance.mjs";
import { cacheImage, gcOrphanImages, ensureImgDir } from "./image-cache.mjs";
import { curate as curateDigest } from "./curators/community-digest.mjs";
import { curate as curateSpotlight } from "./curators/community-spotlight.mjs";

const args = process.argv.slice(2);
function argVal(name) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return null;
}
const MODE = (argVal("mode") || "both").toLowerCase();
const DRY = args.includes("--dry-run");

if (!["digest", "spotlight", "both"].includes(MODE)) {
  console.error(`[community] modo invalido: '${MODE}'. Use: digest | spotlight | both`);
  process.exit(1);
}

const TOP_KEEP = 30;
const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");

const DIGEST_MIN_POSTS = 5;
const DIGEST_MAX_INPUT_POSTS = 15;
const SPOTLIGHT_MIN_SCORE = 50;

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}
async function writeJson(p, data) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
}

async function runDigest({ seen, currentItems }) {
  const dateKey = todayUTC();
  const id = `cd-${dateKey}`;
  if (seen[id]) {
    console.log(`[digest] ja publicado hoje (${id}), pulando.`);
    return null;
  }

  console.log(`[digest] buscando top.json?t=day...`);
  const all = await fetchTopDay(25);
  const posts = all.slice(0, DIGEST_MAX_INPUT_POSTS);
  console.log(`[digest] ${all.length} posts elegiveis, usando top ${posts.length}`);

  if (posts.length < DIGEST_MIN_POSTS) {
    console.log(`[digest] menos de ${DIGEST_MIN_POSTS} posts no dia, pulando.`);
    return null;
  }

  const out = await curateDigest({ posts, periodLabel: "ultimas 24 horas" });
  if (out === "SKIP") {
    console.log("[digest] curator retornou SKIP, dia fraco.");
    seen[id] = { skipped: true, ts: Date.now(), kind: "community-digest" };
    return null;
  }

  // imagem do digest: usa o cover do post mais votado que tiver imagem
  const postWithImg = posts.find((p) => p.cover_image);
  let localImg = null;
  if (postWithImg) {
    localImg = await cacheImage(postWithImg.cover_image, id);
  }

  const item = {
    id,
    url: `https://www.reddit.com/r/pearljam/top/?t=day`,
    source: "reddit-community-digest",
    sourceLabel: "Comunidade r/pearljam",
    group: "comunidade",
    pubDate: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    img: localImg,
    title_pt: out.titulo_pt,
    intro_pt: out.intro_pt,
    body_pt: out.corpo_pt,
    tags: out.tags,
    community_posts_count: posts.length,
  };
  seen[id] = { firstSeen: Date.now(), kind: "community-digest", title: out.titulo_pt };
  return item;
}

async function runSpotlight({ seen, currentItems }) {
  console.log(`[spotlight] buscando top.json?t=week...`);
  const all = await fetchTopWeek(25);
  console.log(`[spotlight] ${all.length} posts da semana`);

  // Constroi set de IDs ja publicados (qualquer chave cs-* no seen)
  const publishedPostIds = new Set();
  for (const [k, v] of Object.entries(seen)) {
    if (k.startsWith("cs-") && v?.post_id) publishedPostIds.add(v.post_id);
  }

  const cand = pickSpotlightCandidate(all, publishedPostIds, { minScore: SPOTLIGHT_MIN_SCORE });
  if (!cand) {
    console.log(`[spotlight] nenhum candidato com score>=${SPOTLIGHT_MIN_SCORE}, com imagem e nao-publicado.`);
    return null;
  }

  console.log(`[spotlight] candidato: ${cand.author} | ${cand.score}pts | ${cand.title.slice(0, 80)}`);

  const id = `cs-${sha10(cand.permalink)}`;
  if (seen[id]) {
    console.log(`[spotlight] id ${id} ja visto (race condition?), pulando.`);
    return null;
  }

  const out = await curateSpotlight({ post: cand });
  if (out === "SKIP") {
    console.log("[spotlight] curator retornou SKIP (menor, meme ou ambíguo).");
    seen[id] = { skipped: true, ts: Date.now(), kind: "community-spotlight", post_id: cand.id };
    return null;
  }

  const localImg = await cacheImage(cand.cover_image, id);

  const item = {
    id,
    url: cand.permalink,
    source: "reddit-community-spotlight",
    sourceLabel: "Comunidade r/pearljam",
    group: "comunidade",
    pubDate: cand.created_iso,
    fetchedAt: new Date().toISOString(),
    img: localImg,
    title_pt: out.titulo_pt,
    intro_pt: out.intro_pt,
    body_pt: out.corpo_pt,
    tags: out.tags,
    community_author: cand.author,
    community_post_url: cand.permalink,
    community_post_score: cand.score,
  };
  seen[id] = {
    firstSeen: Date.now(),
    kind: "community-spotlight",
    post_id: cand.id,
    title: out.titulo_pt,
  };
  return item;
}

async function main() {
  await fs.mkdir(NEWS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await ensureImgDir();

  const seen = await readJson(SEEN_PATH, {});
  const current = await readJson(INDEX_PATH, { updated: null, items: [] });
  const currentItems = Array.isArray(current.items) ? current.items : [];

  console.log(`[community] mode=${MODE} | dry=${DRY} | current items: ${currentItems.length} | seen: ${Object.keys(seen).length}`);

  const newItems = [];
  if (MODE === "digest" || MODE === "both") {
    const d = await runDigest({ seen, currentItems });
    if (d) newItems.push(d);
  }
  if (MODE === "spotlight" || MODE === "both") {
    const s = await runSpotlight({ seen, currentItems });
    if (s) newItems.push(s);
  }

  console.log(`[community] novos itens gerados: ${newItems.length}`);

  if (newItems.length === 0) {
    if (!DRY) await writeJson(SEEN_PATH, seen); // salva skipped/visited
    console.log("[community] nada a publicar.");
    return;
  }

  // Merge no index.json: novos primeiro, dedupe por id, top TOP_KEEP, resto pro archive
  const map = new Map();
  for (const it of newItems) map.set(it.id, it);
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
    console.log("[community] DRY RUN, nao escrevendo arquivos.");
    console.log(JSON.stringify({ added: newItems.length, total: finalItems.length }, null, 2));
    console.log("--- novos itens ---");
    console.log(JSON.stringify(newItems, null, 2));
  } else {
    await writeJson(INDEX_PATH, out);
    await writeJson(SEEN_PATH, seen);
    console.log(`[community] escrito: ${INDEX_PATH} (${finalItems.length} items)`);
  }
}

main().catch((e) => {
  console.error("[community] FATAL:", e);
  process.exit(1);
});
