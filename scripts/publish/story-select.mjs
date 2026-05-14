// Selecao das noticias que entram no story diario. Filtra index.json
// pelas ultimas N horas (default 24h), ranqueia spotlight > regular,
// e retorna ate MAX items normalizados. Story = vitrine do que rolou,
// nao "ultimas N do feed". Por isso usa fetchedAt (entrada no nosso
// pipeline), nao pubDate (que pode ser antigo de uma fonte que
// indexou tarde).

import fs from "node:fs/promises";
import path from "node:path";

const INDEX_PATH = path.resolve("media/news/index.json");
const ITEMS_DIR = path.resolve("media/news/items");

const SPOTLIGHT_KINDS = new Set(["community-spotlight", "community-digest"]);

function itemTimestamp(it) {
  return new Date(it.fetchedAt || it.pubDate || 0).getTime();
}

function isSpotlight(it) {
  return SPOTLIGHT_KINDS.has(it.kind);
}

export async function selectStoryItems({ now = Date.now(), hours = 24, max = 5, indexPath = INDEX_PATH } = {}) {
  const raw = await fs.readFile(indexPath, "utf8");
  const doc = JSON.parse(raw);
  const cutoff = now - hours * 60 * 60 * 1000;

  const recent = (doc.items || []).filter((it) => itemTimestamp(it) >= cutoff);

  // ranqueia: spotlight primeiro, depois fetchedAt desc (mais novo primeiro)
  recent.sort((a, b) => {
    const sa = isSpotlight(a) ? 0 : 1;
    const sb = isSpotlight(b) ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return itemTimestamp(b) - itemTimestamp(a);
  });

  // dedupe por id (caso index.json tenha duplicata)
  const seen = new Set();
  const picked = [];
  for (const it of recent) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    picked.push(it);
    if (picked.length >= max) break;
  }
  return picked;
}

// CLI util: node story-select.mjs [hours] [max]
if (process.argv[1]?.endsWith("story-select.mjs")) {
  const hours = process.argv[2] ? parseInt(process.argv[2], 10) : 24;
  const max = process.argv[3] ? parseInt(process.argv[3], 10) : 5;
  selectStoryItems({ hours, max }).then((items) => {
    console.log(`[story-select] ${items.length} items (ultimas ${hours}h, max ${max})`);
    items.forEach((it, i) => {
      console.log(`  ${i + 1}. [${isSpotlight(it) ? "spotlight" : "regular"}] ${it.id} - ${it.title_pt?.slice(0, 60) || it.url}`);
    });
  }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
