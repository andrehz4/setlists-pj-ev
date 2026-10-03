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

import path from "node:path";
import { spawnSync } from "node:child_process";
import { publicarViaR2 } from "./midia-r2.mjs";
import { selectStoryItems } from "./story-select.mjs";
import { pickTrackForDate } from "./story-track.mjs";
import { readQueue } from "./queue.mjs";
import { publishStory } from "./instagram.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { writeStepSummary } from "../news/_summary.mjs";
import { commitAndPush as commitAndPushGit } from "../lib/git.mjs";
import { naRaiz, linkNoticia } from "../config.mjs";
import { emBRT } from "../lib/brt.mjs";
import { montarStory } from "./story/montar.mjs";
import { notifyTelegramStory } from "./story/aviso.mjs";
import { readLog, writeLog, espelharNoFacebook } from "./story/registro.mjs";

const STORIES_DIR = naRaiz("media/news/instagram-stories");
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const FORCE = args.includes("--force");

// commit + push único do projeto (scripts/lib/git.mjs): aborta rebase que falhou, retry com jitter
const commitAndPush = (paths, message, opts = {}) => commitAndPushGit(paths, message, { dry: NO_GIT || DRY, ...opts });

async function main() {
  const now = new Date();
  const brt = emBRT(now); // data do story em Brasília (carimbo e nome do arquivo)
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

  // 3. cor do ciclo (mesma do carrossel/capa: fonte unica color-cycle.mjs)
  const queue = await readQueue();
  const tarjaColor = getCurrentCycleColor(queue.postCount);
  console.log(`[story] cor do ciclo: ${tarjaColor} (postCount=${queue.postCount})`);

  // 4. vídeo (voz, render, padrão do reel, mixagem)
  const outPath = path.join(STORIES_DIR, `${dateKey}.mp4`);
  const { avisoVoz } = await montarStory({ items, track, tarjaColor, brt, outPath });

  // Link público do vídeo: R2 (apaga sozinho em 3 dias, não entra no git; ver midia-r2.mjs).
  // Sem R2 ou se falhar: jeito antigo, o MP4 vai no commit (forçado, o .gitignore ignora MP4) e o IG baixa do raw.
  const r2Url = DRY ? null : await publicarViaR2(outPath, `stories/${dateKey}-${Date.now()}.mp4`);
  if (!r2Url && !DRY && !NO_GIT) spawnSync("git", ["add", "-f", outPath], { encoding: "utf8" });

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
  const videoUrl = r2Url || `${REPO_PUBLIC_BASE}/media/news/instagram-stories/${dateKey}.mp4`;
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

  // 6b. Facebook Pages (story de vídeo), best-effort
  const fbPostId = await espelharNoFacebook(videoUrl);

  // 7. registra log + push
  log.entries.push({
    dateKey, runAt: now.toISOString(),
    items: items.map((it) => it.id),
    track: track.name, tarjaColor,
    postId, containerId, videoUrl, fbPostId,
  });
  await writeLog(log);
  await commitAndPush(["media/news/instagram-stories/_story-log.json"],
    `publish-story: log sucesso ${dateKey} postId=${postId}`);

  // 8. notif Telegram (so se sucesso real)
  await notifyTelegramStory({ items, postId, track, dateKey, avisoVoz });

  await writeStepSummary({
    title: "Publish Instagram Story",
    meta: { dry: DRY, data: dateKey, trilha: track.name, tarja: tarjaColor },
    stats: { "manchetes": items.length, "postId": postId || "n/a" },
    curated: items.map((it) => ({
      title_pt: it.title_pt || it.title,
      sourceLabel: it.kind || "regular",
      url: linkNoticia(it.id),
    })),
  });

  console.log(`[story] FIM`);
}

main().catch((e) => {
  console.error("[story] FATAL:", e);
  process.exit(1);
});
