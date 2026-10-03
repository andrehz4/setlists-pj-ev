// Layout ANTIGO "Caderno B" (jornal creme), fora do ar desde 2026-05-16. Mantido só pra rollback:
// SLIDE_LAYOUT=cadernob no publish-instagram.yml. A foto usa o mesmo preparo e recorte do card02.
import fs from "node:fs/promises";
import path from "node:path";
import { getEditionNumber } from "../edition.mjs";
import { diaBRT } from "../../lib/brt.mjs";
import { sharp, SLIDE_W, SLIDE_H, SLIDES_DIR, CAT_LABELS, escapeXml, fundo } from "./base.mjs";
import { wrapText } from "./texto.mjs";
import { prepareSource } from "./imagem.mjs";
import { coverCrop } from "./foto.mjs";

// Medidas do Figma × 3.375 (1080px).
const SIDE = 61, CONT_W = SLIDE_W - SIDE * 2, BAR_H = 147, BAR_BORDER = 7.5;
const EYEBROW_Y = 216, EYEBROW_RY = 226, EYEBROW_RW = 340;
const HEADLINE_Y = 341, HEADLINE_S = 88, HEADLINE_LH = 86;
const BYLINE_RY = 648, BYLINE_Y = 680, PHOTO_TOP = 700, PHOTO_H = 422;
const CAPTION_RY = 1130, CAPTION_Y = 1165, FOOTER_Y = 1318;
const CREME = "#f4ede0", TINTA = "#0a0908", SEPIA = "#5a4a2a", REGUA = "#c8b894";
const SERIF = "'Georgia','Times New Roman',serif";
const MONO = "'Courier New',Courier,monospace";
const SANS_BK = "'Arial Black',Impact,'Helvetica Neue',sans-serif";

// Data da edição (dia da postagem, BRT) em DD/MM/AAAA.
const formatDate = (d) => diaBRT(d).split("-").reverse().join("/");

function buildCadernoBSvg(item, edition, editionDate) {
  const tarjaColor = item._tarjaColor || "#c12727";
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = escapeXml(CAT_LABELS[tags[0]] || "Notícias");
  const date = escapeXml(formatDate(editionDate));
  // "Pearl Jam" sempre em caixa alta (marca); ~18 chars/linha, até 4 linhas.
  const titulo = String(item.title_pt || "").replace(/pearl\s+jam/gi, "PEARL JAM");
  const headSpans = wrapText(titulo, 18, 4)
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : HEADLINE_LH}">${escapeXml(l)}</tspan>`).join("");
  // Legenda = primeira frase do intro, em até 2 linhas.
  const captRaw = (item.intro_pt || "").split(/[.!?]/)[0].trim();
  const captSpans = wrapText(captRaw + (captRaw ? "." : ""), 62, 2)
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : 36}">${escapeXml(l)}</tspan>`).join("");
  const byline = `POR @SMUFDPJ  ·  ${date}  ·  5 MIN DE LEITURA`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <rect x="0" y="0" width="${SLIDE_W}" height="${BAR_H}" fill="${TINTA}"/>
  <rect x="0" y="${BAR_H}" width="${SLIDE_W}" height="${BAR_BORDER}" fill="${CREME}"/>
  <text x="${SIDE}" y="90" font-family="${SERIF}" font-style="italic" font-weight="700"
    font-size="44" fill="${CREME}" letter-spacing="-0.5">S&#243; mais Um F&#227; de Pearl Jam</text>
  <text x="${SLIDE_W - SIDE}" y="66" font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85">ANO 1 · N° ${String(edition)}</text>
  <text x="${SLIDE_W - SIDE}" y="102" font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85">${date}</text>
  <text x="${SIDE}" y="${EYEBROW_Y}" font-family="${SANS_BK}" font-weight="900"
    font-size="32" fill="${tarjaColor}" letter-spacing="3">PEARL JAM · ${cat.toUpperCase()}</text>
  <rect x="${SIDE}" y="${EYEBROW_RY}" width="${EYEBROW_RW}" height="7" fill="${tarjaColor}"/>
  <text x="${SIDE}" y="${HEADLINE_Y}" font-family="${SERIF}" font-weight="900"
    font-size="${HEADLINE_S}" fill="${TINTA}" letter-spacing="-1">${headSpans}</text>
  <rect x="${SIDE}" y="${BYLINE_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${BYLINE_Y}" font-family="${MONO}" font-size="25" fill="${SEPIA}"
    letter-spacing="1.5">${escapeXml(byline)}</text>
  <rect x="${SIDE}" y="${CAPTION_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${CAPTION_Y}" font-family="${SERIF}" font-style="italic" font-size="28"
    fill="${SEPIA}">${captSpans}</text>
  <text x="${SIDE}" y="${FOOTER_Y}" font-family="${MONO}" font-size="23" fill="${TINTA}" opacity="0.7"
    letter-spacing="3">CONTINUA EM</text>
  <text x="${SLIDE_W - SIDE}" y="${FOOTER_Y}" font-family="${SANS_BK}" font-size="26" fill="${TINTA}"
    text-anchor="end">SOMAISUMFADEPEARLJAM.COM.BR &#x2192;</text>
</svg>`;
}

export async function buildCadernoBSlide(item, { outDir } = {}) {
  const dir = outDir || SLIDES_DIR;
  if (outDir) await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${item.id}.jpg`);
  const st = await fs.stat(dest).catch(() => null);
  if (st && st.size > 1024) return { path: dest, reused: true };
  // Edição = dia da postagem no IG (hoje), não a data da notícia.
  const editionDate = new Date();
  const edition = await getEditionNumber(editionDate);
  const layers = [];
  const { srcBuf, det } = await prepareSource(item);
  if (srcBuf) {
    try {
      layers.push({ input: await coverCrop(srcBuf, det, CONT_W, PHOTO_H), top: PHOTO_TOP, left: SIDE });
    } catch (e) {
      console.warn(`[slide] ${item.id}: foto do cadernob falhou (${e.message})`);
    }
  }
  layers.push({ input: Buffer.from(buildCadernoBSvg(item, edition, editionDate)), blend: "over" });
  const base = await fundo({ r: 244, g: 237, b: 224 });
  await sharp(base).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, reused: false };
}
