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
import { publicarViaR2 } from "./midia-r2.mjs";
import { selectStoryItems } from "./story-select.mjs";
import { pickTrackForDate } from "./story-track.mjs";
import { buildStoryVideo } from "./story-video.mjs";
import { prepararNarracaoStory, mixarStory, gravarDias } from "./narracao/story.mjs";
import { saldo } from "./narracao/elevenlabs.mjs";
import { aplicarPadraoReel } from "./story/padrao-reel.mjs";
import { readQueue } from "./queue.mjs";
import { publishStory } from "./instagram.mjs";
import { publishVideoStory } from "./facebook.mjs";
import { getCurrentCycleColor } from "./color-cycle.mjs";
import { writeStepSummary } from "../news/_summary.mjs";
import { lerEstado, comLista } from "../lib/estado.mjs";
import { commitAndPush as commitAndPushGit } from "../lib/git.mjs";
import { naRaiz, linkNoticia } from "../config.mjs";

const STORIES_DIR = naRaiz("media/news/instagram-stories");
const LOG_PATH = path.join(STORIES_DIR, "_story-log.json");
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Ciclo de cor: fonte unica em ./color-cycle.mjs (mesma do carrossel/capa).

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

// commit + push único do projeto (scripts/lib/git.mjs): aborta rebase que falhou, retry com jitter
const commitAndPush = (paths, message, opts = {}) => commitAndPushGit(paths, message, { dry: NO_GIT || DRY, ...opts });

async function readLog() {
  // Corrompido derruba: log vazio em silêncio quebrava a idempotência (post duplicado)
  return lerEstado(LOG_PATH, { entries: [] }, { valida: comLista("entries") });
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

  // 3. cor do ciclo (mesma do carrossel/capa: fonte unica color-cycle.mjs)
  const queue = await readQueue();
  const tarjaColor = getCurrentCycleColor(queue.postCount);
  console.log(`[story] cor do ciclo: ${tarjaColor} (postCount=${queue.postCount})`);

  // 4. voz (opcional, STORY_NARRACAO=1): dia 1 grava o mês seguinte; depois a fala de hoje
  if (process.env.STORY_NARRACAO === "1" && process.env.ELEVENLABS_API_KEY && brt.getUTCDate() === 1) {
    try {
      const conta = await saldo({ apiKey: process.env.ELEVENLABS_API_KEY });
      // só grava adiantado se sobrar folga pro reel da semana (~3 mil créditos)
      if (!conta || conta.restante > 5000) console.log(`[story] gravou ${await gravarDias(brt, 31, { apiKey: process.env.ELEVENLABS_API_KEY })} caracteres adiantados`);
      else console.log(`[story] gravação adiantada pulada: restam ${conta.restante} créditos`);
    } catch (e) { console.warn(`[story] gravação adiantada falhou (segue): ${e.message}`); }
  }
  const narr = await prepararNarracaoStory(brt);
  if (narr?.aviso) console.log(`[story] ${narr.aviso}`);

  // 5. renderiza video
  const outPath = path.join(STORIES_DIR, `${dateKey}.mp4`);
  const video = await buildStoryVideo({
    items,
    trackPath: track.path,
    tarjaColor,
    date: brt,
    outPath,
    introDur: narr?.introDur,
    outroDur: narr?.outroDur,
  });
  const { duration } = video;
  // padrão do reel (STORY_TRANSICOES=1): abertura com clipe + transições; falha = story como antes
  if (process.env.STORY_TRANSICOES === "1") {
    const introDur = narr?.introDur ?? 3.0, cards = Math.min(items.length, 5);
    const r = await aplicarPadraoReel(outPath, { introDur, cards, cardDur: (video.outroInicio - introDur) / cards,
      outroInicio: video.outroInicio, date: brt, accent: tarjaColor, tmpDir: video.tmpDir });
    console.log(`[story] padrão do reel: abertura com clipe ${r.abertura ? "sim" : "não"}, ${r.transicoes} transições`);
  }
  let avisoVoz = narr?.aviso || "";
  if (narr?.falas) {
    const semVoz = path.join(video.tmpDir, "sem-voz.mp4");
    try {
      await fs.rename(outPath, semVoz);
      await mixarStory(semVoz, outPath, { falas: narr.falas, outroInicio: video.outroInicio });
    } catch (e) {
      console.warn(`[story] mixagem da voz falhou, segue só com música: ${e.message}`);
      await fs.rename(semVoz, outPath).catch(() => {});
      avisoVoz = `story saiu SEM voz: a mixagem falhou`;
    }
  }
  console.log(`[story] MP4 gerado: ${outPath} (${duration.toFixed(2)}s)`);

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

  // 6b. Facebook Pages (story de video), best-effort: o IG ja publicou; falha
  //     no FB so loga. So com a flag PUBLISH_FB=1 + secrets presentes.
  let fbPostId = null;
  if (process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN) {
    try {
      const fb = await publishVideoStory({ videoUrl });
      fbPostId = fb.postId;
      console.log(`[story] FB OK fbPostId=${fbPostId}`);
    } catch (e) {
      const d = typeof e.toDetailString === "function" ? e.toDetailString() : e.message;
      console.error(`[story] FB FALHA (IG ja publicou, seguindo): ${d}`);
    }
  }

  // 7. registra log + push
  log.entries.push({
    dateKey, runAt: now.toISOString(),
    items: items.map((it) => it.id),
    track: track.name, tarjaColor,
    postId, containerId, videoUrl, fbPostId,
  });
  // mantem so ultimos 60 entries
  if (log.entries.length > 60) log.entries = log.entries.slice(-60);
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

async function notifyTelegramStory({ items, postId, track, dateKey, avisoVoz = "" }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const brtNow = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

  const lines = [];
  lines.push(`🎬 <b>Story publicado, ${brtNow} BRT</b>`);
  lines.push(`<i>postId: <code>${postId}</code> · trilha: ${track.name}</i>`);
  if (avisoVoz) lines.push(`🎙 ${avisoVoz.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}`);
  lines.push("");
  lines.push(`<b>${items.length} ${items.length === 1 ? "manchete" : "manchetes"} do dia ${dateKey}</b>`);
  lines.push("");
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const titulo = (it.title_pt || it.title || "(sem titulo)")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    lines.push(`${i + 1}. <b>${titulo}</b>`);
    lines.push(`   ↳ ${linkNoticia(it.id)}`);
  }

  const text = lines.join("\n");
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
    if (!json.ok) console.warn("[story] telegram falhou:", json);
    else console.log("[story] telegram notif enviada");
  } catch (e) {
    console.warn("[story] telegram erro:", e.message);
  }
}

main().catch((e) => {
  console.error("[story] FATAL:", e);
  process.exit(1);
});
