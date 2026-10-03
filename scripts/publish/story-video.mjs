// Gerador do MP4 do story diário (1080x1920, 30 fps), animado quadro a quadro.
//   1. Um fundo por card (foto + gradiente), reaproveitado em todos os quadros daquele card.
//   2. Cada quadro é um PNG calculado pelo tempo (manchete em máquina de escrever, tarja que pula).
//   3. ffmpeg junta a sequência e mixa a trilha (loudnorm -16 LUFS, fade in/out).
// Linha do tempo: abertura (3 s, ou o tempo da narração) + 3,5 s por notícia (até 5) + final 1,5 s.
// Abertura e final vêm do estilo ativo (story-styles/, env STORY_STYLE). Peças em scripts/publish/story/.
import "./fontconfig-boot.mjs"; // fontconfig ANTES do sharp (side-effect)
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import sharp from "sharp";
import { pickStyle, DEFAULT_STYLE } from "./story-styles/index.mjs";
import { getEditionNumber } from "./edition.mjs";
import { naRaiz } from "../config.mjs";
import { FPS, T_INTRO_END, T_CARD_DUR, T_OUTRO_DUR, buildIntroState, resolveSegment } from "./story/base.mjs";
import { loadBadgeAnimated } from "./story/badge.mjs";
import { buildCardSvg, prepareCardBg } from "./story/card.mjs";

export { loadBadgeAnimated };

const STORY_STYLE = process.env.STORY_STYLE || process.env.INTRO_STYLE || DEFAULT_STYLE;
const activeStyle = pickStyle(STORY_STYLE);

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-2000)}`))));
  });
}

// introDur/outroDur (opcionais): vêm da narração (scripts/publish/narracao/story.mjs).
export async function buildStoryVideo({ items, trackPath, tarjaColor, date = new Date(), outPath, tmpDir, concurrency = 8, introDur = T_INTRO_END, outroDur = T_OUTRO_DUR } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("buildStoryVideo: items vazio");
  if (items.length > 5) items = items.slice(0, 5);
  if (!trackPath) throw new Error("buildStoryVideo: trackPath obrigatorio");

  const totalS = introDur + items.length * T_CARD_DUR + outroDur;
  const totalFrames = Math.round(totalS * FPS);
  tmpDir = tmpDir || await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-story-"));
  await fs.mkdir(tmpDir, { recursive: true });

  const badgeAnim = await loadBadgeAnimated();
  const edition = await getEditionNumber(date);
  const introState = buildIntroState({ date, itemCount: items.length, tarjaColor, badgeAnim, edition });
  console.log(`[story-video] style: ${STORY_STYLE} | edicao Nº ${introState.edition} | ${introState.dayOfWeekShort}`);
  console.log(`[story-video] preparando ${items.length} BGs...`);
  const bgBuffers = await Promise.all(items.map(prepareCardBg));
  console.log(`[story-video] ${items.length} card(s), ${totalS.toFixed(1)}s, renderizando ${totalFrames} frames @${FPS}fps...`);

  async function renderFrame(idx) {
    const seg = resolveSegment(idx / FPS, items.length, introDur);
    const destPath = path.join(tmpDir, `frame_${String(idx).padStart(5, "0")}.png`);
    if (seg.kind === "card") {
      const svg = buildCardSvg({ tarjaColor, item: items[seg.index], idx: seg.index + 1, total: items.length, tRel: seg.tRel });
      await sharp(bgBuffers[seg.index]).composite([{ input: Buffer.from(svg), blend: "over" }]).png({ compressionLevel: 6 }).toFile(destPath);
      return;
    }
    const montar = seg.kind === "intro" ? activeStyle.intro : activeStyle.outro;
    await sharp(Buffer.from(montar({ tRel: seg.tRel, state: introState }))).png({ compressionLevel: 6 }).toFile(destPath);
  }

  // Quadros em paralelo (concurrency 8 evita estourar descritor de arquivo e memória).
  let next = 0;
  let lastLogged = 0;
  async function worker() {
    while (next < totalFrames) {
      const my = next++;
      await renderFrame(my);
      if (my - lastLogged >= 60) {
        lastLogged = my;
        console.log(`[story-video] frame ${my + 1}/${totalFrames} (${((my + 1) / totalFrames * 100).toFixed(0)}%)`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`[story-video] frames OK`);

  outPath = outPath || naRaiz(`media/news/instagram-stories/${date.toISOString().slice(0, 10)}.mp4`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  console.log(`[story-video] mixando audio + encoding MP4...`);
  await runFfmpeg([
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(tmpDir, "frame_%05d.png"),
    "-i", trackPath,
    "-filter_complex",
    `[1:a]atrim=0:${totalS},afade=t=in:d=0.3,afade=t=out:st=${(totalS - 0.5).toFixed(2)}:d=0.5,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-profile:v", "main", "-level", "4.0",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-shortest",
    outPath,
  ]);
  return { outPath, duration: totalS, tmpDir, frames: totalFrames, outroInicio: introDur + items.length * T_CARD_DUR };
}

// CLI pra teste local: node scripts/publish/story-video.mjs [--keep-tmp]
if (process.argv[1]?.endsWith("story-video.mjs")) {
  const { selectStoryItems } = await import("./story-select.mjs");
  const { pickTrackForDate } = await import("./story-track.mjs");
  const { CYCLE_COLORS } = await import("./color-cycle.mjs");
  const items = await selectStoryItems({ hours: 24, max: 5 });
  if (items.length === 0) {
    console.error("[story-video] nenhuma noticia nas ultimas 24h, abortando");
    process.exit(2);
  }
  const track = await pickTrackForDate();
  const r = await buildStoryVideo({ items, trackPath: track.path, tarjaColor: CYCLE_COLORS[0] });
  console.log("[story-video] OK", { outPath: r.outPath, duration: r.duration, frames: r.frames, items: items.length, track: track.name });
  if (!process.argv.includes("--keep-tmp")) await fs.rm(r.tmpDir, { recursive: true, force: true });
}
