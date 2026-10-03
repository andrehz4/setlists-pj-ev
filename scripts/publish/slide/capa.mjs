// Capa do carrossel. card11 (original): fundo de cor, "PEARL/JAAAM" gigante atrás da foto do item
// líder, wordmark e rodapé. Os outros estilos (poster/zine/ingresso) vêm de cover-styles*.mjs.
import path from "node:path";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";
import { coverStyleFor, planCover } from "../cover-styles.mjs";
import { coverSvg } from "../cover-styles-svg.mjs";
import { sharp, SLIDE_W, SLIDE_H, SLIDES_DIR, CAT_LABELS, escapeXml, hexToRgb, headlineOf, ensureSlidesDir, fundo } from "./base.mjs";
import { fitHeadline, measureText } from "./texto.mjs";
import { prepareSource } from "./imagem.mjs";
import { renderPhoto } from "./foto.mjs";

const svgAbre = `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">`;

// Cor da tarja por fundo (contraste): vermelho<->preto, estendido pras cores de marca ocre/azul.
function coverLabelBg(bg) {
  const map = { "#0a0a0a": "#E10600", "#e10600": "#0a0a0a", "#a87f2c": "#0a0a0a", "#2a5b9e": "#E10600" };
  return map[String(bg).toLowerCase()] || "#E10600";
}

function coverLabel(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = (item.kind === "youtube" ? "Cápsula" : (CAT_LABELS[tags[0]] || "Notícia")).toUpperCase();
  return `PEARL JAM · ${cat}`;
}

// Capa alternativa: foto recortada no tamanho do plano, embutida no SVG; P&B quando o layout pede.
async function buildStyledCover(item, destId, bg, style) {
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);
  const plan = await planCover(style, { headline: headlineOf(item), label: coverLabel(item) }, measureText);
  let uri = null;
  const { srcBuf, det } = await prepareSource(item);
  if (srcBuf) {
    try {
      const { w, h, bw } = plan.photo;
      let ph = await renderPhoto(srcBuf, det, w, h, `${item.id} (capa ${style})`);
      ph = await (bw ? sharp(ph).greyscale().linear(1.1, -12.8) : sharp(ph)).jpeg({ quality: 90 }).toBuffer();
      uri = `data:image/jpeg;base64,${ph.toString("base64")}`;
    } catch (e) {
      console.warn(`[slide] capa ${style}: foto falhou (${e.message})`);
    }
  }
  await sharp(Buffer.from(coverSvg(plan, bg, uri))).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, reused: false, style };
}

// Camada de trás: fundo + tipo gigante. Anton 380, lh 0.78, ls -0.03em; JAAAM fica atrás da foto.
function buildCoverBackSvg(bg = "#0a0a0a") {
  const cx = SLIDE_W / 2;
  const FS = 380, LS = Math.round(-0.03 * FS);
  const b1 = 380;
  const b2 = b1 + Math.round(0.78 * FS);
  return `${svgAbre}
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="${bg}"/>
  <text x="${cx}" y="${b1}" text-anchor="middle"
    font-family="${F_ANTON}" font-size="${FS}" fill="#ffffff" letter-spacing="${LS}">PEARL</text>
  <text x="${cx}" y="${b2}" text-anchor="middle"
    font-family="${F_ANTON}" font-size="${FS}" fill="#ffffff" letter-spacing="${LS}">JAAAM</text>
</svg>`;
}

// Sombra do card de foto (design: 0 30px 80px rgba(0,0,0,.45)).
function buildCoverShadowSvg(x, y, w, h) {
  return `${svgAbre}
  <defs>
    <filter id="csh" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>
  <rect x="${x}" y="${y + 30}" width="${w}" height="${h}" fill="#000000" fill-opacity="0.45" filter="url(#csh)"/>
</svg>`;
}

// Camada da frente: wordmark + rodapé (tarja Inter 22/800 ls 2.2 + manchete Anton 70 + site).
function buildCoverFrontSvg(leadItem, bg = "#0a0a0a") {
  const PAD = 56;
  const boxW = SLIDE_W - PAD * 2;
  const label = coverLabel(leadItem);
  const urlFS = 19;
  const urlBaseline = SLIDE_H - 64;
  const fit = fitHeadline(headlineOf(leadItem), boxW, 3, 70, 46);
  const lastBaseline = urlBaseline - urlFS - 22;
  const firstBaseline = lastBaseline - (fit.lines.length - 1) * fit.lh;
  const headTopY = firstBaseline - fit.fs * 0.78;
  const headSpans = fit.lines
    .map((l, i) => `<tspan x="${PAD}" y="${firstBaseline + i * fit.lh}">${escapeXml(l)}</tspan>`)
    .join("");
  const labelFS = 22, labelLS = 2.2;
  const lPadX = 22, lPadTop = 12, lPadBot = 10;
  const lTextW = Math.round(label.length * labelFS * 0.60 + Math.max(0, label.length - 1) * labelLS);
  const lBoxH = labelFS + lPadTop + lPadBot;
  const lTopY = headTopY - 24 - lBoxH;
  const lTextBaseline = lTopY + lPadTop + labelFS * 0.80;
  return `${svgAbre}
  <text x="${SLIDE_W / 2}" y="60" text-anchor="middle"
    font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28"
    fill="#ffffff" letter-spacing="-0.56">Só Mais um Fã de PEARL JAM</text>

  <rect x="${PAD}" y="${Math.round(lTopY)}" width="${lTextW + lPadX * 2}" height="${Math.round(lBoxH)}" fill="${coverLabelBg(bg)}"/>
  <text x="${PAD + lPadX}" y="${Math.round(lTextBaseline)}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${labelFS}"
    fill="#ffffff" letter-spacing="${labelLS}">${escapeXml(label)}</text>

  <text font-family="${F_ANTON}" font-size="${fit.fs}" fill="#ffffff"
    letter-spacing="0.35">${headSpans}</text>

  <text x="${PAD}" y="${urlBaseline}"
    font-family="${F_INTER_SB}" font-size="${urlFS}"
    fill="#ffffff" opacity="0.6" letter-spacing="0.5">somaisumfadepearljam.com.br</text>
</svg>`;
}

// destId nomeia o arquivo (ex: _cover-regular). Sempre regenera (edição e líder mudam a cada run).
// style: card11 ou poster/zine/ingresso, em rodízio diário.
export async function buildCoverSlide(leadItem, destId, bg = "#0a0a0a", { style = coverStyleFor() } = {}) {
  if (style !== "card11") return buildStyledCover(leadItem, destId, bg, style);
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);
  const { srcBuf, det } = await prepareSource(leadItem);
  // Foto fiel ao bundle: 860x700 em (110, 290). Ordem: fundo+tipo -> sombra -> foto -> frente.
  const PHOTO_X = 110, PHOTO_Y = 290, PHOTO_W = SLIDE_W - 220, PHOTO_BH = 700;
  const layers = [{ input: Buffer.from(buildCoverBackSvg(bg)), blend: "over" }];
  if (srcBuf) {
    try {
      const photo = await renderPhoto(srcBuf, det, PHOTO_W, PHOTO_BH, `${leadItem.id} (capa)`);
      layers.push({ input: Buffer.from(buildCoverShadowSvg(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_BH)), blend: "over" });
      layers.push({ input: photo, top: PHOTO_Y, left: PHOTO_X });
    } catch (e) {
      console.warn(`[slide] capa: crop falhou (${e.message})`);
    }
  }
  layers.push({ input: Buffer.from(buildCoverFrontSvg(leadItem, bg)), blend: "over" });
  const base = await fundo(hexToRgb(bg));
  await sharp(base).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, reused: false };
}
