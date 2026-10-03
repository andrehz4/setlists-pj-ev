// Um lote do feed (regular ou spotlight): escolhe os maduros, hidrata, gera slides e capa,
// commita os slides (o IG baixa pelo raw do GitHub) e publica.
import { topicSignature, similarity } from "../../news/dedupe-history.mjs";
import { pickMatureByTypeDiverse, markError, writeQueue } from "../queue.mjs";
import { buildSlides, buildCoverSlide, LAYOUT } from "../slide-image.mjs";
import { slideUrlFor } from "../instagram.mjs";
import { TOPIC_CAP } from "./config.mjs";
import { hydrateItem, findInArchive } from "./itens.mjs";
import { recuperarTentativasAnteriores } from "./guarda-repost.mjs";
import { publicarLote } from "./publicar-lote.mjs";

// ctx = { dry, commitAndPush, reconcile }
export async function processBatch(type, queue, indexById, nowIso, tarjaColor, cycleColor, denylist, ctx) {
  // No layout card02 o carrossel abre com a capa (Card 11) do item líder, que substitui o slide
  // dele. Limite do IG = 10 slides = 10 itens.
  const mature = escolherMaduros(type, queue, indexById, nowIso, denylist);
  if (mature.length === 0) {
    console.log(`[publish] tipo=${type}: 0 maduros, skip`);
    return null;
  }
  console.log(`[publish] tipo=${type}: ${mature.length} maduros`);

  if (!ctx.dry) {
    const recuperado = await recuperarTentativasAnteriores({ type, mature, queue, indexById, nowIso });
    if (recuperado) return recuperado; // lote inteiro já estava publicado
  }

  const hydrated = await hidratar(mature, indexById, tarjaColor, cycleColor);
  if (hydrated.length === 0) {
    markError(queue, mature.map((m) => m.id), "item nao encontrado em index/archive", nowIso);
    return { type, attempted: mature.length, succeeded: 0 };
  }

  // 1. slides
  const slides = await buildSlides(hydrated);
  console.log(`[publish] slides gerados: ${slides.length} (${slides.filter((s) => s.reused).length} reuso de cache)`);
  if (slides.length === 0) {
    markError(queue, hydrated.map((h) => h.id), "falha ao gerar slides", nowIso);
    return { type, attempted: hydrated.length, succeeded: 0 };
  }

  // 2. itens com slide; item sem slide = falha no buildSlide, marca erro pra não voltar ao topo da fila
  const itemsToPost = hydrated.filter((h) => slides.find((s) => s.id === h.id));
  const failedSlide = hydrated.filter((h) => !slides.find((s) => s.id === h.id));
  if (failedSlide.length) {
    console.warn(`[publish] ${failedSlide.length} item(s) sem slide, marcando erro: ${failedSlide.map((h) => h.id).join(", ")}`);
    markError(queue, failedSlide.map((h) => h.id), "falha ao gerar slide", nowIso);
  }
  // capa ANTES do push, pra ir no mesmo commit dos slides (raw URL precisa existir antes do publish)
  const coverImageUrl = await gerarCapa(type, itemsToPost, cycleColor);

  // 3. commit + push dos slides (inclui a capa) e espera o raw do GitHub servir
  await ctx.commitAndPush(
    ["media/news/instagram-slides/"],
    `publish-ig: gera slides ${type} (${slides.length}${coverImageUrl ? "+capa" : ""}) ${nowIso.slice(0, 16)}Z`,
  );
  if (ctx.dry) {
    console.log(`[publish] DRY: slides prontos${coverImageUrl ? " (com capa)" : ""}, pulando chamada IG`);
    return { type, attempted: hydrated.length, succeeded: 0, dry: true };
  }
  await new Promise((r) => setTimeout(r, 5000));

  // 4. publica
  const slideSuffix = LAYOUT === "card02" ? ".card02" : "";
  return publicarLote({ type, itemsToPost, coverImageUrl, slideSuffix, queue, nowIso, ctx });
}

function escolherMaduros(type, queue, indexById, nowIso, denylist) {
  // Assinatura de tópico de cada item, pra diversidade por assunto no carrossel.
  const sigCache = new Map();
  const signatureFor = (q) => {
    if (sigCache.has(q.id)) return sigCache.get(q.id);
    const idx = indexById.get(q.id);
    const text = idx ? `${idx.title_pt || idx.titulo_pt || ""} ${idx.intro_pt || ""}`.trim() : "";
    const sig = text ? topicSignature(text) : null;
    sigCache.set(q.id, sig);
    return sig;
  };
  return pickMatureByTypeDiverse(queue, type, nowIso, {
    limit: 10,
    denylist,
    signatureFor,
    similarFn: similarity,
    topicCap: TOPIC_CAP,
    onDropped: (item, reason) => console.log(`[publish] adiado ${item.id} (${type}): ${reason}`),
  });
}

async function hidratar(mature, indexById, tarjaColor, cycleColor) {
  const hydrated = [];
  for (const m of mature) {
    const h = (await hydrateItem(m, indexById)) || (await findInArchive(m.id));
    if (!h) {
      console.warn(`[publish] item ${m.id} nao achado em index nem archive, skip`);
      continue;
    }
    h._tarjaColor = tarjaColor; // cor da tarja (cadernob)
    h._cycleColor = cycleColor; // cor do ciclo (card02/capa)
    hydrated.push(h);
  }
  return hydrated;
}

async function gerarCapa(type, itemsToPost, cycleColor) {
  if (LAYOUT !== "card02" || itemsToPost.length < 2) return null;
  try {
    const coverId = `_cover-${type}`;
    await buildCoverSlide(itemsToPost[0], coverId, cycleColor);
    console.log(`[publish] capa gerada (lider=${itemsToPost[0].id})`);
    return slideUrlFor(coverId);
  } catch (e) {
    console.warn(`[publish] falha ao gerar capa (segue sem capa): ${e.message}`);
    return null;
  }
}

// Roda os lotes (regular, depois spotlight) e persiste o postedAt logo depois de cada publish.
export async function rodarLotes({ queue, indexById, nowIso, tarjaColor, cycleColor, denylist, ctx, maxBatches }) {
  const results = [];
  for (const t of ["regular", "spotlight"]) {
    if (results.length >= maxBatches) break;
    if (results.some((r) => r.isRateLimit)) {
      // Lote anterior bateu rate limit: o próximo bateria igual (mesma janela). Sai cedo.
      console.warn(`[publish] abort early: tipo=${t} pulado porque batch anterior bateu rate limit`);
      break;
    }
    const r = await processBatch(t, queue, indexById, nowIso, tarjaColor, cycleColor, denylist, ctx);
    if (!r) continue;
    results.push(r);
    if (r.succeeded > 0 && r.postId) {
      queue.postCount = (queue.postCount || 0) + 1; // 1 lote publicado = 1 post no IG
      // Persiste o postedAt NA HORA: se a run morrer depois (timeout, crash, push conflitado), o
      // próximo cron não re-posta. Falha aqui não derruba a run; o commit final tenta de novo.
      try {
        await writeQueue(queue);
        await ctx.commitAndPush(
          ["media/news/_publish-queue.json"],
          `publish-ig: marca postado ${r.type} (${r.succeeded} item/s) ${nowIso.slice(0, 16)}Z`,
          { onRebaseConflict: ctx.reconcile },
        );
      } catch (e) {
        console.warn(`[publish] persistencia imediata falhou (estado segue pro commit final): ${e.message}`);
      }
    }
  }
  return results;
}
