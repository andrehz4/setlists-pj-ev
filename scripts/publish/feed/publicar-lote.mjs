// Publica um lote já com slides prontos: registra a tentativa, chama a API do IG, espelha no Facebook
// (best-effort) e marca a fila (postado, rate limit ou erro).
import { writeQueue, markPosted, markError, markRateLimited, markAttempt } from "../queue.mjs";
import { publishItems, buildCarouselCaption } from "../instagram.mjs";
import { publishFeedAlbum } from "../facebook.mjs";
import { estimateUnsaturationDelayMs } from "../ig-quota.mjs";

const detalhe = (e) => (typeof e.toDetailString === "function" ? e.toDetailString() : e.message);

export async function publicarLote({ type, itemsToPost, coverImageUrl, slideSuffix, queue, nowIso, ctx }) {
  // Antes do publish, registra a tentativa (caption + instante) na fila: se o publish falhar E o
  // post sair mesmo assim (falso-erro 2207051), a guarda cross-run do próximo run acha o post por
  // essa caption e não republica. buildCarouselCaption delega pra single quando há 1 item.
  markAttempt(queue, itemsToPost.map((it) => it.id), buildCarouselCaption(itemsToPost), nowIso);
  // Persiste a caption da tentativa (via git) ANTES do publish. Se a run morrer DURANTE o
  // publishItems (timeout do runner, SIGKILL) depois do post já ter saído, markPosted nunca roda;
  // sem esta gravação prévia o próximo cron re-posta. Falha aqui não derruba a run.
  try {
    await writeQueue(queue);
    await ctx.commitAndPush(
      ["media/news/_publish-queue.json"],
      `publish-ig: registra tentativa ${type} (${itemsToPost.length} item/s) ${nowIso.slice(0, 16)}Z`,
      { onRebaseConflict: ctx.reconcile },
    );
  } catch (e) {
    console.warn(`[publish] pre-commit da tentativa falhou (segue pro publish): ${e.message}`);
  }
  try {
    const r = await publishItems(itemsToPost, { coverImageUrl, slideSuffix });
    if (r.recovered) {
      console.warn(`[publish] RECUPERADO tipo=${type}: media_publish deu erro mas o post saiu (postId=${r.postId}). Marcando como postado pra NAO re-postar.`);
    }
    console.log(`[publish] OK tipo=${type} postId=${r.postId} count=${r.count}`);
    markPosted(queue, itemsToPost.map((it) => it.id), r.postId, new Date().toISOString());
    const fbPostId = await espelharNoFacebook({ type, itemsToPost, coverImageUrl, slideSuffix });
    return {
      type,
      attempted: itemsToPost.length,
      succeeded: itemsToPost.length,
      postId: r.postId,
      fbPostId,
      items: itemsToPost.map((it) => ({ id: it.id, title_pt: it.title_pt, tags: it.tags || [] })),
    };
  } catch (e) {
    const detail = detalhe(e); // IGAPIError/IGRateLimitError expõem code/subcode/fbtrace
    const nowIso2 = new Date().toISOString();
    console.error(`[publish] FALHA tipo=${type}: ${detail}`);
    if (e.isRateLimit) {
      // Backoff temporal: não tenta de novo enquanto a janela rolling de 24h não liberar.
      const untilIso = new Date(Date.now() + estimateUnsaturationDelayMs()).toISOString();
      markRateLimited(queue, itemsToPost.map((it) => it.id), untilIso, nowIso2);
      console.warn(`[publish] rate-limited ate ${untilIso}, items ${itemsToPost.map((it) => it.id).join(", ")} em backoff`);
    } else {
      markError(queue, itemsToPost.map((it) => it.id), detail, nowIso2);
    }
    return {
      type,
      attempted: itemsToPost.length,
      succeeded: 0,
      error: detail,
      errorCode: e.code,
      errorSubcode: e.subcode,
      fbtraceId: e.fbtraceId,
      isRateLimit: !!e.isRateLimit,
    };
  }
}

// Facebook Pages (mesmo conteúdo, álbum de fotos). BEST-EFFORT: o IG já publicou e marcou postado;
// falha no FB só loga, não derruba a run nem devolve o item pra fila (senão o IG duplicaria).
// Só liga com PUBLISH_FB=1 + secrets presentes.
async function espelharNoFacebook({ type, itemsToPost, coverImageUrl, slideSuffix }) {
  if (process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN) {
    try {
      const fb = await publishFeedAlbum(itemsToPost, { coverImageUrl, slideSuffix });
      console.log(`[publish] FB OK tipo=${type} fbPostId=${fb.postId} count=${fb.count}`);
      return fb.postId;
    } catch (e) {
      console.error(`[publish] FB FALHA tipo=${type} (IG ja publicou, seguindo): ${detalhe(e)}`);
    }
  } else if (process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN) {
    console.log(`[publish] FB desligado (PUBLISH_FB!=1); IG publicado normalmente`);
  }
  return null;
}
