// Marcações na fila (postado, tentativa, erro, rate limit) e faxina de postados e pendentes velhos.
import { MAX_ERRORS } from "./io.mjs";
import { isDenied } from "./denylist.mjs";

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
