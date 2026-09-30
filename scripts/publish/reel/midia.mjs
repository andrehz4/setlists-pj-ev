// Fotos de fundo (com fallback de banda), base do Ken Burns e codificação
// dos segmentos com ffmpeg.

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import got from "got";
import { W, H, FPS } from "./base.mjs";

// ============ fundos ============

export async function fetchImageBuffer(item) {
  if (item?.img && item.img.startsWith("/media/news/img/")) {
    const local = path.join(process.cwd(), item.img.replace(/^\//, ""));
    try {
      const buf = await fs.readFile(local);
      if (buf.length > 1024) return buf;
    } catch {}
  }
  const src = item?.img || item?.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try {
      return await got(src, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
    } catch {}
  }
  try {
    const hex = String(item?.id || "").replace(/[^0-9a-f]/gi, "")[0] || "0";
    const n = (parseInt(hex, 16) % 4) + 1;
    const buf = await fs.readFile(path.join(process.cwd(), `media/news/img/_band-fallback-${n}.jpg`));
    if (buf && buf.length > 1024) return buf;
  } catch {}
  return null;
}

// Base pro Ken Burns: foto cover em W*Z x H*Z. Por frame, extrai a janela
// central correspondente ao zoom(t) e redimensiona pra W x H.
export async function prepareZoomBase(buf, maxZoom) {
  const bw = Math.round(W * maxZoom);
  const bh = Math.round(H * maxZoom);
  const base = await sharp(buf, { failOn: "none" })
    .resize(bw, bh, { fit: "cover", position: "attention" })
    .sharpen(1.05)
    .jpeg({ quality: 92 })
    .toBuffer();
  return { base, bw, bh, maxZoom };
}

export function zoomWindow({ bw, bh, maxZoom }, scale) {
  const winW = Math.min(bw, Math.round((W * maxZoom) / scale));
  const winH = Math.min(bh, Math.round((H * maxZoom) / scale));
  return { left: Math.floor((bw - winW) / 2), top: Math.floor((bh - winH) / 2), width: winW, height: winH };
}

// ============ ffmpeg ============

export function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-2000)}`)));
  });
}

export const X264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "main", "-level", "4.0", "-preset", "medium", "-crf", "18", "-r", String(FPS)];

export async function encodePngSegment({ framesDir, outPath }) {
  await runFfmpeg(["-y", "-framerate", String(FPS), "-i", path.join(framesDir, "f_%05d.png"), ...X264, "-an", outPath]);
}

export async function encodeClipSegment({ clipPath, overlayDir, dur, outPath }) {
  await runFfmpeg([
    "-y",
    "-stream_loop", "-1", "-t", String(dur + 0.5), "-i", clipPath,
    "-framerate", String(FPS), "-i", path.join(overlayDir, "f_%05d.png"),
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1[bg];[bg][1:v]overlay=0:0:shortest=1[v]`,
    "-map", "[v]", "-an", "-t", String(dur), ...X264, outPath,
  ]);
}
