// Orquestrador da publicacao no Instagram. Roda no cron do workflow
// publish-instagram.yml a cada 30min. Fluxo:
//   1. le fila + index
//   2. pega items maduros (publishAt <= now), agrupa por type, max 10 cada
//   3. hidrata cada item (body_pt + sourceLabel) lendo items/<id>.json
//   4. gera slide JPG composto em media/news/instagram-slides/<id>.jpg
//   5. git add + commit + push dos slides (raw.githubusercontent passa a
//      servir imediatamente)
//   6. chama publishItems(...) por grupo, com pequena espera entre etapas
//   7. atualiza queue com postedAt + postId
//   8. git add + commit + push da queue
//
// Flags:
//   --dry-run        gera slides mas nao publica nem commita
//   --no-git         pula commits/push (uso local pra teste)
//   --max-batches=N  limita N grupos por run (default 2: 1 regular + 1 spotlight)
//
// Env esperado:
//   IG_USER_ID, IG_ACCESS_TOKEN (obrigatorios pra publicar)
//   GIT_AUTHOR_NAME, GIT_AUTHOR_EMAIL (default github-actions[bot])

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readQueue, writeQueue, pickMatureByTypeDiverse, markPosted, markError, markRateLimited, pruneOldPosted, pruneStalePending, readDenylist, writeDenylist, addToDenylist, readCooldown, isCoolingDown, setCooldown, clearCooldown } from "./queue.mjs";
import { topicSignature, similarity } from "../news/dedupe-history.mjs";
import { buildSlides, buildCoverSlide, SLIDES_DIR, LAYOUT } from "./slide-image.mjs";
import { publishItems, slideUrlFor } from "./instagram.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { getContentPublishingLimit, QUOTA_SAFETY_MARGIN, estimateUnsaturationDelayMs } from "./ig-quota.mjs";
import { detectDeletedPosts } from "./ig-detect-deleted.mjs";
import { pollTelegramCommands } from "./telegram-bot.mjs";
import { writeStepSummary } from "../news/_summary.mjs";

const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const ITEMS_DIR = path.join(NEWS_DIR, "items");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");

// Ciclo de cores da tarja superior do slide. Muda a cada POSTS_PER_COLOR
// posts publicados, dando dinamica visual no feed sem perder identidade.
// Ciclo completo = TARJA_COLORS.length * POSTS_PER_COLOR posts.
const TARJA_COLORS = [
  "#c12727", // vermelho sangue PJ (default)
  "#0a0908", // preto profundo
  "#a87f2c", // ocre sepia
  "#2a5b9e", // azul petroleo
];
const POSTS_PER_COLOR = 3;

// Duracao do cooldown global por classe de rate limit. App-level (code 4
// "Application request limit reached", code 17/32 user/page) e um teto
// coarse-grained da app inteira: backoff maior pra dar folga real. Content
// publishing (codes 80xxx, cota de 50/24h) usa janela menor.
const COOLDOWN_APP_LEVEL_MS = 3 * 60 * 60 * 1000;   // 3h
const COOLDOWN_CONTENT_MS = 60 * 60 * 1000;          // 1h
const APP_LEVEL_CODES = new Set([4, 17, 32, 613]);
function cooldownMsForCode(code) {
  return APP_LEVEL_CODES.has(code) ? COOLDOWN_APP_LEVEL_MS : COOLDOWN_CONTENT_MS;
}

// Defesa em profundidade no rate limit: markRateLimited (por item,
// _rateLimitedUntil) cobre a cota de content publishing 50/24h; setCooldown
// (global, _ig-cooldown.json) cobre o limite DA APP (code 4). Os dois coexistem
// de proposito, nao sao redundancia a consolidar.

// Diversidade e expiracao da fila (override por env).
const TOPIC_CAP = Number.isFinite(Number(process.env.IG_TOPIC_CAP)) && Number(process.env.IG_TOPIC_CAP) > 0
  ? Number(process.env.IG_TOPIC_CAP) : 1;
const STALE_DAYS = Number.isFinite(Number(process.env.IG_STALE_DAYS)) && Number(process.env.IG_STALE_DAYS) > 0
  ? Number(process.env.IG_STALE_DAYS) : 4;
const STALE_DAYS_EVERGREEN = Number.isFinite(Number(process.env.IG_STALE_DAYS_EVERGREEN)) && Number(process.env.IG_STALE_DAYS_EVERGREEN) > 0
  ? Number(process.env.IG_STALE_DAYS_EVERGREEN) : 30;

function getCurrentTarjaColor(postCount) {
  const idx = Math.floor((postCount || 0) / POSTS_PER_COLOR) % TARJA_COLORS.length;
  return TARJA_COLORS[idx];
}

// Ciclo de cor card02/capa: agora em ./color-cycle.mjs (fonte unica,
// compartilhada com run-publish-story). Dirige o FUNDO da capa Card 11
// e a cunha + tarja do Card 02.

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const MAX_BATCHES_ARG = args.find((a) => a.startsWith("--max-batches="));
const MAX_BATCHES = MAX_BATCHES_ARG ? parseInt(MAX_BATCHES_ARG.split("=")[1], 10) : 2;

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}

function git(args, opts = {}) {
  const r = spawnSync("git", args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(" ")} falhou: ${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

function gitTry(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return { ok: r.status === 0, out: r.stdout, err: r.stderr };
}

// Tombstone dos pendentes expirados por idade (no silent caps). Audit-only:
// o conteudo segue vivo no index/archive do site, sair da fila so significa
// "perdeu a janela de publicacao no IG". Idempotente por id, podado em 60d.
async function recordStaleTombstone(removed, indexById, nowIso) {
  const STALE_TOMBSTONE_TTL_DAYS = 60;
  const p = path.join(NEWS_DIR, "_skipped-stale.json");
  let doc = await readJson(p, { stale: [], updatedAt: null });
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
  await fs.writeFile(p, JSON.stringify(doc, null, 2));
}

async function hydrateItem(qEntry, indexById) {
  const idx = indexById.get(qEntry.id);
  if (!idx) return null;
  let body = "";
  try {
    const raw = await fs.readFile(path.join(ITEMS_DIR, `${qEntry.id}.json`), "utf8");
    body = JSON.parse(raw).body_pt || "";
  } catch {}
  return { ...idx, body_pt: body };
}

async function findInArchive(id) {
  // Items podem ter saido do index pro archive entre o enqueue e o
  // momento do publish. Fallback: olha archives mes a mes.
  try {
    const months = await fs.readdir(ARCHIVE_DIR);
    for (const f of months) {
      if (!f.endsWith(".json")) continue;
      const doc = await readJson(path.join(ARCHIVE_DIR, f), { items: [] });
      const it = (doc.items || []).find((x) => x.id === id);
      if (it) return it;
    }
  } catch {}
  return null;
}

async function commitAndPush(paths, message, retries = 3) {
  if (NO_GIT || DRY) {
    console.log(`[git] skip (dry/no-git): ${message}`);
    return;
  }
  // configura autor (sobrescreve se ja estiver set)
  const name = process.env.GIT_AUTHOR_NAME || "github-actions[bot]";
  const email = process.env.GIT_AUTHOR_EMAIL || "41898282+github-actions[bot]@users.noreply.github.com";
  spawnSync("git", ["config", "user.name", name], { encoding: "utf8" });
  spawnSync("git", ["config", "user.email", email], { encoding: "utf8" });

  for (const p of paths) {
    spawnSync("git", ["add", p], { encoding: "utf8" });
  }
  const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { encoding: "utf8" });
  if (diff.status === 0) {
    console.log(`[git] nada pra commitar: ${message}`);
    return;
  }
  git(["commit", "-m", message]);

  for (let i = 0; i < retries; i++) {
    const pull = gitTry(["pull", "--rebase", "--autostash"]);
    if (!pull.ok) console.warn(`[git] pull rebase warn: ${pull.err}`);
    const push = gitTry(["push"]);
    if (push.ok) {
      console.log(`[git] push OK (try ${i + 1}): ${message}`);
      return;
    }
    console.warn(`[git] push falhou (try ${i + 1}/${retries}): ${push.err}`);
    await new Promise((r) => setTimeout(r, 2000 + i * 1000));
  }
  throw new Error(`git push falhou apos ${retries} tentativas`);
}

async function processBatch(type, queue, indexById, nowIso, tarjaColor, cycleColor, denylist) {
  // No layout card02 o carrossel ganha 1 slide de capa (Card 11). A capa
  // conta no limite de 10 do IG, entao cap de 9 items + capa = 10.
  const matureLimit = LAYOUT === "card02" ? 9 : 10;
  // Assinatura de topico de cada item, pra diversidade por assunto no carrossel.
  // Le do index (ja em memoria); item sem texto/index nao entra em cluster.
  const sigCache = new Map();
  const signatureFor = (q) => {
    if (sigCache.has(q.id)) return sigCache.get(q.id);
    const idx = indexById.get(q.id);
    const text = idx ? `${idx.title_pt || idx.titulo_pt || ""} ${idx.intro_pt || ""}`.trim() : "";
    const sig = text ? topicSignature(text) : null;
    sigCache.set(q.id, sig);
    return sig;
  };
  const mature = pickMatureByTypeDiverse(queue, type, nowIso, {
    limit: matureLimit,
    denylist,
    signatureFor,
    similarFn: similarity,
    topicCap: TOPIC_CAP,
    onDropped: (item, reason) => console.log(`[publish] adiado ${item.id} (${type}): ${reason}`),
  });
  if (mature.length === 0) {
    console.log(`[publish] tipo=${type}: 0 maduros, skip`);
    return null;
  }
  console.log(`[publish] tipo=${type}: ${mature.length} maduros`);

  const hydrated = [];
  for (const m of mature) {
    let h = await hydrateItem(m, indexById);
    if (!h) h = await findInArchive(m.id);
    if (h) {
      // anota a cor da tarja (cadernob) e a cor do ciclo (card02/capa)
      h._tarjaColor = tarjaColor;
      h._cycleColor = cycleColor;
      hydrated.push(h);
    } else {
      console.warn(`[publish] item ${m.id} nao achado em index nem archive, skip`);
    }
  }
  if (hydrated.length === 0) {
    // marca como erro pra nao tentar pra sempre
    markError(queue, mature.map((m) => m.id), "item nao encontrado em index/archive", nowIso);
    return { type, attempted: mature.length, succeeded: 0 };
  }

  // 1. gera slides
  const slides = await buildSlides(hydrated);
  console.log(`[publish] slides gerados: ${slides.length} (${slides.filter((s) => s.reused).length} reuso de cache)`);

  if (slides.length === 0) {
    markError(queue, hydrated.map((h) => h.id), "falha ao gerar slides", nowIso);
    return { type, attempted: hydrated.length, succeeded: 0 };
  }

  // 2. items que terao slide; capa do carrossel (card02, >=2 items) usa o
  //    primeiro como lider. Gera a capa ANTES do push pra ela ir no mesmo
  //    commit dos slides (raw URL precisa estar publicada antes do publish).
  const itemsToPost = hydrated.filter((h) => slides.find((s) => s.id === h.id));
  // Item hidratado sem slide gerado = falha no buildSlide. Marca erro pra
  // nao ficar voltando pro topo da fila a cada run (bloqueando 1 slot).
  const failedSlide = hydrated.filter((h) => !slides.find((s) => s.id === h.id));
  if (failedSlide.length) {
    console.warn(`[publish] ${failedSlide.length} item(s) sem slide, marcando erro: ${failedSlide.map((h) => h.id).join(", ")}`);
    markError(queue, failedSlide.map((h) => h.id), "falha ao gerar slide", nowIso);
  }
  let coverImageUrl = null;
  if (LAYOUT === "card02" && itemsToPost.length >= 2) {
    try {
      const coverId = `_cover-${type}`;
      await buildCoverSlide(itemsToPost[0], coverId, cycleColor);
      coverImageUrl = slideUrlFor(coverId);
      console.log(`[publish] capa gerada (lider=${itemsToPost[0].id})`);
    } catch (e) {
      console.warn(`[publish] falha ao gerar capa (segue sem capa): ${e.message}`);
      coverImageUrl = null;
    }
  }

  // 3. commita + push slides (inclui a capa) pra raw URL funcionar
  await commitAndPush(
    ["media/news/instagram-slides/"],
    `publish-ig: gera slides ${type} (${slides.length}${coverImageUrl ? "+capa" : ""}) ${nowIso.slice(0, 16)}Z`,
  );

  // 4. pequena espera pra raw.githubusercontent indexar (geralmente <2s, mas seguranca)
  if (!DRY) await new Promise((r) => setTimeout(r, 5000));

  if (DRY) {
    console.log(`[publish] DRY: slides prontos${coverImageUrl ? " (com capa)" : ""}, pulando chamada IG`);
    return { type, attempted: hydrated.length, succeeded: 0, dry: true };
  }

  // 5. publica via API
  const slideSuffix = LAYOUT === "card02" ? ".card02" : "";
  try {
    const r = await publishItems(itemsToPost, { coverImageUrl, slideSuffix });
    console.log(`[publish] OK tipo=${type} postId=${r.postId} count=${r.count}`);
    markPosted(queue, itemsToPost.map((it) => it.id), r.postId, new Date().toISOString());
    return {
      type,
      attempted: itemsToPost.length,
      succeeded: itemsToPost.length,
      postId: r.postId,
      items: itemsToPost.map((it) => ({ id: it.id, title_pt: it.title_pt, tags: it.tags || [] })),
    };
  } catch (e) {
    // Erros IGAPIError/IGRateLimitError expoem code/subcode/fbtrace via
    // toDetailString. Outros erros usam message normal.
    const detail = typeof e.toDetailString === "function" ? e.toDetailString() : e.message;
    const nowIso2 = new Date().toISOString();
    console.error(`[publish] FALHA tipo=${type}: ${detail}`);
    if (e.isRateLimit) {
      // Backoff temporal: marca items pra nao tentar de novo enquanto a
      // janela rolling de 24h nao liberar. Quando expirar (1h default),
      // pickMature volta a considera-los.
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

async function sendTelegram(token, chatId, text) {
  const truncated = text.length > 3900 ? text.slice(0, 3900) + "\n\n(truncado)" : text;
  try {
    const params = new URLSearchParams({
      chat_id: chatId,
      parse_mode: "HTML",
      disable_web_page_preview: "true",
      text: truncated,
    });
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await res.json();
    if (!json.ok) console.warn("[publish] telegram falhou:", json);
    else console.log("[publish] telegram notif enviada");
  } catch (e) {
    console.warn("[publish] telegram erro:", e.message);
  }
}

async function notifyTelegram(results) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const success = results.filter((r) => r.succeeded > 0 && r.postId);
  const failed = results.filter((r) => r.succeeded === 0 && r.error);

  if (success.length > 0) {
    const totalItems = success.reduce((s, r) => s + r.items.length, 0);
    const brtNow = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    const lines = [];
    lines.push(`✅ <b>Publicado no @smufdpj, ${brtNow} BRT</b>`);
    lines.push("");
    for (const batch of success) {
      const label = batch.type === "spotlight" ? "Spotlight da comunidade" : "Notícias regulares";
      lines.push(`<b>${batch.items.length} ${batch.items.length === 1 ? "post" : "posts"} (${label})</b>`);
      lines.push(`<i>postId: <code>${batch.postId}</code></i>`);
      lines.push("");
      for (let i = 0; i < batch.items.length; i++) {
        const it = batch.items[i];
        const titulo = (it.title_pt || "(sem titulo)")
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const tagsStr = it.tags.length ? `  <i>tags: ${it.tags.join(", ")}</i>` : "";
        lines.push(`${i + 1}. <b>${titulo}</b>${tagsStr}`);
        lines.push(`   ↳ https://setlists-pj-ev.pages.dev/n/${it.id}`);
      }
      lines.push("");
    }
    lines.push(`Total: ${totalItems} item(s) no feed agora.`);
    await sendTelegram(token, chatId, lines.join("\n"));
  }

  if (failed.length > 0) {
    const brtNow = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    const lines = [];
    lines.push(`❌ <b>Falha ao publicar no @smufdpj, ${brtNow} BRT</b>`);
    lines.push("");
    const escape = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    for (const batch of failed) {
      const err = escape(batch.error || "erro desconhecido");
      const tag = batch.isRateLimit ? " ⏱ <i>rate limit</i>" : "";
      lines.push(`<b>tipo: ${batch.type}</b>${tag} — ${batch.attempted} item(s) tentado(s)`);
      lines.push(`<code>${err}</code>`);
      const meta = [];
      if (batch.errorCode != null) meta.push(`code=${batch.errorCode}`);
      if (batch.errorSubcode != null) meta.push(`subcode=${batch.errorSubcode}`);
      if (batch.fbtraceId) meta.push(`fbtrace=<code>${escape(batch.fbtraceId)}</code>`);
      if (meta.length) lines.push(meta.join(" "));
      lines.push("");
    }
    const rateLimited = failed.some((r) => r.isRateLimit);
    const tokenError = failed.some((r) => /blocked|token|expired|oauth/i.test(r.error || ""));
    if (rateLimited) {
      const appLevel = failed.some((r) => APP_LEVEL_CODES.has(r.errorCode));
      if (appLevel) {
        lines.push("⏱ <b>Rate limit DA APP (code 4).</b> Limite de chamadas da aplicacao inteira no Graph API, independente da cota de 50/24h.");
        lines.push(`Cooldown global armado por ${COOLDOWN_APP_LEVEL_MS / 3600000}h: proximos crons saem cedo sem tocar a API ate liberar.`);
        lines.push("Se persistir, cheque restricao/tier da app no Meta Developer Portal.");
      } else {
        lines.push("⏱ <b>Rate limit IG (content publishing).</b> Cota de publishes na janela rolling de 24h saturou.");
        lines.push(`Cooldown global armado por ${COOLDOWN_CONTENT_MS / 3600000}h: proximos crons saem cedo ate liberar.`);
      }
    } else if (tokenError) {
      lines.push("⚠️ Provavel token expirado. Reautorize em Meta Developer Portal e atualize o secret:");
      lines.push("<code>gh secret set IG_ACCESS_TOKEN --repo andrehz4/setlists-pj-ev</code>");
    }
    await sendTelegram(token, chatId, lines.join("\n"));
  }
}

async function main() {
  const nowIso = new Date().toISOString();
  console.log(`[publish] run em ${nowIso} | dry=${DRY} no-git=${NO_GIT} max-batches=${MAX_BATCHES}`);

  if (!DRY) {
    if (!process.env.IG_USER_ID || !process.env.IG_ACCESS_TOKEN) {
      console.error("IG_USER_ID e IG_ACCESS_TOKEN obrigatorios (env)");
      process.exit(2);
    }
  }

  // Cooldown global: se a run anterior bateu no limite DA APP (code 4 etc),
  // sai cedo SEM rodar deteccao de apagados, gerar slides, dar push nem
  // tentar publicar. Para de martelar a API enquanto o throttle nao limpa
  // e evita encher o repo de commits de slide que nao vao pro ar. Pula em
  // DRY (DRY nao chama IG API).
  if (!DRY) {
    const cooldown = await readCooldown();
    if (isCoolingDown(cooldown, nowIso)) {
      const msg = `cooldown global ativo ate ${cooldown.until} (motivo: ${cooldown.reason || "rate limit"}${cooldown.code != null ? ` code=${cooldown.code}` : ""}). Aborta a run sem tocar a IG API.`;
      console.warn(`[publish] ${msg}`);
      await writeStepSummary({
        title: "Publish Instagram",
        meta: { dry: DRY, "max-batches": MAX_BATCHES, run: nowIso.slice(0, 16) + "Z" },
        stats: { "batches": 0, "publicados": 0, "falhas": 0 },
        extras: [{ heading: "Cooldown ativo", body: msg }],
      });
      // Sem telegram aqui: a falha que armou o cooldown ja notificou. Notificar
      // a cada cron de 30min so geraria spam.
      process.exitCode = 0; // backoff intencional, nao e erro de pipeline
      return;
    }
    // cooldown expirou mas o arquivo ainda tem `until` no passado: normaliza
    // pra nao deixar estado stale no repo (clearCooldown so roda em sucesso,
    // que pode nao acontecer se nao ha item maduro quando a app destrava).
    if (cooldown.until) {
      await clearCooldown();
      console.log("[publish] cooldown expirado, estado limpo");
    }
  }

  // Pre-check de quota IG. Se saturado, aborta antes de gerar slides e
  // queimar mais quota com retries. Margem de seguranca em ig-quota.mjs.
  // Em DRY pula o check (DRY nao chama IG API entao nao queima quota).
  let quotaInfo = null;
  if (!DRY) {
    try {
      quotaInfo = await getContentPublishingLimit();
      console.log(`[publish] quota IG: ${quotaInfo.usage}/${quotaInfo.total} usados, ${quotaInfo.remaining} restantes (margem=${QUOTA_SAFETY_MARGIN})`);
      if (quotaInfo.saturated) {
        const msg = `IG content publishing quota saturada: ${quotaInfo.usage}/${quotaInfo.total} usados, ${quotaInfo.remaining} restantes (<= margem ${QUOTA_SAFETY_MARGIN}). Aborta a run antes de tentar publicar.`;
        console.error(`[publish] ${msg}`);
        await writeStepSummary({
          title: "Publish Instagram",
          meta: { dry: DRY, "max-batches": MAX_BATCHES, run: nowIso.slice(0, 16) + "Z" },
          stats: { "batches": 0, "publicados": 0, "falhas": 0 },
          extras: [{ heading: "Quota saturada", body: msg }],
        });
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) {
          const brtNow = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
          await sendTelegram(token, chatId, `⏸ <b>Publish IG pulado, ${brtNow} BRT</b>\n\nQuota saturada: <code>${quotaInfo.usage}/${quotaInfo.total}</code> usados.\nRestam <b>${quotaInfo.remaining}</b> (margem ${QUOTA_SAFETY_MARGIN}).\nAguardando janela rolling de 24h liberar.`);
        }
        process.exitCode = 0; // nao e erro de pipeline, e backoff intencional
        return;
      }
    } catch (e) {
      // pre-check falhou. Nao bloqueia a run; pode ser API instavel ou
      // permissao faltando. Loga e segue (o publish em si vai expor o erro
      // real com mais detalhe na proxima etapa).
      console.warn(`[publish] pre-check quota falhou (segue mesmo assim): ${e.message}`);
    }
  }

  // Telegram bot: processa comandos /ban /unban /denylist /status que
  // Andre mandou desde o ultimo cron. Atualiza o _deleted-from-ig.json
  // antes da detecao automatica abaixo, entao bans manuais via celular
  // tem efeito imediato nesse cron.
  if (!DRY) {
    try {
      const r = await pollTelegramCommands();
      if (r.processed > 0) console.log(`[publish] telegram bot: ${r.processed} comando(s) processado(s)`);
    } catch (e) {
      console.warn(`[publish] telegram bot polling falhou (segue): ${e.message}`);
    }
  }

  const queue = await readQueue();
  const denylist = await readDenylist();
  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  const indexById = new Map((indexDoc.items || []).map((x) => [x.id, x]));

  // Auto-deteccao: bate GET /<postId> nos posts recentes pra ver quais
  // sumiram do IG (Andre apagou no app). Adiciona a denylist + grava.
  // So roda quando NAO e DRY (precisa de IG_ACCESS_TOKEN real e queima
  // ~5-30 GETs por run, sob o limite de 200/hora).
  if (!DRY) {
    try {
      const det = await detectDeletedPosts({ queue, lookbackDays: 30 });
      if (det.deletedItems.length > 0) {
        let addedCount = 0;
        for (const di of det.deletedItems) {
          if (addToDenylist(denylist, { itemId: di.itemId, postId: di.postId, reason: "auto-detected (404 no IG)" })) {
            addedCount++;
          }
        }
        if (addedCount > 0) {
          await writeDenylist(denylist);
          console.log(`[publish] denylist: +${addedCount} item(s) auto-detectados como apagados (${det.deletedItems.map((d) => d.itemId).join(", ")})`);
          const token = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID;
          if (token && chatId) {
            const lines = [
              "🗑 <b>Posts apagados detectados no IG</b>",
              "",
              `${addedCount} item(s) banido(s) permanentemente:`,
              ...det.deletedItems.slice(0, 10).map((d) => `<code>${d.itemId}</code> (postId ${d.postId})`),
            ];
            await sendTelegram(token, chatId, lines.join("\n"));
          }
        }
      }
      console.log(`[publish] deteccao de apagados: ${det.checked} posts checados (${det.cachedSkipped ?? 0} pulados via cache de ${det.total ?? det.checked}), ${det.deletedItems.length} apagados, ${det.indeterminate} indeterminados`);
    } catch (e) {
      console.warn(`[publish] auto-deteccao de apagados falhou (segue): ${e.message}`);
    }
  }

  console.log(`[publish] queue: ${queue.items.length} items totais, ${queue.items.filter((q) => !q.postedAt).length} pendentes, postCount=${queue.postCount}, denylist=${denylist.deleted.length}`);

  // cor da tarja desta rodada (cicla a cada 3 posts publicados)
  const tarjaColor = getCurrentTarjaColor(queue.postCount);
  // cor do ciclo card02/capa (mesma regra de 3 posts/cor)
  const cycleColor = getCurrentCycleColor(queue.postCount);
  console.log(`[publish] cor: tarja=${tarjaColor} ciclo=${cycleColor} (a cada ${POSTS_PER_COLOR} posts)`);

  const results = [];
  const types = ["regular", "spotlight"];
  let batchCount = 0;
  let rateLimitedHit = false;
  for (const t of types) {
    if (batchCount >= MAX_BATCHES) break;
    if (rateLimitedHit) {
      // Se um batch ja bateu rate limit, o proximo vai bater igual (mesma
      // janela rolling). Aborta cedo pra nao queimar mais quota nem
      // confundir telemetria com falhas em cascata.
      console.warn(`[publish] abort early: tipo=${t} pulado porque batch anterior bateu rate limit`);
      break;
    }
    const r = await processBatch(t, queue, indexById, nowIso, tarjaColor, cycleColor, denylist);
    if (r) {
      results.push(r);
      batchCount++;
      // 1 batch sucesso = 1 post real no IG = incrementa postCount
      if (r.succeeded > 0 && r.postId) {
        queue.postCount = (queue.postCount || 0) + 1;
      }
      if (r.isRateLimit) rateLimitedHit = true;
    }
  }

  // Cooldown global: se qualquer batch bateu rate limit, arma o cooldown
  // pros proximos crons sairem cedo (prioridade sobre sucesso parcial, ja
  // que o throttle e da app inteira). Se nenhum bateu e algum publicou,
  // limpa cooldown stale.
  if (!DRY) {
    const rl = results.find((r) => r.isRateLimit);
    const anySuccess = results.some((r) => r.succeeded > 0 && r.postId);
    if (rl) {
      const ms = cooldownMsForCode(rl.errorCode);
      const cd = await setCooldown({ ms, reason: rl.error, code: rl.errorCode, fbtraceId: rl.fbtraceId });
      console.warn(`[publish] cooldown global armado ate ${cd.until} (code=${rl.errorCode ?? "?"})`);
    } else if (anySuccess) {
      await clearCooldown();
    }
  }

  // housekeeping: limpa postados muito antigos. Denylist preserva items
  // banidos (tombstone perpetuo) mesmo apos 30 dias.
  const pruned = pruneOldPosted(queue, nowIso, 30, denylist);
  if (pruned > 0) console.log(`[publish] prune: ${pruned} postados antigos removidos`);

  // expira pendentes datados velhos demais (4d normal, 30d evergreen/memoria),
  // pra backlog antigo nao atropelar conteudo novo apos pausa do publish.
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

  await writeQueue(queue);
  // Denylist + cursor do telegram + queue commitados juntos pro proximo
  // cron ja ver bans manuais que entraram via /ban no Telegram.
  await commitAndPush(
    [
      "media/news/_publish-queue.json",
      "media/news/_deleted-from-ig.json",
      "media/news/_telegram-cursor.json",
      "media/news/_ig-cooldown.json",
      "media/news/_ig-exists-cache.json",
      "media/news/_skipped-stale.json",
    ],
    `publish-ig: atualiza fila (${results.map((r) => `${r.type}:${r.succeeded}/${r.attempted}`).join(" ")}) ${nowIso.slice(0, 16)}Z`,
  );

  if (!DRY) await notifyTelegram(results);

  const publishedBatches = results.filter((r) => r.succeeded > 0 && r.items);
  const failedBatches = results.filter((r) => r.succeeded === 0 && r.error);
  const publishedItems = publishedBatches.flatMap((r) =>
    r.items.map((it) => ({ ...it, sourceLabel: r.type === "spotlight" ? "Spotlight da comunidade" : "Noticia regular" }))
  );
  await writeStepSummary({
    title: "Publish Instagram",
    meta: { dry: DRY, "max-batches": MAX_BATCHES, run: nowIso.slice(0, 16) + "Z" },
    stats: {
      "batches": results.length,
      "publicados": publishedBatches.reduce((s, r) => s + r.succeeded, 0),
      "falhas": failedBatches.length,
    },
    curated: publishedItems.length > 0 ? publishedItems : undefined,
    extras: [
      ...(results.length === 0 ? [{ heading: "Resultado", body: "Fila vazia, nenhum item maduro." }] : []),
      ...failedBatches.map((r) => ({ heading: `Falha (${r.type})`, body: `\`${r.error}\`` })),
    ],
  });

  const allFailed = results.length > 0 && results.every((r) => r.succeeded === 0 && r.error);
  if (allFailed) {
    console.error("[publish] todos os batches falharam, sinalizando erro pro workflow");
    process.exitCode = 1;
  }

  console.log(`[publish] FIM`, results);
}

main().catch((e) => {
  console.error("[publish] FATAL:", e);
  process.exit(1);
});
