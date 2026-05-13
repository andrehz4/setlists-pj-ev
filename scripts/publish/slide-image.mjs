// Gerador de slide composto pro carrossel IG. Pega a foto da noticia,
// recorta em 1080x1350 (formato 4:5 do feed/carrossel), escurece, e
// compoe overlay SVG com titulo + intro + bandeira "SMUFDPJ" + tags.
// Tipografia usa fontes do sistema (DejaVu/Liberation no Ubuntu) com
// fallback declarado pras Google Fonts caso o ambiente tenha. Pra
// fidelidade total ao fanzine, futuro: subir TTFs em media/fonts/ +
// fc-cache no workflow.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import got from "got";

const SLIDE_W = 1080;
const SLIDE_H = 1350;
const IMG_LOCAL_DIR = path.resolve("media/news/img");
export const SLIDES_DIR = path.resolve("media/news/instagram-slides");

const TAG_LABELS = {
  turne: "TURNÊ", lancamento: "LANÇAMENTO", tenclub: "TEN CLUB",
  memoria: "MEMÓRIA", br: "BRASIL", bootleg: "BOOTLEG",
  comunidade: "COMUNIDADE", eddie: "EDDIE", mike: "MIKE",
  stone: "STONE", jeff: "JEFF", matt: "MATT", boom: "BOOM", josh: "JOSH",
};
const TAG_COLORS = {
  turne: "#c8261c", lancamento: "#1b6e7b", tenclub: "#7a4d23",
  memoria: "#a87f2c", br: "#2d6b39", bootleg: "#5a4b2c",
  comunidade: "#2a5b9e", eddie: "#5a3d80", mike: "#8a3a30",
  stone: "#3a4d5a", jeff: "#4a6b3a", matt: "#c45a1c",
  boom: "#2e4d7a", josh: "#8a6d1c",
};

function escapeXml(s) {
  return String(s || "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

// Quebra texto em linhas que cabem dentro de `maxChars` por linha,
// respeitando palavras. Trunca em maxLines com elipse.
function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; if (lines.length >= maxLines) break; }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, -3) + "..." : last + "...";
  }
  return lines;
}

async function fetchBaseImageBuffer(item) {
  // tenta arquivo local primeiro (media/news/img/<hash>.jpg) com hash = id curto
  // o image-cache salva por sha10 do url; o item.img aponta pra /media/news/img/...
  if (item.img && item.img.startsWith("/media/news/img/")) {
    const local = path.join(process.cwd(), item.img.replace(/^\//, ""));
    try {
      const buf = await fs.readFile(local);
      if (buf.length > 1024) return buf;
    } catch {}
  }
  // fallback: baixa direto do url do item ou do og:image
  const src = item.img || item.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try {
      return await got(src, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
    } catch {}
  }
  return null;
}

// Cor de fundo neutra (papel creme fanzine) quando nao tem imagem.
async function makeFallbackBg() {
  return sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: { r: 232, g: 222, b: 198 } },
  }).jpeg({ quality: 88 }).toBuffer();
}

function buildOverlaySvg(item) {
  const titulo = escapeXml(item.title_pt || "");
  const intro = escapeXml(item.intro_pt || "");
  const source = escapeXml((item.sourceLabel || "").toUpperCase());
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];

  const titleLines = wrapText(titulo, 22, 4);
  const introLines = wrapText(intro, 38, 4);

  const titleLineHeight = 88;
  const introLineHeight = 42;
  const titleY = 540;
  const introY = titleY + titleLines.length * titleLineHeight + 50;

  const titleSpans = titleLines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  const introSpans = introLines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : introLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const tagsY = SLIDE_H - 130;
  let tagsX = 80;
  const tagsXml = tags.map((t) => {
    const key = String(t).toLowerCase();
    const label = TAG_LABELS[key] || key.toUpperCase();
    const color = TAG_COLORS[key] || "#444";
    const w = label.length * 16 + 36;
    const rot = (Math.random() * 4 - 2).toFixed(1);
    const x = tagsX;
    tagsX += w + 14;
    return `<g transform="translate(${x},${tagsY}) rotate(${rot})">
      <rect width="${w}" height="42" rx="2" fill="${color}" />
      <text x="${w / 2}" y="28" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="22" font-weight="900" fill="#f7f1de" text-anchor="middle" letter-spacing="2">${label}</text>
    </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
    <defs>
      <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10,9,8,0)" />
        <stop offset="40%" stop-color="rgba(10,9,8,0.55)" />
        <stop offset="100%" stop-color="rgba(10,9,8,0.92)" />
      </linearGradient>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10,9,8,0.78)" />
        <stop offset="100%" stop-color="rgba(10,9,8,0)" />
      </linearGradient>
    </defs>

    <!-- escurece topo e base pra contraste com texto -->
    <rect x="0" y="0" width="${SLIDE_W}" height="200" fill="url(#topFade)" />
    <rect x="0" y="${SLIDE_H - 900}" width="${SLIDE_W}" height="900" fill="url(#bottomFade)" />

    <!-- flag superior -->
    <text x="80" y="80" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="34" font-weight="900" fill="#f7f1de" letter-spacing="6">SMUFDPJ</text>
    <text x="80" y="118" font-family="'Special Elite',Courier,monospace" font-size="18" fill="#f7f1de" opacity="0.78" letter-spacing="4">░ SÓ MAIS UM FÃ DE PEARL JAM ░</text>

    <!-- titulo -->
    <text x="80" y="${titleY}" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="78" font-weight="900" fill="#f7f1de" letter-spacing="-1">${titleSpans}</text>

    <!-- intro -->
    <text x="80" y="${introY}" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="34" fill="#f0e7c8" opacity="0.95">${introSpans}</text>

    <!-- tags stamp -->
    ${tagsXml}

    <!-- source rodape -->
    <text x="80" y="${SLIDE_H - 60}" font-family="'Special Elite',Courier,monospace" font-size="20" fill="#c8261c" letter-spacing="3" font-weight="700">VIA ${source}</text>
  </svg>`;
}

export async function ensureSlidesDir() {
  await fs.mkdir(SLIDES_DIR, { recursive: true });
}

export async function buildSlide(item) {
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${item.id}.jpg`);
  // se ja existe, reusa
  try {
    const st = await fs.stat(dest);
    if (st.size > 1024) return { path: dest, reused: true };
  } catch {}

  const baseBuf = (await fetchBaseImageBuffer(item)) || (await makeFallbackBg());
  const cover = await sharp(baseBuf, { failOn: "none" })
    .resize(SLIDE_W, SLIDE_H, { fit: "cover", position: "attention" })
    .toBuffer();

  // overlay escurecedor base (alem do gradient do svg, pra ainda mais contraste
  // quando a imagem origem e clara)
  const overlay = await sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 4, background: { r: 10, g: 9, b: 8, alpha: 0.35 } },
  }).png().toBuffer();

  const svg = Buffer.from(buildOverlaySvg(item));

  await sharp(cover)
    .composite([{ input: overlay, blend: "over" }, { input: svg, blend: "over" }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);

  return { path: dest, reused: false };
}

// Gera N slides em sequencia. Retorna array de paths.
export async function buildSlides(items) {
  const out = [];
  for (const it of items) {
    try {
      const r = await buildSlide(it);
      out.push({ id: it.id, path: r.path, reused: r.reused });
    } catch (e) {
      console.warn(`[slide] falha em ${it.id}: ${e.message}`);
    }
  }
  return out;
}
