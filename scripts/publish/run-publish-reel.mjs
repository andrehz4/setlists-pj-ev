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

import path from "node:path";
import { spawnSync } from "node:child_process";
import { publicarViaR2 } from "./midia-r2.mjs";
import { selectReelItems } from "./reel-select.mjs";
import { pickTrackForDate } from "./story-track.mjs";
import { thumbOffsetMsFor } from "./reel-video.mjs";
import { montarReel } from "./reel/montar-reel.mjs";
import { readLog, writeLog, espelharNoFacebook, avisarReel } from "./reel/registro.mjs";
import { readQueue } from "./queue.mjs";
import { publishReel, buildReelCaption } from "./instagram.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { isoWeekKey, weekRangeLabel } from "./reel-week.mjs";
import { writeStepSummary } from "../news/_summary.mjs";
import { commitAndPush as commitAndPushGit } from "../lib/git.mjs";
import { naRaiz, linkNoticia } from "../config.mjs";
import { emBRT } from "../lib/brt.mjs";

const REELS_DIR = naRaiz("media/news/instagram-reels");
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";
const MIN_ITEMS = 3;

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const FORCE = args.includes("--force");

// commit + push único do projeto (scripts/lib/git.mjs): aborta rebase que falhou, retry com jitter
const commitAndPush = (paths, message, opts = {}) => commitAndPushGit(paths, message, { dry: NO_GIT || DRY, ...opts });

async function main() {
  const now = new Date();
  const brt = emBRT(now);
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

  // 3. trilha + cor do ciclo
  const track = await pickTrackForDate(brt);
  const queue = await readQueue();
  const accent = getCurrentCycleColor(queue.postCount);
  const rangeLabel = weekRangeLabel(brt);
  console.log(`[reel] trilha: ${track.name} | accent: ${accent} | semana: ${rangeLabel}`);

  // 4. vídeo (clipes, voz, abertura, transições)
  const outPath = path.join(REELS_DIR, `${weekKey}.mp4`);
  const { clipForScene, capaMs, avisoVoz } = await montarReel({ items, track, accent, rangeLabel, weekKey, outPath });

  // Link público do vídeo: R2 (apaga sozinho em 3 dias, não entra no git; ver midia-r2.mjs).
  // Sem R2 ou se falhar: jeito antigo, o MP4 vai no commit (forçado, o .gitignore ignora MP4) e o IG baixa do raw.
  const r2Url = DRY ? null : await publicarViaR2(outPath, `reels/${weekKey}-${Date.now()}.mp4`);
  if (!r2Url && !DRY && !NO_GIT) spawnSync("git", ["add", "-f", outPath], { encoding: "utf8" });

  // 5. commit pro raw servir
  await commitAndPush(["media/news/instagram-reels/"],
    `publish-reel: ${weekKey} (${items.length} manchetes, trilha ${track.name})`);

  if (DRY) {
    console.log(`[reel] DRY: video pronto, pulando chamada IG`);
    return;
  }
  await new Promise((res) => setTimeout(res, 5000));

  // 6. publica
  const videoUrl = r2Url || `${REPO_PUBLIC_BASE}/media/news/instagram-reels/${weekKey}.mp4`;
  const caption = buildReelCaption(items, { weekLabel: rangeLabel });
  console.log(`[reel] publishing video_url=${videoUrl} (caption ${caption.length} chars)`);
  let postId, containerId, recovered;
  try {
    const pub = await publishReel({ videoUrl, caption, shareToFeed: true, thumbOffsetMs: capaMs ?? thumbOffsetMsFor() });
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

  // 6b. Facebook Pages (reel de vídeo, mesma legenda), best-effort
  const fbPostId = await espelharNoFacebook(videoUrl, caption);

  // 7. log + telegram + summary
  log.entries.push({
    weekKey, runAt: now.toISOString(), items: items.map((it) => it.id),
    track: track.name, accent, postId, containerId, videoUrl, fbPostId,
    clipsUsed: [...clipForScene.values()].map((p) => path.basename(p)),
  });
  await writeLog(log);
  await commitAndPush(["media/news/instagram-reels/_reel-log.json"], `publish-reel: log sucesso ${weekKey} postId=${postId}`);

  await avisarReel({ items, postId, track, weekKey, rangeLabel, avisoVoz });
  await writeStepSummary({
    title: "Publish Instagram Reel",
    meta: { dry: DRY, semana: weekKey, trilha: track.name, accent, clipes: clipForScene.size },
    stats: { manchetes: items.length, postId: postId || "n/a" },
    curated: items.map((it) => ({
      title_pt: it.title_pt || "",
      sourceLabel: it.format,
      url: linkNoticia(it.id),
    })),
  });
  console.log(`[reel] FIM`);
}

main().catch((e) => {
  console.error("[reel] FATAL:", e);
  process.exit(1);
});
