import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { W, H, FPS, clamp01, linear, easeOutQuart } from "./base.mjs";
import { coldOpenSvg, outroSvg } from "./cenas-abertura-final.mjs";
import { kineticSvg, cardSvg, paperSvg } from "./cenas-blocos.mjs";
import { zoomWindow } from "./midia.mjs";

// ============ orquestracao ============

// Render paralelo de frames de uma cena (mesma estrategia de pool do story).
export async function renderScene({ scene, total, accent, ctx, dir, concurrency = 8 }) {
  const frames = Math.round(scene.dur * FPS);
  await fs.mkdir(dir, { recursive: true });

  async function renderFrame(idx) {
    const t = idx / FPS;
    const dest = path.join(dir, `f_${String(idx).padStart(5, "0")}.png`);
    let svg;
    if (scene.kind === "coldopen") {
      svg = coldOpenSvg(t, {
        accent, itemCount: total, rangeLabel: ctx.rangeLabel, dark: 0.6,
        letterWidths: ctx.letterWidths, tarjaTextW: ctx.tarjaTextW, chipTextW: ctx.chipTextW,
        showChip: ctx.mode === "overlay" || ctx.ghost === true, dur: scene.dur,
      });
    } else if (scene.kind === "outro") {
      const bf = ctx.badge?.frames?.length
        ? ctx.badge.frames[Math.floor(t * (ctx.badge.fps || 1)) % ctx.badge.frames.length]
        : null;
      svg = outroSvg(t, { accent, badgeFrame: bf, siteTextW: ctx.siteTextW });
    } else if (scene.kind === "paper") {
      svg = paperSvg(t, { item: scene.item, n: scene.n, total, accent, photoDataUri: ctx.photoDataUri, layout: ctx.layout, tarjaTextW: ctx.tarjaTextW, dur: scene.dur });
    } else if (scene.kind === "card") {
      svg = cardSvg(t, { item: scene.item, n: scene.n, total, accent, layout: ctx.layout, tarjaTextW: ctx.tarjaTextW, dur: scene.dur });
    } else {
      svg = kineticSvg(t, {
        item: scene.item, n: scene.n, total, accent, ghost: ctx.ghost === true,
        layout: ctx.layout, tarjaTextW: ctx.tarjaTextW, chipTextW: ctx.chipTextW,
        showChip: ctx.mode === "overlay" || ctx.ghost === true, dur: scene.dur,
      });
    }

    if (ctx.mode === "overlay" || ctx.mode === "flat") {
      // overlay: PNG RGBA puro (ffmpeg compoe sobre o clipe); flat: SVG opaco
      await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toFile(dest);
      return;
    }
    // mode photo: Ken Burns por frame + (card) wipe de entrada
    const scale = ctx.zoomFrom + (ctx.zoomTo - ctx.zoomFrom) * linear(t / scene.dur);
    const win = zoomWindow(ctx.zoom, scale);
    let pipe = sharp(ctx.zoom.base).extract(win).resize(W, H);
    const composites = [];
    if (scene.kind === "card") {
      const wipe = easeOutQuart(clamp01(t / 0.45));
      if (wipe < 1) {
        const wipeW = Math.max(2, Math.round(W * wipe));
        const photoStrip = await pipe.extract({ left: 0, top: 0, width: wipeW, height: H }).toBuffer();
        pipe = sharp({ create: { width: W, height: H, channels: 3, background: { r: 10, g: 9, b: 8 } } });
        composites.push({ input: photoStrip, left: 0, top: 0 });
      }
    }
    composites.push({ input: Buffer.from(svg), blend: "over" });
    await pipe.composite(composites).png({ compressionLevel: 6 }).toFile(dest);
  }

  let next = 0;
  async function worker() {
    while (next < frames) {
      const my = next++;
      await renderFrame(my);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return frames;
}
