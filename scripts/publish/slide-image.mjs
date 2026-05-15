// Gerador de slide para carrossel IG no layout Caderno B.
// Newspaper editorial creme: masthead preto, serif, foto incrustada, rodape.
// Formato 1080x1350 (4:5 feed/carrossel). Scale 3.375 sobre o design 320x400.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import got from "got";
import { getEditionNumber } from "./edition.mjs";

const SLIDE_W = 1080;
const SLIDE_H = 1350;
export const SLIDES_DIR = path.resolve("media/news/instagram-slides");

// Caderno B — layout constants (1080px)
const SIDE       = 61;    // margem lat. (= 18 * 3.375)
const CONT_W     = SLIDE_W - SIDE * 2; // 958
const BAR_H      = 147;   // masthead bar (Figma 43.4549px × 3.375)
const BAR_BORDER = 7.5;   // borda inferior (Figma 2.22222px × 3.375)
const EYEBROW_Y  = 216;   // baseline do eyebrow
const EYEBROW_RY = 226;   // rule abaixo do eyebrow
const EYEBROW_RW = 340;   // largura da rule
const HEADLINE_Y = 341;   // baseline 1a linha do headline
const HEADLINE_S = 88;    // font-size headline
const HEADLINE_LH = 86;   // line-height entre linhas do headline
const BYLINE_RY  = 648;   // rule horizontal acima do byline
const BYLINE_Y   = 680;   // baseline do byline text
const PHOTO_TOP  = 700;   // y do topo da foto
const PHOTO_H    = 422;   // altura da foto
const CAPTION_RY = 1130;  // rule abaixo da foto / acima da caption
const CAPTION_Y  = 1165;  // baseline da caption
const FOOTER_Y   = 1318;  // baseline do rodape

// Paleta
const CREME = "#f4ede0";
const TINTA = "#0a0908";
const SEPIA = "#5a4a2a";
const REGUA = "#c8b894";

// Fontes de sistema (sharp/libvips sem Google Fonts). Newsreader (Figma)
// nao esta disponivel no renderer; Georgia substitui com metrica mais
// larga, por isso o wordmark usa tamanho ajustado pra caber.
const SERIF   = "'Georgia','Times New Roman',serif";
const MONO    = "'Courier New',Courier,monospace";
const SANS_BK = "'Arial Black',Impact,'Helvetica Neue',sans-serif";

const CAT_LABELS = {
  turne: "Turnê", lancamento: "Lançamento", tenclub: "Ten Club",
  memoria: "Memória", br: "Brasil", bootleg: "Bootleg",
  comunidade: "Comunidade", eddie: "Eddie", mike: "Mike",
  stone: "Stone", jeff: "Jeff", matt: "Matt", boom: "Boom", josh: "Josh",
};

function escapeXml(s) {
  return String(s || "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

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
  if (item.img && item.img.startsWith("/media/news/img/")) {
    const local = path.join(process.cwd(), item.img.replace(/^\//, ""));
    try {
      const buf = await fs.readFile(local);
      if (buf.length > 1024) return buf;
    } catch {}
  }
  const src = item.img || item.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try {
      return await got(src, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
    } catch {}
  }
  return null;
}

// Data em BRT (UTC-3), mesmo timezone do numero de edicao / story-log.
function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
    return [
      String(brt.getUTCDate()).padStart(2, "0"),
      String(brt.getUTCMonth() + 1).padStart(2, "0"),
      brt.getUTCFullYear(),
    ].join("/");
  } catch {
    return "";
  }
}

function buildCadernoBSvg(item, edition, editionDate) {
  const tarjaColor = item._tarjaColor || "#c12727";
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat  = escapeXml(CAT_LABELS[tags[0]] || "Notícias");
  // Data = data da edicao (dia da postagem no IG), consistente com o
  // numero de edicao. A fonte original da noticia vai no caption do post.
  const date = escapeXml(formatDate(editionDate));
  const ed   = String(edition);

  // Headline: ~18 chars/linha, max 4 linhas
  const headLines = wrapText(item.title_pt || "", 18, 4);
  const headSpans = headLines
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : HEADLINE_LH}">${escapeXml(l)}</tspan>`)
    .join("");

  // Caption = primeira frase do intro, quebrada em ate 2 linhas
  const captRaw   = (item.intro_pt || "").split(/[.!?]/)[0].trim();
  const captLines = wrapText(captRaw + (captRaw ? "." : ""), 62, 2);
  const captSpans = captLines
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : 36}">${escapeXml(l)}</tspan>`)
    .join("");

  const byline = `POR @SMUFDPJ  ·  ${date}  ·  5 MIN DE LEITURA`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">

  <!-- masthead bar preta (Figma 43.4549px × 3.375 = 147px) -->
  <rect x="0" y="0" width="${SLIDE_W}" height="${BAR_H}" fill="${TINTA}"/>
  <!-- borda inferior unica solida (Figma 2.22222px × 3.375 = 7.5px) -->
  <rect x="0" y="${BAR_H}" width="${SLIDE_W}" height="${BAR_BORDER}" fill="${CREME}"/>

  <!-- Wordmark serif italic 700. Figma usa Newsreader 54px; Georgia
       (substituto) e mais largo, 44px mantem o equilibrio sem invadir
       a edicao. Centrado vertical na barra 147px. -->
  <text x="${SIDE}" y="90"
    font-family="${SERIF}" font-style="italic" font-weight="700"
    font-size="44" fill="${CREME}" letter-spacing="-0.5"
  >S&#243; mais Um F&#227; de Pearl Jam</text>

  <!-- Edicao + data (canto direito), 2 linhas centradas em 147px -->
  <text x="${SLIDE_W - SIDE}" y="66"
    font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85"
  >ANO 1 · N° ${ed}</text>
  <text x="${SLIDE_W - SIDE}" y="102"
    font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85"
  >${date}</text>

  <!-- Eyebrow: PEARL JAM caixa alta (reconhecimento de marca instantaneo) -->
  <text x="${SIDE}" y="${EYEBROW_Y}"
    font-family="${SANS_BK}" font-weight="900"
    font-size="32" fill="${tarjaColor}" letter-spacing="3"
  >PEARL JAM · ${cat.toUpperCase()}</text>
  <rect x="${SIDE}" y="${EYEBROW_RY}" width="${EYEBROW_RW}" height="7" fill="${tarjaColor}"/>

  <!-- Headline -->
  <text x="${SIDE}" y="${HEADLINE_Y}"
    font-family="${SERIF}" font-weight="900"
    font-size="${HEADLINE_S}" fill="${TINTA}" letter-spacing="-1"
  >${headSpans}</text>

  <!-- Byline rule + texto -->
  <rect x="${SIDE}" y="${BYLINE_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${BYLINE_Y}"
    font-family="${MONO}" font-size="25" fill="${SEPIA}" letter-spacing="1.5"
  >${escapeXml(byline)}</text>

  <!-- Espaco da foto (transparente — sharp compoe a imagem aqui) -->

  <!-- Rule + caption abaixo da foto -->
  <rect x="${SIDE}" y="${CAPTION_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${CAPTION_Y}"
    font-family="${SERIF}" font-style="italic" font-size="28" fill="${SEPIA}"
  >${captSpans}</text>

  <!-- Rodape -->
  <text x="${SIDE}" y="${FOOTER_Y}"
    font-family="${MONO}" font-size="23" fill="${TINTA}" opacity="0.7" letter-spacing="3"
  >CONTINUA EM</text>
  <text x="${SLIDE_W - SIDE}" y="${FOOTER_Y}"
    font-family="${SANS_BK}" font-size="26" fill="${TINTA}" text-anchor="end"
  >SETLISTS-PJ-EV.PAGES.DEV &#x2192;</text>

</svg>`;
}

export async function ensureSlidesDir() {
  await fs.mkdir(SLIDES_DIR, { recursive: true });
}

export async function buildSlide(item) {
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${item.id}.jpg`);
  try {
    const st = await fs.stat(dest);
    if (st.size > 1024) return { path: dest, reused: true };
  } catch {}

  const photoRaw = await fetchBaseImageBuffer(item);
  // Edicao = dia da postagem no IG (hoje), nao a data da noticia.
  const editionDate = new Date();
  const edition = await getEditionNumber(editionDate);

  // Base creme 1080x1350
  const base = await sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: { r: 244, g: 237, b: 224 } },
  }).png().toBuffer();

  const layers = [];

  // Foto na moldura SEM cortar nada (garante que nenhuma cabeca e
  // cortada). A foto inteira entra com fit:inside e o vazio da
  // moldura e preenchido por uma versao da propria foto em cover,
  // desfocada e escurecida (tecnica letterbox-blur, estilo editorial).
  if (photoRaw) {
    try {
      // Fundo: foto cover + blur forte + escurecida
      const bg = await sharp(photoRaw, { failOn: "none" })
        .resize(CONT_W, PHOTO_H, { fit: "cover", position: "centre" })
        .blur(30)
        .modulate({ brightness: 0.5 })
        .toBuffer();

      // Frente: foto inteira, sem corte, encaixada na moldura
      const fg = await sharp(photoRaw, { failOn: "none" })
        .resize(CONT_W, PHOTO_H, { fit: "inside", withoutEnlargement: false })
        .toBuffer();
      const fgMeta = await sharp(fg).metadata();
      const fgLeft = Math.max(0, Math.round((CONT_W - fgMeta.width) / 2));
      const fgTop  = Math.max(0, Math.round((PHOTO_H - fgMeta.height) / 2));

      const framed = await sharp(bg)
        .composite([{ input: fg, left: fgLeft, top: fgTop }])
        .toBuffer();

      layers.push({ input: framed, top: PHOTO_TOP, left: SIDE });
    } catch {}
  }

  // SVG Caderno B por cima (transparente onde nao ha elementos)
  const svg = Buffer.from(buildCadernoBSvg(item, edition, editionDate));
  layers.push({ input: svg, blend: "over" });

  await sharp(base)
    .composite(layers)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);

  return { path: dest, reused: false };
}

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
