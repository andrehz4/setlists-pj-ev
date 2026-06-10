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
const COOLDOWN_PATH = path.resolve("media/news/_ig-cooldown.json");
// Zero = posta no proximo cron de 30min apos a curadoria.
export const PUBLISH_DELAY_MS = 0;
export const MAX_PER_CAROUSEL = 10;

export async function readQueue() {
  let raw;
  try {
    raw = await fs.readFile(QUEUE_PATH, "utf8");
  } catch (e) {
    // Arquivo ausente = primeira execucao, fila vazia e legitimo.
    if (e.code === "ENOENT") return { items: [], postCount: 0 };
    throw new Error(`readQueue: falha ao ler ${QUEUE_PATH}: ${e.message}`);
  }
  // Arquivo EXISTE mas esta corrompido (JSON truncado por merge ruim, write
  // interrompido): falhar alto e visivel. O fallback silencioso de antes
  // fazia a run acreditar que a fila estava vazia e sobrescrevia o estado
  // real no commit seguinte (perda de postedAt = repost no feed).
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new Error(`readQueue: ${QUEUE_PATH} corrompido (${e.message}). NAO sobrescrever; inspecione o arquivo no repo.`);
  }
  if (!doc || !Array.isArray(doc.items)) {
    throw new Error(`readQueue: ${QUEUE_PATH} sem .items[] (shape inesperado). NAO sobrescrever; inspecione o arquivo no repo.`);
  }
  return { items: doc.items, postCount: doc.postCount || 0 };
}

export async function writeQueue(queue) {
  const sorted = {
    items: [...queue.items].sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt)),
    postCount: queue.postCount || 0,
  };
  await fs.writeFile(QUEUE_PATH, JSON.stringify(sorted, null, 2));
}

// Reconcilia duas versoes da fila apos conflito de rebase (outro workflow,
// ex. news-merge, commitou a fila enquanto esta run rodava). Merge por id:
// vence o estado mais AVANCADO (postado > backoff/erro > pendente; empate =
// local, que carrega _lastAttempt* desta run). Itens que so existem de um
// lado sao preservados (remoto pode ter enfileirado novos; local pode ter
// acabado de enfileirar). Sem isso, o re-commit pos-conflito sobrescreveria
// postedAt de um lado, e item postado sem postedAt = repost no feed.
export function mergeQueueStates(remoteDoc, localDoc) {
  const rank = (q) => (q.postedAt ? 3 : (q._rateLimitedUntil || q.error) ? 2 : 1);
  const localById = new Map((localDoc.items || []).map((i) => [i.id, i]));
  const seen = new Set();
  const items = [];
  for (const r of remoteDoc.items || []) {
    seen.add(r.id);
    const l = localById.get(r.id);
    items.push(l && rank(l) >= rank(r) ? l : r);
  }
  for (const l of localDoc.items || []) {
    if (!seen.has(l.id)) items.push(l);
  }
  return {
    items,
    postCount: Math.max(remoteDoc.postCount || 0, localDoc.postCount || 0),
  };
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

// Cooldown GLOBAL da run. Diferente do _rateLimitedUntil (que e por item e
// so cobre a cota de content publishing 50/24h), o cooldown global existe pra
// o limite DA APLICACAO no Graph API (code 4 "Application request limit
// reached"), que o pre-check de content_publishing_limit NAO enxerga (ele
// reporta 0/50 mesmo com a app throttled). Quando armado, o proximo cron sai
// cedo SEM rodar deteccao de apagados, gerar slides, dar push, nem tentar
// publicar. Para de martelar a API e de poluir o repo com commits vazios.
// Persistido em arquivo porque cada run do Actions e um checkout limpo.
export async function readCooldown() {
  try {
    const raw = await fs.readFile(COOLDOWN_PATH, "utf8");
    const doc = JSON.parse(raw);
    return { until: doc.until || null, reason: doc.reason || null, code: doc.code ?? null, fbtraceId: doc.fbtraceId || null, setAt: doc.setAt || null };
  } catch {
    return { until: null, reason: null, code: null, fbtraceId: null, setAt: null };
  }
}

// Retorna true se ha cooldown ativo (until no futuro relativo a nowIso).
export function isCoolingDown(cooldown, nowIso) {
  if (!cooldown || !cooldown.until) return false;
  return new Date(cooldown.until).getTime() > new Date(nowIso).getTime();
}

// Arma o cooldown ate now + ms. Grava o motivo/code/fbtrace pra debug e pra
// telegram. Retorna o doc gravado.
export async function setCooldown({ ms, reason = null, code = null, fbtraceId = null } = {}) {
  const now = Date.now();
  const doc = {
    until: new Date(now + ms).toISOString(),
    reason,
    code,
    fbtraceId,
    setAt: new Date(now).toISOString(),
  };
  await fs.writeFile(COOLDOWN_PATH, JSON.stringify(doc, null, 2));
  return doc;
}

// Zera o cooldown (until=null). Chamado quando uma run publica com sucesso,
// pra remover cooldown stale e nao segurar o feed mais que o necessario.
export async function clearCooldown() {
  const doc = { until: null, reason: null, code: null, fbtraceId: null, setAt: new Date().toISOString() };
  await fs.writeFile(COOLDOWN_PATH, JSON.stringify(doc, null, 2));
  return doc;
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
  const mature = queue.items.filter((q) => isMature(q, type, now, denylist));
  return mature.slice(0, limit);
}

// Predicado de maturidade compartilhado por pickMatureByType e
// pickMatureByTypeDiverse: nao postado, do type certo, fora da denylist, sem
// backoff de rate limit ativo, com publishAt no passado, e que nao estourou
// MAX_ERRORS (item envenenado fica de fora ate o housekeeping aposenta-lo).
function isMature(q, type, now, denylist) {
  if (q.postedAt) return false;
  if (q.type !== type) return false;
  if (denylist && isDenied(denylist, q.id)) return false;
  if (q._rateLimitedUntil && new Date(q._rateLimitedUntil).getTime() > now) return false;
  if ((q.errorCount || 0) >= MAX_ERRORS) return false;
  return new Date(q.publishAt).getTime() <= now;
}

// Como pickMatureByType, mas com cap de assunto por carrossel: no maximo
// `topicCap` itens do mesmo cluster de similaridade entram juntos. Evita que
// uma unica saga (ex: "novo baterista") domine um carrossel. A base continua
// FIFO (queue ja vem ordenada por queuedAt em writeQueue); o cap so PULA o
// excedente, que fica na fila pro proximo run (adiado, nao perdido).
//
// opts:
//   limit          tamanho do carrossel (default MAX_PER_CAROUSEL)
//   denylist       denylist pra filtrar apagados
//   signatureFor   (item) => Set|null. Assinatura de topico injetada pelo
//                  caller (mantem queue.mjs sem I/O). Item sem assinatura
//                  (null/vazia) entra sem contar pra nenhum cluster.
//   similarFn      (sigA, sigB) => number. Similaridade entre assinaturas.
//   threshold      corte de cluster (default 0.30)
//   topicCap       max itens do mesmo cluster por carrossel (default 1)
//   onDropped      (item, reason) => void. Loga o adiamento (no silent caps).
export function pickMatureByTypeDiverse(queue, type, nowIso, opts = {}) {
  const {
    limit = MAX_PER_CAROUSEL,
    denylist = null,
    signatureFor = () => null,
    similarFn = () => 0,
    threshold = 0.30,
    topicCap = 1,
    onDropped = () => {},
  } = opts;
  const now = new Date(nowIso).getTime();
  const mature = queue.items.filter((q) => isMature(q, type, now, denylist));

  const picked = [];
  const clusters = []; // [{ sig, count }]
  for (const item of mature) {
    if (picked.length >= limit) break;
    const sig = signatureFor(item);
    if (!sig || sig.size === 0) { picked.push(item); continue; }
    let bucket = null;
    for (const c of clusters) {
      if (similarFn(sig, c.sig) >= threshold) { bucket = c; break; }
    }
    if (bucket) {
      if (bucket.count >= topicCap) { onDropped(item, `topic-cap(${topicCap})`); continue; }
      bucket.count++;
    } else {
      clusters.push({ sig, count: 1 });
    }
    picked.push(item);
  }
  return picked;
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
      q.errorCount = 0;
      delete q._lastAttemptAt;
      delete q._lastAttemptCaption;
    }
  }
}

// Registra que um publish foi TENTADO (caption + instante), antes de saber o
// resultado. Se o run falhar, o run seguinte usa isso pra conferir no IG se o
// post saiu apesar do erro (falso-erro 2207051) ANTES de republicar, cobrindo
// o caso em que nem o poll pos-erro enxergou o post (consistencia eventual do
// GET /media). markPosted limpa os campos.
export function markAttempt(queue, ids, caption, nowIso) {
  const set = new Set(ids);
  for (const q of queue.items) {
    if (set.has(q.id)) {
      q._lastAttemptAt = nowIso;
      q._lastAttemptCaption = caption;
    }
  }
}

export function markError(queue, ids, errMsg, nowIso) {
  const set = new Set(ids);
  for (const q of queue.items) {
    if (set.has(q.id)) {
      q.error = { at: nowIso, msg: String(errMsg).slice(0, 500) };
      // Contador de falhas pra nao retentar pra sempre um item envenenado
      // (ex: imagem que nunca gera slide). pickMature exclui quem passou de
      // MAX_ERRORS. markPosted/markRateLimited zeram (sucesso ou backoff
      // temporal nao contam como falha permanente).
      q.errorCount = (q.errorCount || 0) + 1;
    }
  }
}

// Teto de falhas permanentes antes de aposentar o item (override por env).
export const MAX_ERRORS = Number.isFinite(Number(process.env.IG_MAX_ERRORS))
  && Number(process.env.IG_MAX_ERRORS) > 0
  ? Number(process.env.IG_MAX_ERRORS) : 5;

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

// Expira PENDENTES (nunca postados) velhos demais, pra que apos uma pausa do
// publish (ex: rate limit por dias) o backlog antigo nao drene primeiro e
// atropele o conteudo novo. Notícia datada perde a janela; conteudo evergreen
// (tag memoria) tem prazo bem maior. Espelha pruneOldPosted mas mira o oposto
// (pendentes, nao postados). Retorna os itens REMOVIDOS (pro tombstone), nao a
// contagem, pra o caller registrar o que descartou (no silent caps).
//
// opts:
//   staleDays           prazo padrao em dias (default 4)
//   evergreenDays       prazo pra evergreen (default 30)
//   dateFor             (q) => isoString. Data de referencia (caller injeta
//                       pubDate do index); fallback q.queuedAt.
//   isEvergreen         (q) => bool. True pra conteudo atemporal (tag memoria).
//   denylist            itens na denylist nunca expiram (tombstone perpetuo).
export function pruneStalePending(queue, nowIso, opts = {}) {
  const {
    staleDays = 4,
    evergreenDays = 30,
    dateFor = (q) => q.queuedAt,
    isEvergreen = () => false,
    denylist = null,
  } = opts;
  const nowMs = new Date(nowIso).getTime();
  const removed = [];
  queue.items = queue.items.filter((q) => {
    if (q.postedAt) return true;                                  // postado: pruneOldPosted cuida
    if (denylist && isDenied(denylist, q.id)) return true;        // tombstone perpetuo fica
    const days = isEvergreen(q) ? evergreenDays : staleDays;
    const cutoff = nowMs - days * 24 * 60 * 60 * 1000;
    const ref = new Date(dateFor(q) || q.queuedAt).getTime();
    if (Number.isFinite(ref) && ref < cutoff) { removed.push(q); return false; }
    return true;
  });
  return removed;
}
