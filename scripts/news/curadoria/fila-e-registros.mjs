// Depois da triagem: enfileira os aceitos pro Instagram (barrando parecidos e banidos) e registra os
// recusados no tombstone de auditoria.
import fs from "node:fs/promises";
import path from "node:path";
import { readQueue, writeQueue, enqueue, readDenylist } from "../../publish/queue.mjs";
import { checkSimilarInHistory, recordSkipped, DEFAULT_HISTORY_DAYS, DEFAULT_THRESHOLD } from "../dedupe-history.mjs";
import { lerEstado } from "../../lib/estado.mjs";
import { NEWS_DIR } from "../../config.mjs";

const REJECTED_PATH = path.join(NEWS_DIR, "_rejected-curated.json");

// Falha aqui não bloqueia o merge (o item já está no site); vira aviso. Parecido (Jaccard >= 0.30 com
// post dos últimos 7 dias ou pendente na fila) vai pro _skipped-similar.json; banido fica de fora.
export async function enfileirarNoInstagram(newItems, indexItems, warnings) {
  try {
    const queue = await readQueue();
    const denylist = await readDenylist();
    // indexById hidrata título/intro dos antigos sem ler dezenas de items/<id>.json
    const indexById = new Map(indexItems.map((x) => [x.id, x]));
    const { allowed, blocked } = await checkSimilarInHistory(newItems,
      { queue, indexById, historyDays: DEFAULT_HISTORY_DAYS, threshold: DEFAULT_THRESHOLD });
    if (blocked.length) {
      const gravados = await recordSkipped(blocked);
      for (const b of blocked) console.log(`[merge] SIMILAR (skip): ${b.candidate.id} ~ ${b.matchedTo} sim=${b.similarity}`);
      warnings.push(`${blocked.length} item(s) bloqueado(s) por similaridade >= ${DEFAULT_THRESHOLD} com posts recentes`);
      if (gravados > 0) console.log(`[merge] _skipped-similar.json: +${gravados} entrada(s)`);
    }
    const added = enqueue(queue, allowed, Date.now(), denylist);
    if (added.length) {
      await writeQueue(queue);
      console.log(`[merge] enfileirado pra IG: ${added.length} (publishAt = now, sem delay)`);
    }
    const banidos = added.blocked || [];
    if (banidos.length) {
      console.log(`[merge] BLOQUEADOS pela denylist (apagados anteriormente no IG): ${banidos.join(", ")}`);
      warnings.push(`${banidos.length} item(s) bloqueado(s) pela denylist do IG: ${banidos.join(", ")}`);
    }
  } catch (e) {
    console.warn(`[merge] falha ao enfileirar IG (segue mesmo assim): ${e.message}`);
    warnings.push(`Fila IG nao atualizada: ${e.message}`);
  }
}

// Tombstone dos recusados (por que um item curado não entrou). Podado em 30 dias. Chave id+motivo, exceto
// trava de acento: o mesmo item recusado de novo pela trava entra de novo (e o Telegram avisa de novo).
export async function registrarRecusados(rejected) {
  if (rejected.length === 0) return;
  const ttl = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let doc = await lerEstado(REJECTED_PATH, { rejected: [], updatedAt: null });
  if (!Array.isArray(doc.rejected)) doc = { rejected: [], updatedAt: null };
  doc.rejected = doc.rejected.filter((r) => {
    const t = new Date(r.at || 0).getTime();
    return !Number.isFinite(t) || t >= ttl;
  });
  const chave = (r) => `${r.id}|${r.reason}`;
  const vistos = new Set(doc.rejected.filter((r) => !String(r.reason).startsWith("trava")).map(chave));
  for (const r of rejected) if (!r.id || !vistos.has(chave(r))) doc.rejected.push(r);
  doc.updatedAt = new Date().toISOString();
  await fs.writeFile(REJECTED_PATH, JSON.stringify(doc, null, 2));
  console.log(`[merge] _rejected-curated.json: +${rejected.length} registrado(s)`);
}
