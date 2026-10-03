// Itens da fila do feed: hidratação (index + items/<id>.json + archive) e tombstone dos expirados.
import fs from "node:fs/promises";
import path from "node:path";
import { lerEstado } from "../../lib/estado.mjs";
import { ARCHIVE_DIR, ITEMS_DIR, STALE_TOMBSTONE_PATH } from "./config.mjs";

// Lê o index.json. Ausente = vazio; corrompido ou sem .items[] = derruba a run: com index vazio,
// todo item maduro cairia em "não achado" e seria marcado como erro permanente.
export async function lerIndex(indexPath) {
  try {
    return await lerEstado(indexPath, { items: [] }, {
      valida: (d) => (d && Array.isArray(d.items) ? null : "sem .items[]"),
    });
  } catch (e) {
    throw new Error(`index.json ilegivel (${e.message}). Abortando pra nao marcar erro em itens validos.`);
  }
}

// Tombstone dos pendentes expirados por idade (no silent caps). Audit-only:
// o conteúdo segue vivo no index/archive do site, sair da fila só significa
// "perdeu a janela de publicação no IG". Idempotente por id, podado em 60d.
export async function recordStaleTombstone(removed, indexById, nowIso) {
  const STALE_TOMBSTONE_TTL_DAYS = 60;
  let doc = await lerEstado(STALE_TOMBSTONE_PATH, { stale: [], updatedAt: null });
  if (!Array.isArray(doc.stale)) doc = { stale: [], updatedAt: null };
  const cutoff = new Date(nowIso).getTime() - STALE_TOMBSTONE_TTL_DAYS * 24 * 60 * 60 * 1000;
  doc.stale = doc.stale.filter((s) => {
    const t = new Date(s.prunedAt || 0).getTime();
    return !Number.isFinite(t) || t >= cutoff;
  });
  const existing = new Set(doc.stale.map((s) => s.id));
  for (const q of removed) {
    if (existing.has(q.id)) continue;
    const idx = indexById.get(q.id);
    doc.stale.push({
      id: q.id,
      type: q.type,
      title_pt: idx?.title_pt || "",
      pubDate: idx?.pubDate || null,
      queuedAt: q.queuedAt || null,
      prunedAt: nowIso,
    });
  }
  doc.updatedAt = nowIso;
  await fs.writeFile(STALE_TOMBSTONE_PATH, JSON.stringify(doc, null, 2));
}

export async function hydrateItem(qEntry, indexById) {
  const idx = indexById.get(qEntry.id);
  if (!idx) return null;
  let body = "";
  try {
    const raw = await fs.readFile(path.join(ITEMS_DIR, `${qEntry.id}.json`), "utf8");
    body = JSON.parse(raw).body_pt || "";
  } catch (e) {
    if (e.code !== "ENOENT") console.warn(`[publish] items/${qEntry.id}.json ilegível, seguindo sem corpo: ${e.message}`);
  }
  return { ...idx, body_pt: body };
}

// Itens podem ter saído do index pro archive entre o enqueue e o publish: olha os archives mês a mês.
export async function findInArchive(id) {
  try {
    const months = await fs.readdir(ARCHIVE_DIR);
    for (const f of months) {
      if (!f.endsWith(".json")) continue;
      const doc = await lerEstado(path.join(ARCHIVE_DIR, f), { items: [] });
      const it = (doc.items || []).find((x) => x.id === id);
      if (it) return it;
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.warn(`[publish] archive ilegível ao procurar ${id}: ${e.message}`);
  }
  return null;
}
