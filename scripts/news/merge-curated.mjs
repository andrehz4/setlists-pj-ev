// Usado no modo "routine": depois que a Claude routine curatela os itens
// pendentes (le media/news/_pending.json e gera um JSON curado),
// esse script merge no media/news/index.json final.
//
// Uso:
//   echo '[{...curated items...}]' | node scripts/news/merge-curated.mjs --stdin
//   node scripts/news/merge-curated.mjs --file caminho/curated.json
//
// Formato esperado dos items curados (array):
// [
//   { "id": "<sha10>", "titulo_pt": "...", "intro_pt": "...", "corpo_pt": "...", "tags": [...] }
// ]
// O resto (url, source, img, pubDate) eh pego do _pending.json pelo id.

import fs from "node:fs/promises";
import path from "node:path";
import { writeStepSummary } from "./_summary.mjs";

const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");
const ITEMS_DIR = path.join(NEWS_DIR, "items");

// Campos pesados (body_pt principalmente) vao pra arquivo proprio
// em items/<id>.json. O index.json fica leve (so metadata + intro)
// pra carregar rapido no first paint e pra caber no payload do MCP.
function splitItem(it) {
  const { body_pt, ...meta } = it;
  return { meta, body: { id: it.id, body_pt: body_pt || "" } };
}

// Re-hidrata um item que pode estar no formato light (sem body_pt) lendo
// items/<id>.json. Usado pra preservar body_pt ao mover overflow pra archive.
async function hydrateBody(it) {
  if (it.body_pt) return it;
  try {
    const raw = await fs.readFile(path.join(ITEMS_DIR, `${it.id}.json`), "utf8");
    const body = JSON.parse(raw);
    return { ...it, body_pt: body.body_pt || "" };
  } catch {
    return it;
  }
}

const TOP_KEEP = 30;
const VALID_TAGS = new Set([
  "turne", "lancamento", "tenclub", "memoria", "br", "bootleg", "comunidade",
  "eddie", "mike", "stone", "jeff", "matt", "boom", "josh",
]);

const args = process.argv.slice(2);
const USE_STDIN = args.includes("--stdin");
const FILE_IDX = args.indexOf("--file");
const FILE = FILE_IDX >= 0 ? args[FILE_IDX + 1] : null;

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}

function validateCurated(c) {
  if (!c || typeof c !== "object") return null;
  if (!c.id || typeof c.id !== "string") return null;
  if (typeof c.titulo_pt !== "string" || !c.titulo_pt.trim() || c.titulo_pt.length > 90) return null;
  if (typeof c.intro_pt !== "string" || !c.intro_pt.trim()) return null;
  if (typeof c.corpo_pt !== "string" || c.corpo_pt.length < 100) return null;
  const tags = Array.isArray(c.tags) ? c.tags.filter((t) => VALID_TAGS.has(t)).slice(0, 3) : [];
  return { id: c.id, titulo_pt: c.titulo_pt, intro_pt: c.intro_pt, corpo_pt: c.corpo_pt, tags: tags.length ? tags : ["memoria"] };
}

async function main() {
  let raw;
  if (USE_STDIN) {
    raw = await readStdin();
  } else if (FILE) {
    raw = await fs.readFile(FILE, "utf8");
  } else {
    console.error("uso: --stdin OU --file <caminho.json>");
    process.exit(2);
  }

  let curatedInput;
  try {
    curatedInput = JSON.parse(raw);
  } catch (e) {
    console.error("JSON invalido:", e.message);
    process.exit(2);
  }
  if (!Array.isArray(curatedInput)) {
    console.error("input deve ser um array JSON de itens curados");
    process.exit(2);
  }

  const pendingDoc = await readJson(PENDING_PATH, { items: [] });
  const pendingById = new Map((pendingDoc.items || []).map((p) => [p.id, p]));
  const indexDoc = await readJson(INDEX_PATH, { updated: null, items: [] });
  const seen = await readJson(SEEN_PATH, {});

  const newItems = [];
  const acceptedIds = new Set();
  for (const c of curatedInput) {
    const validated = validateCurated(c);
    if (!validated) { console.warn(`[merge] invalido (skip): ${c?.id || "?"}`); continue; }
    const p = pendingById.get(validated.id);
    if (!p) { console.warn(`[merge] id ${validated.id} nao esta em _pending.json (skip)`); continue; }
    const baseItem = {
      id: p.id,
      url: p.url,
      source: p.source,
      sourceLabel: p.sourceLabel,
      group: p.group,
      pubDate: p.pubDate,
      fetchedAt: new Date().toISOString(),
      img: p.img,
      title_pt: validated.titulo_pt,
      intro_pt: validated.intro_pt,
      body_pt: validated.corpo_pt,
      tags: validated.tags,
    };
    // Preserva metadados extras vindos do _pending.json (community-spotlight
    // tem community_author/community_post_url; community-digest tem
    // community_posts_count). Esses campos sao opcionais e so existem em
    // items com kind=community-*.
    if (p.kind) baseItem.kind = p.kind;
    if (p.community_author) baseItem.community_author = p.community_author;
    if (p.community_post_url) baseItem.community_post_url = p.community_post_url;
    if (p.community_post_score != null) baseItem.community_post_score = p.community_post_score;
    if (p.community_posts_count != null) baseItem.community_posts_count = p.community_posts_count;
    newItems.push(baseItem);
    acceptedIds.add(p.id);
    seen[p.id] = { firstSeen: Date.now(), title: p.title_orig || validated.titulo_pt };
  }

  console.log(`[merge] aceitos: ${newItems.length} / ${curatedInput.length}`);

  // merge no index
  const map = new Map();
  for (const it of newItems) map.set(it.id, it);
  for (const it of indexDoc.items || []) if (!map.has(it.id)) map.set(it.id, it);
  const merged = [...map.values()].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const finalItems = merged.slice(0, TOP_KEEP);
  const overflow = merged.slice(TOP_KEEP);

  // arquiva overflow (hidrata body antes de arquivar pra preservar conteudo)
  if (overflow.length > 0) {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    const hydrated = await Promise.all(overflow.map(hydrateBody));
    const byMonth = new Map();
    for (const it of hydrated) {
      const ym = (it.pubDate || new Date().toISOString()).slice(0, 7);
      if (!byMonth.has(ym)) byMonth.set(ym, []);
      byMonth.get(ym).push(it);
    }
    for (const [ym, items] of byMonth) {
      const p = path.join(ARCHIVE_DIR, `${ym}.json`);
      const existing = await readJson(p, { items: [] });
      const seenIds = new Set((existing.items || []).map((x) => x.id));
      const arr = [...(existing.items || []), ...items.filter((x) => !seenIds.has(x.id))];
      await fs.writeFile(p, JSON.stringify({ month: ym, items: arr }, null, 2));
    }
    // Remove items/<id>.json dos arquivados (eles agora vivem no archive inline)
    for (const it of hydrated) {
      await fs.unlink(path.join(ITEMS_DIR, `${it.id}.json`)).catch(() => {});
    }
  }

  // remove os curados de _pending; resto fica pra proximo run
  const remainingPending = (pendingDoc.items || []).filter((p) => !acceptedIds.has(p.id));
  const newPendingDoc = { generatedAt: pendingDoc.generatedAt, items: remainingPending };

  // Split body_pt em arquivos individuais (items/<id>.json) e deixa
  // index.json so com metadata. Arquivos do archive continuam inline
  // porque o site nao carrega archive no init.
  await fs.mkdir(ITEMS_DIR, { recursive: true });
  const lightItems = [];
  for (const it of finalItems) {
    const { meta, body } = splitItem(it);
    if (body.body_pt) {
      await fs.writeFile(path.join(ITEMS_DIR, `${body.id}.json`), JSON.stringify(body, null, 2));
    }
    lightItems.push(meta);
  }

  await fs.writeFile(INDEX_PATH, JSON.stringify({ updated: new Date().toISOString(), items: lightItems }, null, 2));
  await fs.writeFile(SEEN_PATH, JSON.stringify(seen, null, 2));
  if (remainingPending.length === 0) {
    await fs.unlink(PENDING_PATH).catch(() => {});
    console.log(`[merge] _pending.json zerado (deletado).`);
  } else {
    await fs.writeFile(PENDING_PATH, JSON.stringify(newPendingDoc, null, 2));
    console.log(`[merge] _pending.json mantem ${remainingPending.length} aguardando.`);
  }

  console.log(`[merge] index.json: ${finalItems.length} items.`);

  await writeStepSummary({
    title: "News merge-curated",
    meta: { recebidos: curatedInput.length, aceitos: newItems.length, rejeitados: curatedInput.length - newItems.length },
    stats: {
      "publicados agora": newItems.length,
      "total no index": finalItems.length,
      "pending restante": remainingPending.length,
      "arquivados (overflow)": overflow.length,
    },
    curated: newItems,
  });
}

main().catch((e) => {
  console.error("[merge] FATAL:", e);
  process.exit(1);
});
