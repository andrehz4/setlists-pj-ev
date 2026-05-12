// Cache local de imagens: baixa, resize com sharp pra 1280x720 cover JPEG q82,
// salva em media/news/img/<hash>.jpg.
// Garbage collection: remove arquivos que nao estao mais referenciados.

import got from "got";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const IMG_DIR = path.resolve("media/news/img");
const MAX_IMG_BYTES = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 20000;

export async function ensureImgDir() {
  await fs.mkdir(IMG_DIR, { recursive: true });
}

export async function cacheImage(remoteUrl, hash) {
  if (!remoteUrl || !hash) return null;
  await ensureImgDir();
  const dest = path.join(IMG_DIR, `${hash}.jpg`);
  // se ja existe, reusa
  try {
    const st = await fs.stat(dest);
    if (st.size > 1024) return `/media/news/img/${hash}.jpg`;
  } catch {}
  try {
    const buf = await got(remoteUrl, {
      headers: { "User-Agent": UA, "Accept": "image/*,*/*;q=0.8" },
      timeout: { request: TIMEOUT_MS },
      retry: { limit: 1 },
      responseType: "buffer",
    }).buffer();
    if (!buf || buf.length === 0 || buf.length > MAX_IMG_BYTES) {
      console.warn(`[image] tamanho invalido em ${remoteUrl} (${buf?.length} bytes)`);
      return null;
    }
    await sharp(buf, { failOn: "none" })
      .resize(1280, 720, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dest);
    return `/media/news/img/${hash}.jpg`;
  } catch (e) {
    console.warn(`[image] falha em ${remoteUrl}: ${e.message}`);
    return null;
  }
}

export async function gcOrphanImages(keepHashes) {
  await ensureImgDir();
  const keep = new Set(keepHashes);
  const files = await fs.readdir(IMG_DIR).catch(() => []);
  let removed = 0;
  for (const f of files) {
    if (!f.endsWith(".jpg")) continue;
    const hash = f.replace(/\.jpg$/, "");
    if (!keep.has(hash)) {
      await fs.unlink(path.join(IMG_DIR, f)).catch(() => {});
      removed++;
    }
  }
  if (removed) console.log(`[image] GC: ${removed} imagens orfas removidas`);
}
