// Spotlight da comunidade: o melhor post de fã com imagem ainda não publicado vira matéria.
// Id "cs-<sha10(permalink)>" no seen.json (o post não repete). Em modo routine vira pendente.
import { fetchTopDay, pickSpotlightCandidate } from "../reddit-community.mjs";
import { sha10 } from "../relevance.mjs";
import { cacheImage } from "../image-cache.mjs";
import { curate as curateSpotlight } from "../curators/community-spotlight.mjs";

// Score não vem no RSS: filtro desligado (0). O spotlight filtra por imagem + heurística de fan content.
const SPOTLIGHT_MIN_SCORE = 0;

export async function runSpotlight({ seen, pendingDoc, warnings, sourceResults, isRoutine }) {
  // Usa top/day (mesmo endpoint do digest) porque t=week e bloqueado pelo Reddit
  // em IPs de GitHub Actions runners sem OAuth. Score minimo reduzido pra compensar.
  console.log(`[spotlight] buscando top.json?t=day (limit=50)...`);
  const { posts: all, fetchError: spotlightFetchError } = await fetchTopDay(50);
  sourceResults.push({ label: "Reddit r/pearljam top/day (spotlight)", count: all.length, error: spotlightFetchError });
  if (spotlightFetchError) warnings.push(`Reddit top/day (spotlight): ${spotlightFetchError}`);
  console.log(`[spotlight] ${all.length} posts da semana`);

  // Constroi set de IDs ja publicados (qualquer chave cs-* no seen)
  const publishedPostIds = new Set();
  for (const [k, v] of Object.entries(seen)) {
    if (k.startsWith("cs-") && v?.post_id) publishedPostIds.add(v.post_id);
  }
  // Tambem pula posts que ja estao em _pending (aguardando routine)
  for (const p of (pendingDoc.items || [])) {
    if (p.kind === "community-spotlight" && p.community_post_id) {
      publishedPostIds.add(p.community_post_id);
    }
  }

  const cand = pickSpotlightCandidate(all, publishedPostIds, { minScore: SPOTLIGHT_MIN_SCORE });
  if (!cand) {
    console.log(`[spotlight] nenhum candidato com score>=${SPOTLIGHT_MIN_SCORE}, com imagem e nao-publicado.`);
    return null;
  }

  console.log(`[spotlight] candidato: ${cand.author} | ${cand.score}pts | ${cand.title.slice(0, 80)}`);

  const id = `cs-${sha10(cand.permalink)}`;
  if (seen[id]) {
    console.log(`[spotlight] id ${id} ja visto (race condition?), pulando.`);
    return null;
  }

  const localImg = await cacheImage(cand.cover_image, id);

  // ---- Modo routine: escreve item bruto em _pending.json com dados do post ----
  if (isRoutine) {
    return {
      _kind: "pending",
      pending: {
        id,
        url: cand.permalink,
        source: "reddit-community-spotlight",
        sourceLabel: "Comunidade r/pearljam",
        group: "comunidade",
        pubDate: cand.created_iso,
        fetchedAt: new Date().toISOString(),
        img: localImg,
        kind: "community-spotlight",
        community_post_id: cand.id,
        community_post_url: cand.permalink,
        community_post_score: cand.score,
        // Dados pra Claude routine curar (sem repassar author pra evitar
        // tentacao de cita-lo no texto - regra do prompt)
        post_title_orig: cand.title,
        post_flair: cand.flair,
        post_num_comments: cand.num_comments,
        post_selftext: cand.selftext,
      },
    };
  }

  // ---- Modo gemini (default): cura agora ----
  const out = await curateSpotlight({ post: cand });
  if (out === "SKIP") {
    console.log("[spotlight] curator retornou SKIP (menor, meme ou ambíguo).");
    seen[id] = { skipped: true, ts: Date.now(), kind: "community-spotlight", post_id: cand.id };
    return null;
  }

  const item = {
    id,
    url: cand.permalink,
    source: "reddit-community-spotlight",
    sourceLabel: "Comunidade r/pearljam",
    group: "comunidade",
    pubDate: cand.created_iso,
    fetchedAt: new Date().toISOString(),
    img: localImg,
    title_pt: out.titulo_pt,
    intro_pt: out.intro_pt,
    body_pt: out.corpo_pt,
    tags: out.tags,
    community_author: cand.author,
    community_post_url: cand.permalink,
    community_post_score: cand.score,
  };
  seen[id] = {
    firstSeen: Date.now(),
    kind: "community-spotlight",
    post_id: cand.id,
    title: out.titulo_pt,
  };
  return { _kind: "curated", item };
}
