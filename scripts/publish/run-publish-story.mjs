// Orquestrador do story diario do IG @smufdpj. Roda 1x por dia
// via workflow publish-story.yml (cron 12 UTC = 09:00 BRT). Fluxo:
//   1. seleciona ate 5 noticias das ultimas 24h (story-select)
//   2. escolhe trilha do dia (story-track, rotacao mod 5)
//   3. pega cor da tarja do queue.postCount (mesmo ciclo do carrossel)
//   4. renderiza MP4 1080x1920 com sharp+ffmpeg (story-video)
//   5. commita + push MP4 pra raw.githubusercontent servir
//   6. publica via Graph API (publishStory)
//   7. registra em _story-log.json (idempotencia: nao posta 2x no mesmo dia)
//
// Flags:
//   --dry-run    gera MP4 mas nao publica nem commita
//   --no-git     pula commits/push (uso local)
//   --force      ignora _story-log (republica mesmo se ja postou hoje)

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { selectStoryItems } from "./story-select.mjs";
import { pickTrackForDate } from "./story-track.mjs";
import { buildStoryVideo } from "./story-video.mjs";
import { readQueue } from "./queue.mjs";
import { publishStory } from "./instagram.mjs";

const STORIES_DIR = path.resolve("media/news/instagram-stories");
const LOG_PATH = path.join(STORIES_DIR, "_story-log.json");
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Mesmo ciclo do run-publish: vermelho -> preto -> ocre -> azul, 3 posts por cor
const TARJA_COLORS = ["#c12727", "#0a0908", "#a87f2c", "#2a5b9e"];
const POSTS_PER_COLOR = 3;
function tarjaColorFromPostCount(postCount) {
  const idx = Math.floor((postCount || 0) / POSTS_PER_COLOR) % TARJA_COLORS.length;
  return TARJA_COLORS[idx];
}

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const FORCE = args.includes("--force");

// Calcula a "data BRT do story": 9h BRT = 12h UTC. Pro carimbo da
// peca e nome de arquivo, usa fuso BRT (UTC-3). Garante que o story
// publicado de manha cedo BRT mostre a data BRT, nao UTC.
function brtDate(now = new Date()) {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

function git(args, opts = {}) {
  const r = spawnSync("git", args, { encoding: "utf8", ...opts });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falhou: ${r.stderr || r.stdout}`);
  return r.stdout;
}
function gitTry(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return { ok: r.status === 0, out: r.stdout, err: r.stderr };
}

async function commitAndPush(paths, message, retries = 3) {
  if (NO_GIT || DRY) {
    console.log(`[git] skip (dry/no-git): ${message}`);
    return;
  }
  const name = process.env.GIT_AUTHOR_NAME || "github-actions[bot]";
  const email = process.env.GIT_AUTHOR_EMAIL || "41898282+github-actions[bot]@users.noreply.github.com";
  spawnSync("git", ["config", "user.name", name], { encoding: "utf8" });
  spawnSync("git", ["config", "user.email", email], { encoding: "utf8" });
  for (const p of paths) spawnSync("git", ["add", p], { encoding: "utf8" });
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

async function readLog() {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    const doc = JSON.parse(raw);
    if (!Array.isArray(doc.entries)) return { entries: [] };
    return doc;
  } catch {
    return { entries: [] };
  }
}

async function writeLog(log) {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));
}

async function main() {
  const now = new Date();
  const brt = brtDate(now);
  const dateKey = brt.toISOString().slice(0, 10); // YYYY-MM-DD em BRT
  console.log(`[story] run em ${now.toISOString()} (BRT date=${dateKey}) dry=${DRY} no-git=${NO_GIT} force=${FORCE}`);

  // 0. idempotencia: ja postou hoje?
  const log = await readLog();
  const already = log.entries.find((e) => e.dateKey === dateKey && e.postId);
  if (already && !FORCE) {
    console.log(`[story] ja postado em ${dateKey} (postId=${already.postId}), skip. use --force pra republicar.`);
    return;
  }

  // 1. seleciona items
  const items = await selectStoryItems({ now: now.getTime(), hours: 24, max: 5 });
  if (items.length === 0) {
    console.log(`[story] 0 noticias em 24h, skip`);
    return;
  }
  console.log(`[story] items: ${items.length}`);
  items.forEach((it, i) => console.log(`  ${i + 1}. [${it.kind || "regular"}] ${it.id} - ${it.title_pt?.slice(0, 60) || ""}`));

  // 2. trilha do dia
  const track = await pickTrackForDate(brt);
  console.log(`[story] trilha: ${track.name} (cycle ${track.cyclePos + 1}/${track.cycleLen})`);

  // 3. cor da tarja (mesma do carrossel atual)
  const queue = await readQueue();
  const tarjaColor = tarjaColorFromPostCount(queue.postCount);
  console.log(`[story] tarja: ${tarjaColor} (postCount=${queue.postCount})`);

  // 4. renderiza video
  const outPath = path.join(STORIES_DIR, `${dateKey}.mp4`);
  const { duration } = await buildStoryVideo({
    items,
    trackPath: track.path,
    tarjaColor,
    date: brt,
    outPath,
  });
  console.log(`[story] MP4 gerado: ${outPath} (${duration.toFixed(2)}s)`);

  // 5. commita + push pra raw URL servir
  await commitAndPush(
    ["media/news/instagram-stories/"],
    `publish-story: ${dateKey} (${items.length} manchetes, trilha ${track.name})`,
  );

  if (DRY) {
    console.log(`[story] DRY: video pronto, pulando chamada IG`);
    return;
  }

  // pequena espera pra raw indexar
  await new Promise((r) => setTimeout(r, 5000));

  // 6. publica
  const videoUrl = `${REPO_PUBLIC_BASE}/media/news/instagram-stories/${dateKey}.mp4`;
  console.log(`[story] publishing video_url=${videoUrl}`);
  let postId, containerId;
  try {
    const r = await publishStory({ videoUrl });
    postId = r.postId;
    containerId = r.containerId;
    console.log(`[story] OK postId=${postId} containerId=${containerId}`);
  } catch (e) {
    console.error(`[story] FALHA: ${e.message}`);
    // registra falha no log mesmo assim pra debug
    log.entries.push({
      dateKey, runAt: now.toISOString(), items: items.map((it) => it.id),
      track: track.name, tarjaColor, error: e.message,
    });
    await writeLog(log);
    await commitAndPush(["media/news/instagram-stories/_story-log.json"],
      `publish-story: log falha ${dateKey}`);
    process.exit(1);
  }

  // 7. registra log + push
  log.entries.push({
    dateKey, runAt: now.toISOString(),
    items: items.map((it) => it.id),
    track: track.name, tarjaColor,
    postId, containerId, videoUrl,
  });
  // mantem so ultimos 60 entries
  if (log.entries.length > 60) log.entries = log.entries.slice(-60);
  await writeLog(log);
  await commitAndPush(["media/news/instagram-stories/_story-log.json"],
    `publish-story: log sucesso ${dateKey} postId=${postId}`);

  console.log(`[story] FIM`);
}

main().catch((e) => {
  console.error("[story] FATAL:", e);
  process.exit(1);
});
