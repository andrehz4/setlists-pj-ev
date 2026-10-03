// Tarefas de manutenção do publish do feed. Todas são best-effort: falha vira aviso e a run segue.
import fs from "node:fs/promises";
import { writeDenylist, addToDenylist } from "../queue.mjs";
import { detectDeletedPosts } from "../ig-detect-deleted.mjs";
import { pollTelegramCommands } from "../telegram-bot.mjs";
import { buildNewsStubs } from "../../news/build-news-stubs.mjs";
import { pruneOldMedia } from "../prune-media.mjs";
import { lerEstado } from "../../lib/estado.mjs";
import { DETECT_INTERVAL_H, DETECT_STAMP_PATH, HEALTH_STAMP_PATH, STALL_H } from "./config.mjs";
import { avisar } from "./avisos.mjs";

// Páginas de notícia (n/<id>.html + sitemap) ANTES de publicar, pra os links /n/<id> do Telegram e
// do IG já abrirem o artigo com preview social certo. Idempotente; 0 escritos = sem commit.
export async function gerarPaginasNoticia(nowIso, ctx) {
  try {
    const wrote = await buildNewsStubs();
    if (wrote > 0) {
      await ctx.commitAndPush(["n/", "noticias/", "sitemap.xml"], `publish-ig: gera ${wrote} pagina(s) de noticia (n/ + noticias/ + sitemap) ${nowIso.slice(0, 16)}Z`);
      console.log(`[publish] stubs de noticia: ${wrote} gerado(s)`);
    }
  } catch (e) {
    console.warn(`[publish] stubs de noticia falharam (segue sem): ${e.message}`);
  }
}

// Comandos do bot (/ban /unban /denylist /status) mandados desde o último cron. Roda antes da
// detecção automática, então ban manual pelo celular vale já neste cron.
export async function comandosTelegram() {
  try {
    const r = await pollTelegramCommands();
    if (r.processed > 0) console.log(`[publish] telegram bot: ${r.processed} comando(s) processado(s)`);
  } catch (e) {
    console.warn(`[publish] telegram bot polling falhou (segue): ${e.message}`);
  }
}

// Posts apagados no app do IG (GET /<postId> dá 404) entram na denylist perpétua. Era o maior ofensor
// de volume de chamadas (~5-33 GETs), então roda só 1x a cada DETECT_INTERVAL_H horas.
export async function detectarApagados(queue, denylist, nowIso) {
  const stamp = await lerEstado(DETECT_STAMP_PATH, { lastAt: null });
  const lastMs = stamp.lastAt ? new Date(stamp.lastAt).getTime() : 0;
  const dueMs = DETECT_INTERVAL_H * 60 * 60 * 1000;
  if (Date.now() - lastMs < dueMs) {
    const hLeft = ((dueMs - (Date.now() - lastMs)) / 3600000).toFixed(1);
    console.log(`[publish] deteccao de apagados: pulada (proxima em ~${hLeft}h, intervalo ${DETECT_INTERVAL_H}h)`);
    return;
  }
  let rodou = false;
  try {
    const det = await detectDeletedPosts({ queue, lookbackDays: 30 });
    rodou = true;
    const novos = det.deletedItems.filter((di) =>
      addToDenylist(denylist, { itemId: di.itemId, postId: di.postId, reason: "auto-detected (404 no IG)" }));
    if (novos.length > 0) {
      await writeDenylist(denylist);
      console.log(`[publish] denylist: +${novos.length} item(s) auto-detectados como apagados (${det.deletedItems.map((d) => d.itemId).join(", ")})`);
      await avisar([
        "🗑 <b>Posts apagados detectados no IG</b>",
        "",
        `${novos.length} item(s) banido(s) permanentemente:`,
        ...det.deletedItems.slice(0, 10).map((d) => `<code>${d.itemId}</code> (postId ${d.postId})`),
      ].join("\n"));
    }
    console.log(`[publish] deteccao de apagados: ${det.checked} posts checados (${det.cachedSkipped ?? 0} pulados via cache de ${det.total ?? det.checked}), ${det.deletedItems.length} apagados, ${det.indeterminate} indeterminados`);
  } catch (e) {
    console.warn(`[publish] auto-deteccao de apagados falhou (segue): ${e.message}`);
  }
  // marca o horário se a API respondeu (mesmo que o resto falhe): não re-checa a cada run
  if (rodou) await fs.writeFile(DETECT_STAMP_PATH, JSON.stringify({ lastAt: nowIso }, null, 2));
}

// Poda de binários IG-only (slides/stories publicados há >14d). As deleções entram no commit final.
export async function podarMidia(queue) {
  try {
    const pm = await pruneOldMedia(queue);
    if (pm.slides + pm.stories + (pm.reels || 0) > 0) {
      console.log(`[publish] prune media: ${pm.slides} slide(s), ${pm.stories} storie(s) e ${pm.reels || 0} reel(s) antigos apagados`);
    }
  } catch (e) {
    console.warn(`[publish] prune media falhou (segue): ${e.message}`);
  }
}

// Feed parado: cron verde e 0 publicados por dias passava despercebido (coleta morta, cooldown em
// loop, fila drenada). Alerta no máximo 1x/24h (stamp em _health-stamp.json).
export async function alertaFeedParado(queue, nowIso) {
  const lastPostedMs = queue.items.reduce((max, q) => {
    const t = q.postedAt ? new Date(q.postedAt).getTime() : 0;
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);
  const stalledMs = Date.now() - lastPostedMs;
  if (lastPostedMs === 0 || stalledMs <= STALL_H * 3600 * 1000) return;
  const stamp = await lerEstado(HEALTH_STAMP_PATH, { lastAlertAt: null });
  const lastAlertMs = stamp.lastAlertAt ? new Date(stamp.lastAlertAt).getTime() : 0;
  if (Date.now() - lastAlertMs <= 24 * 3600 * 1000) return;
  const hStalled = Math.round(stalledMs / 3600000);
  console.warn(`[publish] FEED PARADO: ultimo post ha ${hStalled}h (limite ${STALL_H}h)`);
  await avisar([
    `⚠️ <b>Feed parado ha ${hStalled}h</b>`,
    "",
    `Nenhum post no @smufdpj desde ${new Date(lastPostedMs).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} BRT.`,
    `Pendentes na fila agora: ${queue.items.filter((q) => !q.postedAt).length}.`,
    "Cheque: coleta (news.yml), curadoria (routine), cooldown (_ig-cooldown.json).",
  ].join("\n"));
  await fs.writeFile(HEALTH_STAMP_PATH, JSON.stringify({ lastAlertAt: nowIso }, null, 2));
}
