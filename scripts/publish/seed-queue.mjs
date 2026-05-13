// Helper de DEV: popula media/news/_publish-queue.json com os N items
// mais recentes do index.json, ja com publishAt no passado (maduros).
// Permite testar build de slides + run-publish sem esperar 3h.
//
// Uso:
//   node scripts/publish/seed-queue.mjs --count=3
//   node scripts/publish/seed-queue.mjs --count=2 --type=spotlight
//
// Idempotente: nao duplica ids ja na fila.

import fs from "node:fs/promises";
import path from "node:path";
import { readQueue, writeQueue } from "./queue.mjs";

const INDEX_PATH = path.resolve("media/news/index.json");

const args = process.argv.slice(2);
const COUNT_ARG = args.find((a) => a.startsWith("--count="));
const TYPE_ARG = args.find((a) => a.startsWith("--type="));
const COUNT = COUNT_ARG ? parseInt(COUNT_ARG.split("=")[1], 10) : 3;
const FILTER_TYPE = TYPE_ARG ? TYPE_ARG.split("=")[1] : null;

function inferType(item) {
  if (item.kind === "community-spotlight" || item.kind === "community-digest") return "spotlight";
  return "regular";
}

async function main() {
  const raw = await fs.readFile(INDEX_PATH, "utf8");
  const indexDoc = JSON.parse(raw);
  let candidates = indexDoc.items || [];
  if (FILTER_TYPE) {
    candidates = candidates.filter((it) => inferType(it) === FILTER_TYPE);
  }
  candidates = candidates.slice(0, COUNT);

  if (candidates.length === 0) {
    console.error(`[seed] nenhum item encontrado (type=${FILTER_TYPE || "any"})`);
    process.exit(1);
  }

  const queue = await readQueue();
  const existing = new Set(queue.items.map((q) => q.id));
  const nowIso = new Date().toISOString();
  const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
  const added = [];

  for (const it of candidates) {
    if (existing.has(it.id)) continue;
    queue.items.push({
      id: it.id,
      type: inferType(it),
      queuedAt: nowIso,
      publishAt: pastIso,
      postedAt: null,
      postId: null,
      error: null,
      _seeded: true,
    });
    added.push(it.id);
  }

  await writeQueue(queue);
  console.log(`[seed] adicionados ${added.length} items (publishAt no passado):`, added);
}

main().catch((e) => {
  console.error("[seed] FATAL:", e.message || e);
  process.exit(1);
});
