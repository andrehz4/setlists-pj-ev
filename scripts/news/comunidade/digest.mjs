// Digest diário da comunidade (r/pearljam): agrega os posts mais votados do dia numa matéria.
// Id "cd-AAAAMMDD" no seen.json = 1 digest por dia. Em modo routine vira pendente com os posts brutos.
import { fetchTopDay } from "../reddit-community.mjs";
import { cacheImage } from "../image-cache.mjs";
import { curate as curateDigest } from "../curators/community-digest.mjs";

const DIGEST_MIN_POSTS = 5;
const DIGEST_MAX_INPUT_POSTS = 15;
const todayUTC = () => new Date().toISOString().slice(0, 10).replace(/-/g, ""); // AAAAMMDD

export async function runDigest({ seen, pendingDoc, warnings, sourceResults, isRoutine }) {
  const dateKey = todayUTC();
  const id = `cd-${dateKey}`;
  if (seen[id]) {
    console.log(`[digest] ja publicado hoje (${id}), pulando.`);
    sourceResults.push({ label: "Reddit r/pearljam top/day (digest)", count: 0, error: null });
    return null;
  }
  // Se ja esta em _pending (modo routine ainda nao processou), pula
  if ((pendingDoc.items || []).some((p) => p.id === id)) {
    console.log(`[digest] ja em _pending.json (${id}), aguardando routine.`);
    sourceResults.push({ label: "Reddit r/pearljam top/day (digest)", count: 0, error: null });
    return null;
  }

  console.log(`[digest] buscando top.json?t=day...`);
  const { posts: all, fetchError: digestFetchError } = await fetchTopDay(25);
  sourceResults.push({ label: "Reddit r/pearljam top/day (digest)", count: all.length, error: digestFetchError });
  if (digestFetchError) warnings.push(`Reddit top/day: ${digestFetchError}`);
  const posts = all.slice(0, DIGEST_MAX_INPUT_POSTS);
  console.log(`[digest] ${all.length} posts elegiveis, usando top ${posts.length}`);

  if (posts.length < DIGEST_MIN_POSTS) {
    console.log(`[digest] menos de ${DIGEST_MIN_POSTS} posts no dia, pulando.`);
    return null;
  }

  // Imagem do digest: usa o cover do post mais votado que tiver imagem
  const postWithImg = posts.find((p) => p.cover_image);
  let localImg = null;
  if (postWithImg) {
    localImg = await cacheImage(postWithImg.cover_image, id);
  }

  // ---- Modo routine: escreve item bruto em _pending.json com posts agregados ----
  if (isRoutine) {
    return {
      _kind: "pending",
      pending: {
        id,
        url: `https://www.reddit.com/r/pearljam/top/?t=day`,
        source: "reddit-community-digest",
        sourceLabel: "Comunidade r/pearljam",
        group: "comunidade",
        pubDate: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        img: localImg,
        kind: "community-digest",
        community_posts_count: posts.length,
        // Os posts brutos vao no input pra Claude routine processar
        community_posts: posts.map((p) => ({
          author: p.author,
          title: p.title,
          flair: p.flair,
          score: p.score,
          num_comments: p.num_comments,
          created_iso: p.created_iso,
          selftext: p.selftext,
          permalink: p.permalink,
        })),
      },
    };
  }

  // ---- Modo gemini (default): cura agora ----
  const out = await curateDigest({ posts, periodLabel: "ultimas 24 horas" });
  if (out === "SKIP") {
    console.log("[digest] curator retornou SKIP, dia fraco.");
    seen[id] = { skipped: true, ts: Date.now(), kind: "community-digest" };
    return null;
  }

  const item = {
    id,
    url: `https://www.reddit.com/r/pearljam/top/?t=day`,
    source: "reddit-community-digest",
    sourceLabel: "Comunidade r/pearljam",
    group: "comunidade",
    pubDate: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    img: localImg,
    title_pt: out.titulo_pt,
    intro_pt: out.intro_pt,
    body_pt: out.corpo_pt,
    tags: out.tags,
    community_posts_count: posts.length,
  };
  seen[id] = { firstSeen: Date.now(), kind: "community-digest", title: out.titulo_pt };
  return { _kind: "curated", item };
}
