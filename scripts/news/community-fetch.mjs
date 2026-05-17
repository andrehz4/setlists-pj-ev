// Orquestrador do pipeline de comunidade. Pra rodar:
//   node scripts/news/community-fetch.mjs --mode=digest   [--dry-run]
//   node scripts/news/community-fetch.mjs --mode=spotlight [--dry-run]
//   node scripts/news/community-fetch.mjs --mode=both     [--dry-run]
//
// Diferenca do fetch-news.mjs:
//   - Fonte unica (r/pearljam), nao itera SOURCES
//   - Output entra no MESMO media/news/index.json, mas com source dedicada
//     ("reddit-community-digest" ou "reddit-community-spotlight")
//   - Dedupe usa media/news/seen.json com prefixo cd- / cs- pra nao bater com news
//
// Digest:
//   - 1x/dia (idealmente manha BRT)
//   - Pega top.json?t=day, agrega 10-15 posts, gera 1 materia
//   - Dedupe: usa key "cd-YYYYMMDD" no seen.json (1 digest por dia)
//
// Spotlight:
//   - 1x/dia (idealmente noite BRT)
//   - Pega top.json?t=week, filtra fan content com imagem, pega melhor nao publicado
//   - Dedupe: usa key "cs-<sha10(permalink)>" no seen.json (post nao repete)

import fs from "node:fs/promises";
import path from "node:path";
import {
  fetchTopDay,
  pickSpotlightCandidate,
} from "./reddit-community.mjs";
import { sha10 } from "./relevance.mjs";
import { cacheImage, gcOrphanImages, ensureImgDir } from "./image-cache.mjs";
import { curate as curateDigest } from "./curators/community-digest.mjs";
import { curate as curateSpotlight } from "./curators/community-spotlight.mjs";
import { writeStepSummary } from "./_summary.mjs";

const args = process.argv.slice(2);
function argVal(name) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return null;
}
const MODE = (argVal("mode") || "both").toLowerCase();
const DRY = args.includes("--dry-run");
// Curator: 'gemini' (default) usa community-digest.mjs/community-spotlight.mjs
// direto; 'routine' apenas coleta+escreve em _pending.json pra Claude routine
// curar depois (mesma logica do fetch-news.mjs).
const CURATOR_NAME = (argVal("curator") || process.env.NEWS_CURATOR || "gemini").toLowerCase();

if (!["digest", "spotlight", "both"].includes(MODE)) {
  console.error(`[community] modo invalido: '${MODE}'. Use: digest | spotlight | both`);
  process.exit(1);
}
if (!["gemini", "routine"].includes(CURATOR_NAME)) {
  console.error(`[community] curator invalido: '${CURATOR_NAME}'. Use: gemini | routine`);
  process.exit(1);
}
const IS_ROUTINE = CURATOR_NAME === "routine";

const TOP_KEEP = 30;
const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");
const ITEMS_DIR = path.join(NEWS_DIR, "items");

function splitItemBody(it) {
  const { body_pt, ...meta } = it;
  return { meta, body: body_pt ? { id: it.id, body_pt } : null };
}

const DIGEST_MIN_POSTS = 5;
const DIGEST_MAX_INPUT_POSTS = 15;
// Spotlight usa top/day (mesmo endpoint do digest, sem risco de 403 no t=week).
// Score minimo menor pois posts do dia ainda nao acumularam pontos da semana.
const SPOTLIGHT_MIN_SCORE = 20;

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); }
  catch (err) {
    if (err.code !== "ENOENT") console.warn(`[community] readJson: ${path.basename(p)} corrompido ou ilegivel (${err.message}), usando fallback`);
    return fallback;
  }
}
async function writeJson(p, data) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
}

async function runDigest({ seen, currentItems, pendingDoc, warnings, sourceResults }) {
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
  if (IS_ROUTINE) {
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

async function runSpotlight({ seen, currentItems, pendingDoc, warnings, sourceResults }) {
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
  if (IS_ROUTINE) {
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

async function main() {
  await fs.mkdir(NEWS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await ensureImgDir();

  const seen = await readJson(SEEN_PATH, {});
  const current = await readJson(INDEX_PATH, { updated: null, items: [] });
  const currentItems = Array.isArray(current.items) ? current.items : [];
  const pendingDoc = await readJson(PENDING_PATH, { items: [] });

  console.log(`[community] mode=${MODE} | curator=${CURATOR_NAME} | dry=${DRY} | current items: ${currentItems.length} | seen: ${Object.keys(seen).length} | pending: ${(pendingDoc.items||[]).length}`);

  const results = [];
  const allWarnings = [];
  const sourceResults = [];

  if (MODE === "digest" || MODE === "both") {
    try {
      const d = await runDigest({ seen, currentItems, pendingDoc, warnings: allWarnings, sourceResults });
      if (d) results.push(d);
    } catch (err) {
      console.warn(`[community] runDigest falhou: ${err.message}. Continuando com spotlight.`);
      allWarnings.push(`runDigest falhou: ${err.message}`);
    }
  }
  if (MODE === "spotlight" || MODE === "both") {
    try {
      const s = await runSpotlight({ seen, currentItems, pendingDoc, warnings: allWarnings, sourceResults });
      if (s) results.push(s);
    } catch (err) {
      console.warn(`[community] runSpotlight falhou: ${err.message}.`);
      allWarnings.push(`runSpotlight falhou: ${err.message}`);
    }
  }

  // Separa items prontos (curated) de pendentes (routine mode)
  const newItems = results.filter((r) => r._kind === "curated").map((r) => r.item);
  const newPending = results.filter((r) => r._kind === "pending").map((r) => r.pending);

  console.log(`[community] curados agora: ${newItems.length} | pendentes pra routine: ${newPending.length}`);

  // Alerta Telegram quando Reddit retornar 0 posts por erro de API
  const redditErrors = sourceResults.filter((s) => s.error);
  if (redditErrors.length > 0 && !DRY) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const brtNow = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
      const errs = redditErrors.map((s) => `• ${s.label}: <code>${String(s.error).slice(0, 200)}</code>`).join("\n");
      const msg = `⚠️ <b>Community fetch falhou, ${brtNow} BRT</b>\n\nReddit retornou 0 posts por erro de API. Digest e/ou Spotlight nao foram coletados.\n\n${errs}\n\nVerificar: REDDIT_PROXY_URL, credenciais OAuth, status Reddit.`;
      try {
        const params = new URLSearchParams({ chat_id: chatId, parse_mode: "HTML", disable_web_page_preview: "true", text: msg });
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        console.log("[community] alerta Telegram enviado: Reddit com erro");
      } catch (e) {
        console.warn("[community] telegram alerta erro:", e.message);
      }
    }
  }

  // ---- Modo routine: salva _pending.json e termina (nao mexe em index.json) ----
  if (IS_ROUTINE) {
    const pendingTotalAntes = (pendingDoc.items || []).length;
    if (newPending.length === 0) {
      console.log("[community] routine: nada novo pra pendurar.");
      if (!DRY) await writeJson(SEEN_PATH, seen);
      await writeStepSummary({
        title: `Community fetch · routine (${MODE})`,
        meta: { modo: MODE, curator: CURATOR_NAME, dry: DRY },
        stats: {
          "coletados nesta run": 0,
          "pending total agora": pendingTotalAntes,
          "index atual": currentItems.length,
        },
        sources: sourceResults.length ? sourceResults : undefined,
        warnings: allWarnings.length ? allWarnings : undefined,
        extras: [{ heading: "Resultado", body: "Nada novo pra pendurar (digest do dia ja existe ou nenhum spotlight passou no filtro)." }],
      });
      return;
    }
    const merged = {
      generatedAt: new Date().toISOString(),
      items: [...(pendingDoc.items || []), ...newPending],
    };
    if (DRY) {
      console.log("[community] DRY routine, nao escrevendo. Novos pending:");
      console.log(JSON.stringify(newPending, null, 2));
    } else {
      await writeJson(PENDING_PATH, merged);
      await writeJson(SEEN_PATH, seen);
      console.log(`[community] routine: ${PENDING_PATH} (${merged.items.length} aguardando curadoria)`);
    }
    await writeStepSummary({
      title: `Community fetch · routine (${MODE})`,
      meta: { modo: MODE, curator: CURATOR_NAME, dry: DRY },
      stats: {
        "coletados nesta run": newPending.length,
        "pending total agora": merged.items.length,
        "index atual": currentItems.length,
      },
      sources: sourceResults.length ? sourceResults : undefined,
      warnings: allWarnings.length ? allWarnings : undefined,
      pending: newPending,
      extras: [
        { heading: "Proximo passo", body: "A routine Sonnet remota le `_pending.json`, cura, e roda `node scripts/news/merge-curated.mjs` pra publicar no `index.json`." },
      ],
    });
    return;
  }

  // ---- Modo gemini (default): publica direto no index.json ----
  if (newItems.length === 0) {
    if (!DRY) await writeJson(SEEN_PATH, seen);
    console.log("[community] nada a publicar.");
    await writeStepSummary({
      title: `Community fetch · ${CURATOR_NAME} (${MODE})`,
      meta: { modo: MODE, curator: CURATOR_NAME, dry: DRY },
      stats: { "publicados agora": 0, "index atual": currentItems.length },
      sources: sourceResults.length ? sourceResults : undefined,
      warnings: allWarnings.length ? allWarnings : undefined,
      extras: [{ heading: "Resultado", body: "Nada novo passou no curator." }],
    });
    return;
  }

  const map = new Map();
  for (const it of newItems) map.set(it.id, it);
  for (const it of currentItems) if (!map.has(it.id)) map.set(it.id, it);
  const merged = [...map.values()].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const finalItems = merged.slice(0, TOP_KEEP);
  const overflow = merged.slice(TOP_KEEP);

  if (overflow.length > 0) {
    const byMonth = new Map();
    for (const it of overflow) {
      const ym = (it.pubDate || new Date().toISOString()).slice(0, 7);
      if (!byMonth.has(ym)) byMonth.set(ym, []);
      byMonth.get(ym).push(it);
    }
    for (const [ym, items] of byMonth) {
      const p = path.join(ARCHIVE_DIR, `${ym}.json`);
      const existing = await readJson(p, { items: [] });
      const seenIds = new Set((existing.items || []).map((x) => x.id));
      const merged2 = [...(existing.items || []), ...items.filter((x) => !seenIds.has(x.id))];
      await writeJson(p, { month: ym, items: merged2 });
    }
  }

  const keepHashes = finalItems.filter((i) => i.img).map((i) => i.id);
  if (!DRY) await gcOrphanImages(keepHashes);

  // split body_pt em items/<id>.json e deixa index.json so com metadata
  if (!DRY) await fs.mkdir(ITEMS_DIR, { recursive: true });
  const lightItems = [];
  for (const it of finalItems) {
    const { meta, body } = splitItemBody(it);
    if (!DRY && body) {
      await fs.writeFile(path.join(ITEMS_DIR, `${body.id}.json`), JSON.stringify(body, null, 2));
    }
    lightItems.push(meta);
  }

  const out = { updated: new Date().toISOString(), items: lightItems };
  if (DRY) {
    console.log("[community] DRY RUN, nao escrevendo arquivos.");
    console.log(JSON.stringify({ added: newItems.length, total: finalItems.length }, null, 2));
    console.log("--- novos itens ---");
    console.log(JSON.stringify(newItems, null, 2));
  } else {
    await writeJson(INDEX_PATH, out);
    await writeJson(SEEN_PATH, seen);
    console.log(`[community] escrito: ${INDEX_PATH} (${finalItems.length} items)`);
  }

  await writeStepSummary({
    title: `Community fetch · ${CURATOR_NAME} (${MODE})`,
    meta: { modo: MODE, curator: CURATOR_NAME, dry: DRY },
    stats: {
      "publicados agora": newItems.length,
      "total no index": finalItems.length,
      "arquivados (overflow)": overflow.length,
    },
    sources: sourceResults.length ? sourceResults : undefined,
    warnings: allWarnings.length ? allWarnings : undefined,
    curated: newItems,
  });
}

// Watchdog + exit explicito: mesmo motivo do fetch-news.mjs. got/sharp deixam
// socket no event loop que pode segurar o processo por minutos. Aborta em 6min
// (timeout do workflow e 8min) e encerra na hora quando o trabalho termina.
const WATCHDOG_MS = 6 * 60 * 1000;
const watchdog = setTimeout(() => {
  console.error(`[community] WATCHDOG: passou de ${WATCHDOG_MS / 60000}min sem terminar, abortando`);
  process.exit(2);
}, WATCHDOG_MS);
watchdog.unref();

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[community] FATAL:", e);
    process.exit(1);
  });
