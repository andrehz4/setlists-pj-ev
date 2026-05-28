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
const DENYLIST_PATH = path.resolve("media/news/_deleted-from-ig.json");
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

// Denylist permanente de items apagados do IG (manualmente pelo Andre ou
// detectados via GET /<post-id> retornando 404). Tombstone PERPETUO: nunca
// expira, nunca e podado pelo pruneOldPosted. Garante que post deletado
// JAMAIS volta ao feed, mesmo se:
//   - alguem editar o queue.json removendo postedAt
//   - o item sair do queue (apos 30d) e a curadoria re-criar item com mesmo id
//   - a routine sonnet enqueue de novo
export async function readDenylist() {
  try {
    const raw = await fs.readFile(DENYLIST_PATH, "utf8");
    const doc = JSON.parse(raw);
    if (!doc || !Array.isArray(doc.deleted)) return { deleted: [], updatedAt: null };
    return { deleted: doc.deleted, updatedAt: doc.updatedAt || null };
  } catch {
    return { deleted: [], updatedAt: null };
  }
}

export async function writeDenylist(denylist) {
  const sorted = {
    deleted: [...denylist.deleted].sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt)),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(DENYLIST_PATH, JSON.stringify(sorted, null, 2));
}

// Adiciona item a denylist se ainda nao estiver. Idempotente.
// Retorna true se foi adicionado agora, false se ja existia.
export function addToDenylist(denylist, { itemId, postId = null, reason = "manual", deletedAt = null }) {
  if (!itemId) return false;
  const existing = denylist.deleted.find((d) => d.itemId === itemId);
  if (existing) return false;
  denylist.deleted.push({
    itemId,
    postId,
    reason,
    deletedAt: deletedAt || new Date().toISOString(),
  });
  return true;
}

export function removeFromDenylist(denylist, itemId) {
  const before = denylist.deleted.length;
  denylist.deleted = denylist.deleted.filter((d) => d.itemId !== itemId);
  return before !== denylist.deleted.length;
}

export function isDenied(denylist, itemId) {
  if (!denylist || !Array.isArray(denylist.deleted)) return false;
  return denylist.deleted.some((d) => d.itemId === itemId);
}

function inferType(item) {
  if (item.kind === "community-spotlight" || item.kind === "community-digest") return "spotlight";
  return "regular";
}

// Adiciona items que ainda nao estao na fila. Dedupe por id. publishAt
// herda do queuedAt (now) + delay padrao se nao especificado.
// Se `denylist` for passado, items que estao no denylist (apagados do IG)
// NUNCA voltam pra fila. Retorna { added: [...ids], blocked: [...ids] }.
export function enqueue(queue, items, now = Date.now(), denylist = null) {
  const existing = new Set(queue.items.map((q) => q.id));
  const added = [];
  const blocked = [];
  for (const it of items) {
    if (!it || !it.id || existing.has(it.id)) continue;
    if (denylist && isDenied(denylist, it.id)) {
      blocked.push(it.id);
      continue;
    }
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
  // Compat: callers antigos esperam um array. Retorna array + propriedade
  // .blocked anexada (legivel via destructuring tambem).
  added.blocked = blocked;
  return added;
}

// Retorna items maduros (publishAt <= now) ainda nao postados, ate `limit`.
// Filtra por type. Items com error recente sao tentados de novo (worker
// pode decidir desistir apos N falhas, isso fica na responsabilidade dele).
// Se `denylist` for passado, items deletados do IG sao filtrados (defense
// in depth: mesmo se postedAt foi zerado por engano, denylist ainda bloqueia).
// Items com _rateLimitedUntil no futuro tambem sao filtrados (backoff
// pos-erro de quota IG, evita queimar API call que vai falhar de novo).
export function pickMatureByType(queue, type, nowIso, limit = MAX_PER_CAROUSEL, denylist = null) {
  const now = new Date(nowIso).getTime();
  const mature = queue.items.filter((q) => {
    if (q.postedAt) return false;
    if (q.type !== type) return false;
    if (denylist && isDenied(denylist, q.id)) return false;
    if (q._rateLimitedUntil && new Date(q._rateLimitedUntil).getTime() > now) return false;
    return new Date(q.publishAt).getTime() <= now;
  });
  return mature.slice(0, limit);
}

// Marca items como rate-limited ate `untilIso`. Usado quando IGRateLimitError
// e capturado: nao adianta retentar nos proximos crons enquanto a janela
// rolling de 24h nao liberar. Quando expira, item volta naturalmente ao
// pickMature. Diferente de markError, _rateLimitedUntil e backoff temporal,
// nao falha permanente.
export function markRateLimited(queue, ids, untilIso, nowIso) {
  const set = new Set(ids);
  for (const q of queue.items) {
    if (set.has(q.id)) {
      q._rateLimitedUntil = untilIso;
      q.error = { at: nowIso, msg: `IG rate limit, retry apos ${untilIso}` };
    }
  }
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
// Se `denylist` for passado, items na denylist NAO sao podados (tombstone
// perpetuo no queue, defesa extra contra reaparicao).
export function pruneOldPosted(queue, nowIso, keepDays = 30, denylist = null) {
  const cutoff = new Date(nowIso).getTime() - keepDays * 24 * 60 * 60 * 1000;
  const before = queue.items.length;
  queue.items = queue.items.filter((q) => {
    if (!q.postedAt) return true;
    if (denylist && isDenied(denylist, q.id)) return true;
    return new Date(q.postedAt).getTime() >= cutoff;
  });
  return before - queue.items.length;
}
