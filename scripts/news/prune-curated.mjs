// Conserto do acumulo do _pending.json (investigacao 2026-06-01).
//
// Bug: o merge-curated remove do _pending so os APROVADOS; os itens que a
// curadoria SKIP (descarte editorial) nunca saiam, acumulavam (16+ dias) e eram
// re-curados toda rodada. O proprio fetch-news ja documentava a intencao
// ("marca seen depois que a routine commitar"), mas o passo nunca existiu.
//
// Solucao: os logs de rodada (_curation-log/<TS>.json) registram TODOS os itens
// julgados (approved + skipped). Este modulo le esses logs e, pra cada item do
// _pending que ja foi julgado:
//   - remove do _pending,
//   - marca seen[id] = { curationSkip } pra os scrapers nao re-adicionarem
//     (fetch-news e community-fetch deduplicam por seen[id]).
//
// Permanente de proposito: enquanto o log do veredito existir, ele vale. Um
// item SKIP por "texto vazio" so reentra se vier com id diferente (outra URL).
// TTL nao compoe com isso (o log e re-lido toda rodada), entao nao se aplica.
import fs from "node:fs/promises";
import path from "node:path";

const NEWS_DIR = path.resolve("media/news");
export const CURATION_LOG_DIR = path.join(NEWS_DIR, "_curation-log");

// Junta todos os ids ja julgados (approved + skipped) de todos os logs de rodada.
export async function collectJudgedIds(dir = CURATION_LOG_DIR) {
  const ids = new Set();
  let files = [];
  try { files = await fs.readdir(dir); } catch { return ids; }
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    let doc;
    try { doc = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")); } catch { continue; }
    for (const a of doc.approved || []) if (a && a.id) ids.add(a.id);
    for (const s of doc.skipped || []) if (s && s.id) ids.add(s.id);
  }
  return ids;
}

// Remove do pending os itens ja julgados e marca seen. MUTA `seen`. Retorna
// { kept, removedIds }. Nao sobrescreve seen[id] que ja indique publicacao
// (firstSeen) nem erro ja registrado (preserva o historico desses).
export function prunePendingItems(pendingItems, seen, judgedIds, nowMs = Date.now()) {
  const kept = [];
  const removedIds = [];
  for (const p of pendingItems || []) {
    if (p && p.id && judgedIds.has(p.id)) {
      removedIds.push(p.id);
      const prev = seen[p.id];
      if (!prev || (!prev.firstSeen && !prev.error)) {
        seen[p.id] = { curationSkip: true, ts: nowMs, title: p.title_orig || p.title_pt || p.id };
      }
    } else {
      kept.push(p);
    }
  }
  return { kept, removedIds };
}

// Conveniencia: le os logs e poda em uma chamada. Retorna { kept, removedIds }.
export async function prunePendingByLogs(pendingItems, seen, dir = CURATION_LOG_DIR, nowMs = Date.now()) {
  const judged = await collectJudgedIds(dir);
  return prunePendingItems(pendingItems, seen, judged, nowMs);
}
