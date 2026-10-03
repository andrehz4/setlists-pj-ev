// Card 02 (notícia/solo): foto cheia + gradiente + cunha de cor + wordmark + rodapé com tarja e manchete.
import fs from "node:fs/promises";
import path from "node:path";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";
import { sharp, SLIDE_W, SLIDE_H, SLIDES_DIR, CAT_LABELS, escapeXml, headlineOf, fundo } from "./base.mjs";
import { fitHeadline } from "./texto.mjs";
import { prepareSource } from "./imagem.mjs";
import { renderPhoto } from "./foto.mjs";

// Rodapé ancorado no fundo, de baixo pra cima: site, CTA, manchete, tarja.
function footerBlockSvg({ tag, headline, tagBg, tagFg = "#fff", headFill = "#fff" }) {
  const PAD = 56;
  const boxW = SLIDE_W - PAD * 2;
  const bottomPad = 64;
  const ctaFS = 23; // "LEIA MAIS …"
  const urlFS = 21; // site, logo abaixo da CTA
  const ctaUrlGap = 18;
  const headMargin = 28; // design: marginTop do bloco abaixo da manchete

  const urlBaseline = SLIDE_H - bottomPad;
  const ctaBaseline = urlBaseline - urlFS - ctaUrlGap;
  const fit = fitHeadline(headline, boxW, 3, 78, 50);
  const lastBaseline = ctaBaseline - ctaFS - headMargin;
  const firstBaseline = lastBaseline - (fit.lines.length - 1) * fit.lh;
  const headTopY = firstBaseline - fit.fs * 0.78;
  const headSpans = fit.lines
    .map((l, i) => `<tspan x="${PAD}" y="${firstBaseline + i * fit.lh}">${escapeXml(l)}</tspan>`)
    .join("");

  // Tarja: design Inter 24/800, ls 1.92, padding T14 R24 B12 L24, margin-bottom 24. Largura pelo texto
  // (Inter ExtraBold ~0.60em/char) mais o letter-spacing acumulado.
  const tagText = String(tag || "").toUpperCase();
  const tagFS = 24, tagLS = 1.92;
  const tagPadX = 24, tagPadTop = 14, tagPadBot = 12;
  const tagTextW = Math.round(tagText.length * tagFS * 0.60 + Math.max(0, tagText.length - 1) * tagLS);
  const tagBoxW = tagTextW + tagPadX * 2;
  const tagBoxH = tagFS + tagPadTop + tagPadBot;
  const tagTopY = headTopY - 24 - tagBoxH;
  const tagTextBaseline = tagTopY + tagPadTop + tagFS * 0.80;

  return `
  <rect x="${PAD}" y="${Math.round(tagTopY)}" width="${tagBoxW}" height="${Math.round(tagBoxH)}" fill="${tagBg}"/>
  <text x="${PAD + tagPadX}" y="${Math.round(tagTextBaseline)}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${tagFS}"
    fill="${tagFg}" letter-spacing="${tagLS}">${escapeXml(tagText)}</text>

  <text font-family="${F_ANTON}" font-size="${fit.fs}" fill="${headFill}"
    letter-spacing="0.39">${headSpans}</text>

  <text x="${PAD}" y="${ctaBaseline}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${ctaFS}"
    fill="#ffffff" letter-spacing="4">LEIA MAIS &#8230;</text>

  <text x="${PAD}" y="${urlBaseline}"
    font-family="${F_INTER_SB}" font-size="${urlFS}"
    fill="#ffffff" opacity="0.82" letter-spacing="0.5">somaisumfadepearljam.com.br</text>`;
}

// Wordmark "Só Mais um Fã de PEARL JAM" centrado no topo (Playfair 28/900 italic, ls -0.56).
function wordmarkSvg(fill = "#fff") {
  return `<text x="${SLIDE_W / 2}" y="60" text-anchor="middle"
    font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28"
    fill="${fill}" letter-spacing="-0.56">Só Mais um Fã de PEARL JAM</text>`;
}

// Cunha diagonal no canto superior esquerdo: gradiente 135deg cor 0% a 42%, transparente em 42.5%.
function cornerWedgeSvg(size = 260, color = "#E10600") {
  return `<defs>
    <linearGradient id="wedge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="42%" stop-color="${color}"/>
      <stop offset="42.5%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#wedge)"/>`;
}

function buildCard02Svg(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = CAT_LABELS[tags[0]] || "Notícia";
  // Cor do ciclo (3 posts/cor) anotada pelo publish; cunha e tarja acompanham. Fora do pipeline: vermelho.
  const accent = item._cycleColor || "#E10600";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <defs>
    <linearGradient id="g02" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="30%" stop-color="#000" stop-opacity="0"/>
      <stop offset="78%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="url(#g02)"/>
  ${cornerWedgeSvg(260, accent)}
  ${wordmarkSvg("#fff")}
  ${footerBlockSvg({ tag: cat, headline: headlineOf(item), tagBg: accent, tagFg: "#fff", headFill: "#fff" })}
</svg>`;
}

// Slide Card 02 com cache próprio (<id>.card02.jpg). outDir opcional: o preview gera fora da produção.
export async function buildCard02Slide(item, { outDir } = {}) {
  const dir = outDir || SLIDES_DIR;
  if (outDir) await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${item.id}.card02.jpg`);
  const st = await fs.stat(dest).catch(() => null);
  if (st && st.size > 1024) return { path: dest, reused: true };

  const { srcBuf, det } = await prepareSource(item);
  const layers = [];
  if (srcBuf) {
    try {
      const photo = await renderPhoto(srcBuf, det, SLIDE_W, SLIDE_H, item.id);
      layers.push({ input: photo, top: 0, left: 0 });
    } catch (e) {
      console.warn(`[slide] ${item.id}: crop falhou (${e.message})`);
    }
  }
  layers.push({ input: Buffer.from(buildCard02Svg(item)), blend: "over" });
  const base = await fundo({ r: 0, g: 0, b: 0 });
  await sharp(base).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, reused: false };
}
