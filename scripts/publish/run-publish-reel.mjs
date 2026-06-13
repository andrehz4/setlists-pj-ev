// Orquestrador do REEL SEMANAL do IG @smufdpj. Roda 1x por semana
// (publish-reel.yml, domingo 12 UTC = 09:00 BRT). Fluxo:
//   1. seleciona as noticias dos ultimos 7 dias (reel-select, formato por cena)
//   2. casa trechos de clipe do acervo com as cenas cineticas (reel-clips)
//   3. trilha do dia (story-track) + cor do ciclo (queue.postCount)
//   4. renderiza MP4 1080x1920 por segmentos (reel-video, MOTION-SPEC)
//   5. commita + push MP4 pra raw.githubusercontent servir
//   6. publica via Graph API (publishReel: caption + share_to_feed + thumb_offset)
//   7. registra em _reel-log.json (idempotencia: 1 reel por semana ISO)
//
// Flags: --dry-run (gera MP4, nao publica/commita) | --no-git | --force

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { selectReelItems } from "./reel-select.mjs";
import { loadClips, pickClipFor, weekSeed } from "./reel-clips.mjs";
import { pickTrackForDate } from "./story-track.mjs";
import { buildReelVideo, buildScenePlan, thumbOffsetMsFor } from "./reel-video.mjs";
import { readQueue } from "./queue.mjs";
import { publishReel, buildReelCaption } from "./instagram.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { isoWeekKey, weekRangeLabel } from "./reel-week.mjs";
import { writeStepSummary } from "../news/_summary.mjs";

const REELS_DIR = path.resolve("media/news/instagram-reels");
const LOG_PATH = path.join(REELS_DIR, "_reel-log.json");
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";
const MIN_ITEMS = 3;

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const FORCE = args.includes("--force");

function brtDate(now = new Date()) {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

function git(gArgs) {
  const r = spawnSync("git", gArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${gArgs.join(" ")} falhou: ${r.stderr || r.stdout}`);
  return r.stdout;
}
function gitTry(gArgs) {
  const r = spawnSync("git", gArgs, { encoding: "utf8" });
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
    const doc = JSON.parse(await fs.readFile(LOG_PATH, "utf8"));
    return Array.isArray(doc.entries) ? doc : { entries: [] };
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
  const weekKey = isoWeekKey(brt);
  console.log(`[reel] run em ${now.toISOString()} (semana ${weekKey}) dry=${DRY} no-git=${NO_GIT} force=${FORCE}`);

  // 0. idempotencia: ja postou nesta semana ISO?
  const log = await readLog();
  const already = log.entries.find((e) => e.weekKey === weekKey && e.postId);
  if (already && !FORCE) {
    console.log(`[reel] ja postado na semana ${weekKey} (postId=${already.postId}), skip. use --force pra republicar.`);
    return;
  }

  // 1. noticias da semana
  const items = await selectReelItems({ now: now.getTime(), days: 7, max: 8, min: MIN_ITEMS });
  if (items.length < MIN_ITEMS) {
    console.log(`[reel] so ${items.length} noticias em 7d (minimo ${MIN_ITEMS}), skip`);
    return;
  }
  console.log(`[reel] ${items.length} items:`);
  items.forEach((it, i) => console.log(`  ${i + 1}. [${it.format}${it.hasImg ? "" : " sem-foto"}] ${it.id} - ${(it.title_pt || "").slice(0, 60)}`));

  // 2. clipes do acervo pras cenas de fundo de video
  const clips = await loadClips();
  const { scenes } = buildScenePlan(items);
  const clipForScene = new Map();
  const used = new Set();
  const seed = weekSeed(weekKey);
  scenes.forEach((scene, si) => {
    if (scene.kind !== "coldopen" && scene.kind !== "kinetic") return;
    const item = scene.item || items[0];
    const clip = pickClipFor(item, clips, { used, seed, slot: si });
    if (clip) clipForScene.set(si, clip.path);
  });
  console.log(`[reel] acervo: ${clips.length} clipes, ${clipForScene.size} cenas com clipe real`);

  // 3. trilha + cor do ciclo
  const track = await pickTrackForDate(brt);
  const queue = await readQueue();
  const accent = getCurrentCycleColor(queue.postCount);
  const rangeLabel = weekRangeLabel(brt);
  console.log(`[reel] trilha: ${track.name} | accent: ${accent} | semana: ${rangeLabel}`);

  // 4. renderiza
  const outPath = path.join(REELS_DIR, `${weekKey}.mp4`);
  const r = await buildReelVideo({ items, trackPath: track.path, accent, rangeLabel, outPath, clipForScene });
  await fs.rm(r.tmpDir, { recursive: true, force: true });
  console.log(`[reel] MP4 gerado: ${outPath} (${r.duration.toFixed(1)}s, ${r.scenes} cenas)`);

  // 5. commit pro raw servir
  await commitAndPush(["media/news/instagram-reels/"],
    `publish-reel: ${weekKey} (${items.length} manchetes, trilha ${track.name})`);

  if (DRY) {
    console.log(`[reel] DRY: video pronto, pulando chamada IG`);
    return;
  }
  await new Promise((res) => setTimeout(res, 5000));

  // 6. publica
  const videoUrl = `${REPO_PUBLIC_BASE}/media/news/instagram-reels/${weekKey}.mp4`;
  const caption = buildReelCaption(items, { weekLabel: rangeLabel });
  console.log(`[reel] publishing video_url=${videoUrl} (caption ${caption.length} chars)`);
  let postId, containerId, recovered;
  try {
    const pub = await publishReel({ videoUrl, caption, shareToFeed: true, thumbOffsetMs: thumbOffsetMsFor() });
    postId = pub.postId;
    containerId = pub.containerId;
    recovered = pub.recovered;
    console.log(`[reel] OK postId=${postId} containerId=${containerId}${recovered ? " (recuperado de falso-erro)" : ""}`);
  } catch (e) {
    console.error(`[reel] FALHA: ${e.message}`);
    log.entries.push({
      weekKey, runAt: now.toISOString(), items: items.map((it) => it.id),
      track: track.name, accent, error: e.message,
    });
    await writeLog(log);
    await commitAndPush(["media/news/instagram-reels/_reel-log.json"], `publish-reel: log falha ${weekKey}`);
    process.exit(1);
  }

  // 7. log + telegram + summary
  log.entries.push({
    weekKey, runAt: now.toISOString(), items: items.map((it) => it.id),
    track: track.name, accent, postId, containerId, videoUrl,
    clipsUsed: [...clipForScene.values()].map((p) => path.basename(p)),
  });
  if (log.entries.length > 60) log.entries = log.entries.slice(-60);
  await writeLog(log);
  await commitAndPush(["media/news/instagram-reels/_reel-log.json"], `publish-reel: log sucesso ${weekKey} postId=${postId}`);

  await notifyTelegram({ items, postId, track, weekKey, rangeLabel });
  await writeStepSummary({
    title: "Publish Instagram Reel",
    meta: { dry: DRY, semana: weekKey, trilha: track.name, accent, clipes: clipForScene.size },
    stats: { manchetes: items.length, postId: postId || "n/a" },
    curated: items.map((it) => ({
      title_pt: it.title_pt || "",
      sourceLabel: it.format,
      url: `https://setlists-pj-ev.pages.dev/n/${it.id}`,
    })),
  });
  console.log(`[reel] FIM`);
}

async function notifyTelegram({ items, postId, track, weekKey, rangeLabel }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const lines = [];
  lines.push(`🎞 <b>Reel semanal publicado (${weekKey})</b>`);
  lines.push(`<i>postId: <code>${postId}</code> · trilha: ${track.name} · ${rangeLabel}</i>`);
  lines.push("");
  for (let i = 0; i < items.length; i++) {
    const titulo = (items[i].title_pt || "(sem titulo)")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    lines.push(`${i + 1}. <b>${titulo}</b>`);
    lines.push(`   ↳ https://setlists-pj-ev.pages.dev/n/${items[i].id}`);
  }
  const text = lines.join("\n");
  const truncated = text.length > 3900 ? text.slice(0, 3900) + "\n\n(truncado)" : text;
  try {
    const params = new URLSearchParams({ chat_id: chatId, parse_mode: "HTML", disable_web_page_preview: "true", text: truncated });
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await res.json();
    if (!json.ok) console.warn("[reel] telegram falhou:", json);
    else console.log("[reel] telegram notif enviada");
  } catch (e) {
    console.warn("[reel] telegram erro:", e.message);
  }
}

main().catch((e) => {
  console.error("[reel] FATAL:", e);
  process.exit(1);
});
