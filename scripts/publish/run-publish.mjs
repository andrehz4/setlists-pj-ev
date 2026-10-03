// Orquestrador da publicação do feed (carrossel/single) no Instagram e no Facebook.
// Workflow publish-instagram.yml, disparado pelo TriggerAll. As etapas vivem em scripts/publish/feed/:
//   1. lê fila, denylist e index; expira pendentes velhos (sempre, mesmo se a run sair cedo)
//   2. guardas: cooldown global e quota (saem cedo sem tocar a API)
//   3. manutenção: páginas de notícia, comandos do bot, detecção de posts apagados
//   4. lotes (regular, spotlight): slides + capa, commit, publish IG + FB, marca a fila na hora
//   5. cooldown, poda, alerta de feed parado, commit final do estado e aviso no Telegram
//
// Flags: --dry-run (gera slides, não publica nem commita) · --no-git · --max-batches=N (padrão 2)
// Env: IG_USER_ID, IG_ACCESS_TOKEN (obrigatórios pra publicar), GIT_AUTHOR_NAME/EMAIL.
import { readQueue, writeQueue, pruneOldPosted, pruneStalePending, readDenylist } from "./queue.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { writeStepSummary } from "../news/_summary.mjs";
import { commitAndPush as commitAndPushGit } from "../lib/git.mjs";
import { INDEX_PATH, STATE_PATHS, STALE_DAYS, STALE_DAYS_EVERGREEN, POSTS_PER_COLOR, getCurrentTarjaColor } from "./feed/config.mjs";
import { lerIndex, recordStaleTombstone } from "./feed/itens.mjs";
import { rodarLotes } from "./feed/lote.mjs";
import { notifyTelegram } from "./feed/avisos.mjs";
import { guardaCooldown, guardaQuota, atualizarCooldown } from "./feed/guardas.mjs";
import { gerarPaginasNoticia, comandosTelegram, detectarApagados, podarMidia, alertaFeedParado } from "./feed/manutencao.mjs";
import { criarReconciliador } from "./feed/reconciliar.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const MAX_BATCHES_ARG = args.find((a) => a.startsWith("--max-batches="));
const MAX_BATCHES = MAX_BATCHES_ARG ? parseInt(MAX_BATCHES_ARG.split("=")[1], 10) : 2;
const commitAndPush = (paths, message, opts = {}) => commitAndPushGit(paths, message, { dry: NO_GIT || DRY, ...opts });
const resumo = (nowIso, extra) => writeStepSummary({
  title: "Publish Instagram",
  meta: { dry: DRY, "max-batches": MAX_BATCHES, run: nowIso.slice(0, 16) + "Z" },
  ...extra,
});

async function main() {
  const nowIso = new Date().toISOString();
  console.log(`[publish] run em ${nowIso} | dry=${DRY} no-git=${NO_GIT} max-batches=${MAX_BATCHES}`);
  if (!DRY && (!process.env.IG_USER_ID || !process.env.IG_ACCESS_TOKEN)) {
    console.error("IG_USER_ID e IG_ACCESS_TOKEN obrigatorios (env)");
    process.exit(2);
  }

  // 1. Estado lido CEDO, antes das guardas, pra a expiração de pendentes velhos rodar sempre
  //    (antes, notícia datada velha ficava presa no topo do FIFO quando a run saía por cooldown).
  const queue = await readQueue();
  const denylist = await readDenylist();
  const indexDoc = await lerIndex(INDEX_PATH);
  const indexById = new Map((indexDoc.items || []).map((x) => [x.id, x]));
  const reconcile = criarReconciliador(queue);
  const ctx = { dry: DRY, commitAndPush, reconcile };

  const staleRemoved = pruneStalePending(queue, nowIso, {
    staleDays: STALE_DAYS,
    evergreenDays: STALE_DAYS_EVERGREEN,
    dateFor: (q) => indexById.get(q.id)?.pubDate || q.queuedAt,
    isEvergreen: (q) => (indexById.get(q.id)?.tags || []).includes("memoria"),
    denylist,
  });
  if (staleRemoved.length > 0) {
    await recordStaleTombstone(staleRemoved, indexById, nowIso);
    console.log(`[publish] stale: ${staleRemoved.length} pendente(s) expirado(s): ${staleRemoved.map((q) => q.id).join(", ")}`);
  }

  // 2. Guardas. Saindo cedo, ainda grava a fila limpa (sem tocar _ig-cooldown.json).
  if (!DRY) {
    const parada = (await guardaCooldown(nowIso)) || (await guardaQuota());
    if (parada) {
      console.warn(`[publish] ${parada.msg}`);
      await resumo(nowIso, { stats: { batches: 0, publicados: 0, falhas: 0 }, extras: [{ heading: parada.titulo, body: parada.msg }] });
      if (staleRemoved.length > 0) {
        await writeQueue(queue);
        await commitAndPush(
          ["media/news/_publish-queue.json", "media/news/_skipped-stale.json"],
          `publish-ig: expira ${staleRemoved.length} stale (housekeeping) ${nowIso.slice(0, 16)}Z`,
          { onRebaseConflict: reconcile },
        );
      }
      process.exitCode = 0; // backoff intencional, não é erro de pipeline
      return;
    }
  }

  // 3. Manutenção antes de publicar.
  if (!DRY) {
    await gerarPaginasNoticia(nowIso, ctx);
    await comandosTelegram();
    await detectarApagados(queue, denylist, nowIso);
  }
  console.log(`[publish] queue: ${queue.items.length} items totais, ${queue.items.filter((q) => !q.postedAt).length} pendentes, postCount=${queue.postCount}, denylist=${denylist.deleted.length}`);

  // 4. Lotes. Cor da tarja e do ciclo trocam a cada POSTS_PER_COLOR posts publicados.
  const tarjaColor = getCurrentTarjaColor(queue.postCount);
  const cycleColor = getCurrentCycleColor(queue.postCount);
  console.log(`[publish] cor: tarja=${tarjaColor} ciclo=${cycleColor} (a cada ${POSTS_PER_COLOR} posts)`);
  const results = await rodarLotes({ queue, indexById, nowIso, tarjaColor, cycleColor, denylist, ctx, maxBatches: MAX_BATCHES });

  // 5. Fechamento.
  if (!DRY) await atualizarCooldown(results);
  // Poda de postados antigos (a denylist preserva os banidos pra sempre).
  const pruned = pruneOldPosted(queue, nowIso, 30, denylist);
  if (pruned > 0) console.log(`[publish] prune: ${pruned} postados antigos removidos`);
  if (!DRY) {
    await podarMidia(queue);
    await alertaFeedParado(queue, nowIso);
  }
  await writeQueue(queue);
  // Fila + denylist + cursor do bot juntos (o próximo cron já vê os /ban); as pastas de slides e
  // stories entram pra levar as deleções da poda.
  await commitAndPush(
    [...STATE_PATHS, "media/news/instagram-slides/", "media/news/instagram-stories/"],
    `publish-ig: atualiza fila (${results.map((r) => `${r.type}:${r.succeeded}/${r.attempted}`).join(" ")}) ${nowIso.slice(0, 16)}Z`,
    { onRebaseConflict: reconcile },
  );
  if (!DRY) await notifyTelegram(results);
  await escreverResumo(results, nowIso);
  if (results.length > 0 && results.every((r) => r.succeeded === 0 && r.error)) {
    console.error("[publish] todos os batches falharam, sinalizando erro pro workflow");
    process.exitCode = 1;
  }
  console.log(`[publish] FIM`, results);
}

async function escreverResumo(results, nowIso) {
  const publicados = results.filter((r) => r.succeeded > 0 && r.items);
  const falhas = results.filter((r) => r.succeeded === 0 && r.error);
  const itens = publicados.flatMap((r) =>
    r.items.map((it) => ({ ...it, sourceLabel: r.type === "spotlight" ? "Spotlight da comunidade" : "Noticia regular" })));
  await resumo(nowIso, {
    stats: { batches: results.length, publicados: publicados.reduce((s, r) => s + r.succeeded, 0), falhas: falhas.length },
    curated: itens.length > 0 ? itens : undefined,
    extras: [
      ...(results.length === 0 ? [{ heading: "Resultado", body: "Fila vazia, nenhum item maduro." }] : []),
      ...falhas.map((r) => ({ heading: `Falha (${r.type})`, body: `\`${r.error}\`` })),
    ],
  });
}

main().catch((e) => {
  console.error("[publish] FATAL:", e);
  process.exit(1);
});
