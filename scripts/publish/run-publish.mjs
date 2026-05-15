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
import { readQueue, writeQueue, pickMatureByType, markPosted, markError, pruneOldPosted } from "./queue.mjs";
import { buildSlides, SLIDES_DIR } from "./slide-image.mjs";
import { publishItems } from "./instagram.mjs";

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

function getCurrentTarjaColor(postCount) {
  const idx = Math.floor((postCount || 0) / POSTS_PER_COLOR) % TARJA_COLORS.length;
  return TARJA_COLORS[idx];
}

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

async function processBatch(type, queue, indexById, nowIso, tarjaColor) {
  const mature = pickMatureByType(queue, type, nowIso, 10);
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
      // anota a cor da tarja do post desta rodada
      h._tarjaColor = tarjaColor;
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

  // 2. commita + push slides pra raw URL funcionar
  await commitAndPush(
    ["media/news/instagram-slides/"],
    `publish-ig: gera slides ${type} (${slides.length}) ${nowIso.slice(0, 16)}Z`,
  );

  // 3. pequena espera pra raw.githubusercontent indexar (geralmente <2s, mas seguranca)
  if (!DRY) await new Promise((r) => setTimeout(r, 5000));

  if (DRY) {
    console.log(`[publish] DRY: slides prontos, pulando chamada IG`);
    return { type, attempted: hydrated.length, succeeded: 0, dry: true };
  }

  // 4. publica via API
  const itemsToPost = hydrated.filter((h) => slides.find((s) => s.id === h.id));
  try {
    const r = await publishItems(itemsToPost);
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
    console.error(`[publish] FALHA tipo=${type}: ${e.message}`);
    markError(queue, itemsToPost.map((it) => it.id), e.message, new Date().toISOString());
    return { type, attempted: itemsToPost.length, succeeded: 0, error: e.message };
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
    for (const batch of failed) {
      const err = (batch.error || "erro desconhecido")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      lines.push(`<b>tipo: ${batch.type}</b> — ${batch.attempted} item(s) tentado(s)`);
      lines.push(`<code>${err}</code>`);
      lines.push("");
    }
    const tokenError = failed.some((r) => /blocked|token|expired|oauth/i.test(r.error || ""));
    if (tokenError) {
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

  const queue = await readQueue();
  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  const indexById = new Map((indexDoc.items || []).map((x) => [x.id, x]));

  console.log(`[publish] queue: ${queue.items.length} items totais, ${queue.items.filter((q) => !q.postedAt).length} pendentes, postCount=${queue.postCount}`);

  // cor da tarja desta rodada (cicla a cada 3 posts publicados)
  const tarjaColor = getCurrentTarjaColor(queue.postCount);
  console.log(`[publish] cor da tarja: ${tarjaColor} (ciclo de ${POSTS_PER_COLOR} posts)`);

  const results = [];
  const types = ["regular", "spotlight"];
  let batchCount = 0;
  for (const t of types) {
    if (batchCount >= MAX_BATCHES) break;
    const r = await processBatch(t, queue, indexById, nowIso, tarjaColor);
    if (r) {
      results.push(r);
      batchCount++;
      // 1 batch sucesso = 1 post real no IG = incrementa postCount
      if (r.succeeded > 0 && r.postId) {
        queue.postCount = (queue.postCount || 0) + 1;
      }
    }
  }

  // housekeeping: limpa postados muito antigos
  const pruned = pruneOldPosted(queue, nowIso, 30);
  if (pruned > 0) console.log(`[publish] prune: ${pruned} postados antigos removidos`);

  await writeQueue(queue);
  await commitAndPush(
    ["media/news/_publish-queue.json"],
    `publish-ig: atualiza fila (${results.map((r) => `${r.type}:${r.succeeded}/${r.attempted}`).join(" ")}) ${nowIso.slice(0, 16)}Z`,
  );

  if (!DRY) await notifyTelegram(results);

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
