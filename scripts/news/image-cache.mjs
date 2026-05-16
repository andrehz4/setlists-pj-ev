// Cache local de imagens: baixa e guarda com sharp em media/news/img/<hash>.jpg.
// NAO corta mais pra 16:9 1280x720. Preserva a proporcao original, lado maior
// ate 1800px (downscale apenas, sem ampliar), JPEG q85 mozjpeg, com
// auto-orientacao EXIF. Motivo: o slide do IG e 1080x1350 (retrato); guardar
// alto e sem corte deixa a foto nitida e da o quadro inteiro pro recorte
// inteligente de rosto. O site usa background cover, entao proporcao livre
// nao quebra. Custo: jpg maior no repo (~250-500KB vs ~150KB), aceitavel.
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
      .rotate() // honra orientacao EXIF (sem corte 16:9 a orientacao importa)
      .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
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
    if (hash.startsWith("_")) continue; // preserva fallbacks e assets especiais
    if (!keep.has(hash)) {
      await fs.unlink(path.join(IMG_DIR, f)).catch(() => {});
      removed++;
    }
  }
  if (removed) console.log(`[image] GC: ${removed} imagens orfas removidas`);
}
