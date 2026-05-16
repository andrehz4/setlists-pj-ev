// Re-cache unico das imagens do index.json em alta resolucao.
// Pra cada noticia: se tem override manual, re-baixa o override; senao
// raspa a materia e pega a MAIOR imagem (independente de rosto, ao
// contrario do findBetterImage que so serve foto de pessoa). So
// sobrescreve se a nova for genuinamente melhor (nunca degrada).
// Reprocessa no mesmo padrao do cache novo (lado <=1800, q85, EXIF).
//
// Uso: node scripts/news/recache-images.mjs [--dry]

import fs from "node:fs/promises";
import path from "node:path";
import got from "got";
import sharp from "sharp";
import { fetchHtml } from "./extract.mjs";
import { extractCandidates } from "../publish/find-better-image.mjs";
import { getImageOverrideUrl } from "../publish/image-overrides.mjs";

const DRY = process.argv.includes("--dry");
const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const IMG_DIR = path.resolve("media/news/img");
const INDEX = path.resolve("media/news/index.json");
// O slide e 1080x1350 (retrato): o gargalo e a MENOR dimensao da fonte.
// O cache atual e corte 16:9 (720 de altura), entao um candidato fresco
// sem corte com menor-lado > ~720 ja e melhor mesmo com lado maior menor.
const MIN_LONG_SANITY = 1000; // candidato precisa ter o lado maior >= isso
const MIN_SHORT_GAIN = 780;   // e menor-lado >= isso pra valer a troca (curMin~720)

async function dl(url) {
  try {
    const buf = await got(url, {
      headers: { "User-Agent": UA },
      timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer",
    }).buffer();
    return buf && buf.length > 2048 ? buf : null;
  } catch { return null; }
}

async function dims(bufOrPath) {
  try {
    const input = Buffer.isBuffer(bufOrPath) ? bufOrPath : await fs.readFile(bufOrPath);
    const m = await sharp(input, { failOn: "none" }).metadata();
    return { w: m.width || 0, h: m.height || 0 };
  } catch { return { w: 0, h: 0 }; }
}

async function bestScraped(url) {
  let html;
  try { html = await fetchHtml(url); } catch { return null; }
  const cands = extractCandidates(html, url).slice(0, 6);
  let best = null, bestShort = 0;
  for (const c of cands) {
    const buf = await dl(c);
    if (!buf) continue;
    const { w, h } = await dims(buf);
    const shortSide = Math.min(w, h);
    // escolhe pela menor dimensao (utilidade no recorte retrato), nao por area
    if (Math.max(w, h) >= MIN_LONG_SANITY && shortSide > bestShort) {
      bestShort = shortSide; best = { buf, w, h, short: shortSide, url: c };
    }
  }
  return best;
}

async function main() {
  const idx = JSON.parse(await fs.readFile(INDEX, "utf8"));
  const items = idx.items || [];
  let upgraded = 0, kept = 0, i = 0;

  for (const it of items) {
    i++;
    const tag = `${String(i).padStart(2, "0")} ${it.id}`;
    const dest = path.join(IMG_DIR, `${it.id}.jpg`);
    const cur = await dims(dest);

    let src = null, srcInfo = "";
    const ov = await getImageOverrideUrl(it.id).catch(() => null);
    if (ov) {
      const buf = await dl(ov);
      if (buf) { const d = await dims(buf); src = buf; srcInfo = `override ${d.w}x${d.h}`; }
    }
    if (!src) {
      const b = await bestScraped(it.url);
      const curShort = Math.min(cur.w, cur.h);
      if (b && b.short >= MIN_SHORT_GAIN && b.short > curShort) {
        src = b.buf; srcInfo = `scrape ${b.w}x${b.h}`;
      }
    }

    if (!src) {
      kept++;
      console.log(`${tag}  mantido (${cur.w}x${cur.h}, sem fonte melhor)`);
      continue;
    }
    if (DRY) {
      upgraded++;
      console.log(`${tag}  [DRY] trocaria ${cur.w}x${cur.h} -> ${srcInfo}`);
      continue;
    }
    try {
      await sharp(src, { failOn: "none" })
        .rotate()
        .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(dest + ".tmp");
      await fs.rename(dest + ".tmp", dest);
      const nd = await dims(dest);
      upgraded++;
      console.log(`${tag}  ${cur.w}x${cur.h} -> ${nd.w}x${nd.h}  (${srcInfo})`);
    } catch (e) {
      kept++;
      console.log(`${tag}  ERRO reprocessando (${e.message}), mantido`);
    }
  }
  console.log(`\nRe-cache: ${upgraded} melhoradas, ${kept} mantidas, ${items.length} total.`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
