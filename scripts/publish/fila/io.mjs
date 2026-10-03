// Leitura, gravação e mesclagem da fila de publicação (_publish-queue.json) e limites comuns.
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";

const QUEUE_PATH = naRaiz("media/news/_publish-queue.json");
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


// Teto de falhas permanentes antes de aposentar o item (override por env).
export const MAX_ERRORS = Number.isFinite(Number(process.env.IG_MAX_ERRORS))
  && Number(process.env.IG_MAX_ERRORS) > 0
  ? Number(process.env.IG_MAX_ERRORS) : 5;
