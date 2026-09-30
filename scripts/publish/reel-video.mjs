// Gerador do REEL SEMANAL 1080x1920 (MP4) do @smufdpj. Implementa o
// MOTION-SPEC aprovado no Claude Design (design-handoff/retorno/movie/
// project/entrega/MOTION-SPEC.md): cold open 3.0s + N blocos de 4.5s
// (cinetico | card | papel) + outro 2.5s, cortes secos, 30fps.
//
// Arquitetura por SEGMENTO (diferente do story, que e uma sequencia unica
// de PNGs): cada cena vira um MP4 proprio e o ffmpeg concatena (-c copy).
// Isso permite cenas com fundo de CLIPE REAL (trecho mudo do acervo
// media/reels-clips/): nessas, os frames sao overlays PNG com ALPHA que o
// ffmpeg compoe sobre o video (scale/crop 9:16 + overlay). Cenas sem clipe
// degradam pra foto com zoom (Ken Burns) ou fundo fantasma "CLIPE", iguais
// ao prototipo aprovado.
//
// Regra de ouro herdada do spec: toda animacao e funcao deterministica do
// tempo local da cena. Nada de random, estado acumulado ou filtros.

// Desde 2026-09-30 o código vive em scripts/publish/reel/; aqui só montagem do MP4 e API pública.

import "./fontconfig-boot.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { loadBadgeAnimated } from "./story-video.mjs";
import { FPS, BRAND, TAG_LABELS, measureText, layoutWords, F_ANTON, F_INTER_SB, F_INTER_XB } from "./reel/base.mjs";
import { buildScenePlan } from "./reel/plano.mjs";
import { fetchImageBuffer, prepareZoomBase, runFfmpeg, encodePngSegment, encodeClipSegment } from "./reel/midia.mjs";
import { renderScene } from "./reel/render.mjs";

export { COLD_DUR, BLOCK_DUR, OUTRO_DUR, measureText, wrapWords, layoutWords } from "./reel/base.mjs";
export { coldOpenSvg, outroSvg } from "./reel/cenas-abertura-final.mjs";
export { kineticSvg, cardSvg, paperSvg } from "./reel/cenas-blocos.mjs";
export { buildScenePlan, thumbOffsetMsFor } from "./reel/plano.mjs";

// Monta o MP4 final. items = saida do reel-select; clipFor = mapa opcional
// sceneIndex -> caminho de clipe (decidido pelo orquestrador via reel-clips).
export async function buildReelVideo({
  items, trackPath, accent, rangeLabel, outPath,
  clipForScene = new Map(), tmpDir, concurrency = 8, sceneDurs = null,
} = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("buildReelVideo: items vazio");
  if (!trackPath) throw new Error("buildReelVideo: trackPath obrigatorio");

  const { scenes, totalS, totalFrames } = buildScenePlan(items, sceneDurs);
  const total = items.length;
  tmpDir = tmpDir || await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-reel-"));
  await fs.mkdir(tmpDir, { recursive: true });

  const badge = await loadBadgeAnimated();
  console.log(`[reel-video] ${scenes.length} cenas, ${totalS.toFixed(1)}s, ${totalFrames} frames @${FPS}fps, accent=${accent}`);

  const segPaths = [];
  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si];
    const dir = path.join(tmpDir, `scene_${String(si).padStart(2, "0")}`);
    const segPath = path.join(tmpDir, `seg_${String(si).padStart(2, "0")}.mp4`);
    const clipPath = clipForScene.get(si) || null;

    const ctx = { rangeLabel, badge, mode: "flat" };

    // medidas reais de texto (uma vez por cena; cache cobre repeticoes)
    ctx.chipTextW = await measureText("CLIPE · MUDO", { size: 24, family: F_INTER_SB, weight: 600, letterSpacing: 3.4 });
    if (scene.item) {
      const tagLabel = TAG_LABELS[scene.item.tags?.[0]] || String(scene.item.tags?.[0] || "NOTÍCIA").toUpperCase();
      const tagSize = scene.kind === "card" ? 28 : 30;
      ctx.tarjaTextW = await measureText(tagLabel, { size: tagSize, family: F_INTER_XB, weight: 800, letterSpacing: tagSize * 0.16 });
      const title = scene.item.title_pt || "";
      if (scene.kind === "kinetic") {
        ctx.layout = await layoutWords(title, title.length > 60 ? 94 : 112, 920);
      } else if (scene.kind === "paper") {
        ctx.layout = await layoutWords(title, title.length > 56 ? 88 : 100, 920);
      } else if (scene.kind === "card") {
        ctx.layout = await layoutWords(title, title.length > 60 ? 66 : 78, 880);
      }
    } else if (scene.kind === "coldopen") {
      ctx.letterWidths = [];
      for (const L of "SMUFDPJ") ctx.letterWidths.push(await measureText(L, { size: 230, family: F_ANTON }));
      ctx.tarjaTextW = await measureText("AS NOTÍCIAS DA SEMANA", { size: 32, family: F_INTER_XB, weight: 800, letterSpacing: 32 * 0.16 });
    } else if (scene.kind === "outro") {
      ctx.siteTextW = await measureText(BRAND.site.toUpperCase(), { size: 30, family: F_INTER_XB, weight: 800, letterSpacing: 30 * 0.16 });
    }

    if (scene.kind === "coldopen" || scene.kind === "kinetic") {
      if (clipPath) {
        ctx.mode = "overlay";
      } else {
        const photoBuf = scene.kind === "coldopen"
          ? await fetchImageBuffer(items.find((it) => it.hasImg) || items[0])
          : (scene.item.hasImg !== false ? await fetchImageBuffer(scene.item) : null);
        if (photoBuf) {
          ctx.mode = "photo";
          ctx.zoomFrom = scene.kind === "coldopen" ? 1.30 : 1.06;
          ctx.zoomTo = scene.kind === "coldopen" ? 1.14 : 1.18;
          ctx.zoom = await prepareZoomBase(photoBuf, Math.max(ctx.zoomFrom, ctx.zoomTo));
        } else {
          ctx.mode = "flat";
          ctx.ghost = true;
        }
      }
    } else if (scene.kind === "card") {
      const photoBuf = await fetchImageBuffer(scene.item);
      if (!photoBuf) throw new Error(`buildReelVideo: card sem foto (${scene.item?.id})`);
      ctx.mode = "photo";
      ctx.zoomFrom = 1.06;
      ctx.zoomTo = 1.15;
      ctx.zoom = await prepareZoomBase(photoBuf, 1.15);
    } else if (scene.kind === "paper") {
      const photoBuf = await fetchImageBuffer(scene.item);
      if (photoBuf) {
        const snap = await sharp(photoBuf, { failOn: "none" })
          .resize(708, 528, { fit: "cover", position: "attention" })
          .jpeg({ quality: 82 })
          .toBuffer();
        ctx.photoDataUri = `data:image/jpeg;base64,${snap.toString("base64")}`;
      }
    }

    console.log(`[reel-video] cena ${si + 1}/${scenes.length} (${scene.kind}${clipPath ? ", clipe " + path.basename(clipPath) : ", " + ctx.mode})...`);
    await renderScene({ scene, total, accent, ctx, dir, concurrency });

    if (ctx.mode === "overlay") {
      await encodeClipSegment({ clipPath, overlayDir: dir, dur: scene.dur, outPath: segPath });
    } else {
      await encodePngSegment({ framesDir: dir, outPath: segPath });
    }
    segPaths.push(segPath);
    await fs.rm(dir, { recursive: true, force: true }); // libera disco entre cenas
  }

  // concat (corte seco) + trilha
  const listPath = path.join(tmpDir, "concat.txt");
  await fs.writeFile(listPath, segPaths.map((p) => `file '${p.replaceAll("'", "'\\''")}'`).join("\n"));
  const silentPath = path.join(tmpDir, "silent.mp4");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", silentPath]);

  outPath = outPath || path.resolve("media/news/instagram-reels/reel.mp4");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await runFfmpeg([
    "-y", "-i", silentPath, "-i", trackPath,
    "-filter_complex",
    `[1:a]atrim=0:${totalS},afade=t=in:d=0.3,afade=t=out:st=${(totalS - 0.5).toFixed(2)}:d=0.5,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-shortest", "-movflags", "+faststart",
    outPath,
  ]);

  return { outPath, duration: totalS, frames: totalFrames, scenes: scenes.length, sceneList: scenes, tmpDir };
}

