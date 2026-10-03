// Entrada na fila (enqueue) e escolha dos itens maduros por tipo, com diversidade de assunto.
import { PUBLISH_DELAY_MS, MAX_PER_CAROUSEL, MAX_ERRORS } from "./io.mjs";
import { isDenied } from "./denylist.mjs";

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
