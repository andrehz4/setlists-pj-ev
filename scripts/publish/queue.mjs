// Fila de publicacao no Instagram. Cada item curado pelo Sonnet entra
// aqui com publishAt = now (sem delay editorial). Decisao: Andre confia
// 100% na curadoria/traducao da routine Sonnet e nao revisa antes de
// postar; manter delay so cria janelas mortas no feed (ver memoria
// feedback_no_publish_delay.md). O worker do cron (30min) le items
// maduros, agrupa por type (regular vs spotlight), monta carrossel
// e marca como postado.

import fs from "node:fs/promises";
import path from "node:path";

const QUEUE_PATH = path.resolve("media/news/_publish-queue.json");
// Zero = posta no proximo cron de 30min apos a curadoria.
export const PUBLISH_DELAY_MS = 0;
export const MAX_PER_CAROUSEL = 10;

export async function readQueue() {
  try {
    const raw = await fs.readFile(QUEUE_PATH, "utf8");
    const doc = JSON.parse(raw);
    if (!doc || !Array.isArray(doc.items)) return { items: [], postCount: 0 };
    return { items: doc.items, postCount: doc.postCount || 0 };
  } catch {
    return { items: [], postCount: 0 };
  }
}

export async function writeQueue(queue) {
  const sorted = {
    items: [...queue.items].sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt)),
    postCount: queue.postCount || 0,
  };
  await fs.writeFile(QUEUE_PATH, JSON.stringify(sorted, null, 2));
}

function inferType(item) {
  if (item.kind === "community-spotlight" || item.kind === "community-digest") return "spotlight";
  return "regular";
}

// Adiciona items que ainda nao estao na fila. Dedupe por id. publishAt
// herda do queuedAt (now) + delay padrao se nao especificado.
export function enqueue(queue, items, now = Date.now()) {
  const existing = new Set(queue.items.map((q) => q.id));
  const added = [];
  for (const it of items) {
    if (!it || !it.id || existing.has(it.id)) continue;
    const queuedAt = new Date(now).toISOString();
    const publishAt = new Date(now + PUBLISH_DELAY_MS).toISOString();
    queue.items.push({
      id: it.id,
      type: inferType(it),
      queuedAt,
      publishAt,
      postedAt: null,
      postId: null,
      error: null,
    });
    added.push(it.id);
  }
  return added;
}

// Retorna items maduros (publishAt <= now) ainda nao postados, ate `limit`.
// Filtra por type. Items com error recente sao tentados de novo (worker
// pode decidir desistir apos N falhas, isso fica na responsabilidade dele).
export function pickMatureByType(queue, type, nowIso, limit = MAX_PER_CAROUSEL) {
  const now = new Date(nowIso).getTime();
  const mature = queue.items.filter((q) => {
    if (q.postedAt) return false;
    if (q.type !== type) return false;
    return new Date(q.publishAt).getTime() <= now;
  });
  return mature.slice(0, limit);
}

export function markPosted(queue, ids, postId, nowIso) {
  const set = new Set(ids);
  for (const q of queue.items) {
    if (set.has(q.id)) {
      q.postedAt = nowIso;
      q.postId = postId;
      q.error = null;
    }
  }
}

export function markError(queue, ids, errMsg, nowIso) {
  const set = new Set(ids);
  for (const q of queue.items) {
    if (set.has(q.id)) {
      q.error = { at: nowIso, msg: String(errMsg).slice(0, 500) };
    }
  }
}

// Limpa items postados ha mais de N dias (housekeeping). Mantem
// historico recente pra debug, mas nao acumula infinito.
export function pruneOldPosted(queue, nowIso, keepDays = 30) {
  const cutoff = new Date(nowIso).getTime() - keepDays * 24 * 60 * 60 * 1000;
  const before = queue.items.length;
  queue.items = queue.items.filter((q) => {
    if (!q.postedAt) return true;
    return new Date(q.postedAt).getTime() >= cutoff;
  });
  return before - queue.items.length;
}
