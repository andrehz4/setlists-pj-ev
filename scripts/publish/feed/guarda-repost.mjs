// Guarda cross-run contra repost. Item maduro com tentativa anterior registrada (markAttempt) pode
// JÁ estar publicado, se a run anterior caiu no falso-erro 2207051 e nem o poll pós-erro enxergou o
// post. Antes de republicar, confere as mídias recentes do IG com a caption da tentativa.
// Achou: marca como postado e tira do lote. 1 GET por caption pendente, só quando há tentativa falha.
// Trade-off aceito: o match é por prefixo de caption (>=60 chars). Se o lote retentado mudou de
// composição e o líder coincide com um post legítimo posterior, um item pode ser marcado sem ter
// saído. Perder 1 item raro custa menos que duplicar no feed.
import { markPosted } from "../queue.mjs";
import { recoverPublishedPost } from "../instagram.mjs";

// Tira de `mature` (in place) o que já está no IG. Se sobrar nada, devolve o resultado do lote
// como sucesso recuperado (conta no postCount e notifica); senão devolve null e o lote segue.
export async function recuperarTentativasAnteriores({ type, mature, queue, indexById, nowIso }) {
  const byCaption = new Map();
  for (const q of mature.filter((m) => m._lastAttemptCaption)) {
    if (!byCaption.has(q._lastAttemptCaption)) byCaption.set(q._lastAttemptCaption, []);
    byCaption.get(q._lastAttemptCaption).push(q);
  }
  const recoveredItems = [];
  let recoveredPostId = null;
  for (const [caption, group] of byCaption) {
    const sinceMs = Math.min(...group.map((q) => {
      const t = new Date(q._lastAttemptAt || 0).getTime();
      return Number.isFinite(t) && t > 0 ? t : Date.now();
    }));
    const found = await recoverPublishedPost({ caption, sinceMs, attempts: 1 });
    if (!found) continue;
    console.warn(`[publish] guarda cross-run: tentativa anterior de ${group.map((q) => q.id).join(", ")} JA esta no IG (postId=${found}). Marcando como postado SEM republicar.`);
    markPosted(queue, group.map((q) => q.id), found, nowIso);
    recoveredPostId = found;
    for (const q of group) {
      recoveredItems.push(q);
      const i = mature.indexOf(q);
      if (i >= 0) mature.splice(i, 1);
    }
  }
  if (mature.length > 0) return null;
  return {
    type,
    attempted: recoveredItems.length,
    succeeded: recoveredItems.length,
    postId: recoveredPostId,
    recoveredCrossRun: true,
    items: recoveredItems.map((q) => {
      const idx = indexById.get(q.id);
      return { id: q.id, title_pt: idx?.title_pt || "(recuperado de tentativa anterior)", tags: idx?.tags || [] };
    }),
  };
}
