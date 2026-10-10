// Card de notícia do story, no padrão card02 vertical: cunha da cor do ciclo, wordmark, contador,
// tarja que "pula", manchete Anton em máquina de escrever e o site no rodapé.
import sharp from "sharp";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";
import { clamp01, easeOutCubic, easeOutBack, progress, escapeXml } from "../story-styles/_shared.mjs";
import { splitBalanced } from "../slide/texto.mjs";
import { fetchBaseImageBuffer } from "../slide/imagem.mjs";
import { W, H } from "./base.mjs";

const SIDE_S = 64;
const CAT_LABELS_S = {
  turne: "Turnê", lancamento: "Lançamento", tenclub: "Ten Club",
  memoria: "Memória", br: "Brasil", bootleg: "Bootleg",
  comunidade: "Comunidade", eddie: "Eddie", mike: "Mike",
  stone: "Stone", jeff: "Jeff", matt: "Matt", boom: "Boom",
  josh: "Josh", loja: "Loja",
};

// Quebra editorial (~3 palavras/linha); se não couber, corta a linha com reticências.
function balancedWrapS(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const startL = Math.min(maxLines, Math.max(1, Math.ceil(words.length / 3)));
  for (let L = startL; L <= maxLines; L++) {
    const lines = splitBalanced(words, L);
    if (lines.every((ln) => ln.length <= maxChars)) return lines;
  }
  return splitBalanced(words, maxLines)
    .map((l) => l.length > maxChars ? l.slice(0, maxChars - 1).replace(/[.,;:!?\s]+$/, "") + "…" : l);
}

// Primeiros N caracteres de um texto já quebrado, mantendo as quebras (máquina de escrever).
function sliceWrapped(lines, nChars) {
  let remaining = nChars;
  return lines.map((ln) => {
    const vis = ln.slice(0, Math.max(0, remaining));
    remaining -= ln.length;
    return vis;
  });
}

function coverWedgeS(size, color, opacity = 1) {
  return `<g opacity="${opacity.toFixed(2)}"><defs>
    <linearGradient id="wcard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="42%" stop-color="${color}"/>
      <stop offset="42.5%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${size}" height="${size}" fill="url(#wcard)"/></g>`;
}

// Layout ancorado no fundo (espelha o rodapé do slide card02). O fundo usa o mesmo cálculo pra saber onde desfocar.
const headFS = 96, siteFS = 28, bottomPad = 110, tagFS = 34, tagPadT = 18, tagPadB = 16;
export function layoutCard(item) {
  const title = (item.title_ig || item.title_pt || "").toUpperCase();
  const maxChars = Math.max(8, Math.floor((W - SIDE_S * 2) / (headFS * 0.46))); // ~21
  const lines = balancedWrapS(title, maxChars, 5);
  const lh = Math.round(headFS * 0.96);
  const siteBaseline = H - bottomPad;
  const firstBaseline = siteBaseline - siteFS - 40 - (lines.length - 1) * lh;
  const headTopY = firstBaseline - headFS * 0.78;
  const tagTopY = headTopY - 34 - (tagFS + tagPadT + tagPadB);
  return { lines, lh, siteBaseline, firstBaseline, tagTopY };
}

export function buildCardSvg({ tarjaColor, item, idx, total, tRel }) {
  const headOpacity = easeOutCubic(progress(tRel, 0.0, 0.4)); // wordmark, contador, cunha
  const tagP = progress(tRel, 0.2, 0.6); // tarja pop
  const footerOpacity = easeOutCubic(progress(tRel, 0.0, 0.4));
  const { lines, lh, siteBaseline, firstBaseline, tagTopY } = layoutCard(item);
  const totalChars = lines.reduce((a, l) => a + l.length, 0);
  // ritmo constante (curva que freia no fim deixava a última letra quase 1 s parada)
  const charsToShow = Math.ceil(progress(tRel, 0.8, 1.5) * totalChars);
  const visibleLines = sliceWrapped(lines, charsToShow);
  const cursorBlink = charsToShow < totalChars && Math.floor(tRel * 4) % 2 === 0 ? "▌" : "";

  const headSpans = visibleLines
    .map((l, i) => `<tspan x="${SIDE_S}" y="${firstBaseline + i * lh}">${escapeXml(l)}${i === visibleLines.length - 1 ? cursorBlink : ""}</tspan>`)
    .join("");

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = (CAT_LABELS_S[tags[0]] || "Notícia").toUpperCase();
  const tagLS = 2.4, tPadX = 28, tPadT = tagPadT;
  const tagBoxW = Math.round(cat.length * tagFS * 0.60 + Math.max(0, cat.length - 1) * tagLS) + tPadX * 2;
  const tagBoxH = tagFS + tagPadT + tagPadB;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${coverWedgeS(300, tarjaColor, headOpacity)}

    <text x="${W / 2}" y="120" text-anchor="middle"
      font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="42"
      fill="#ffffff" letter-spacing="-0.8" opacity="${headOpacity.toFixed(2)}">Só Mais um Fã de PEARL JAM</text>

    <text x="${W - SIDE_S}" y="${H - bottomPad}" text-anchor="end"
      font-family="${F_INTER_SB}" font-size="26" fill="#ffffff"
      opacity="${(footerOpacity * 0.7).toFixed(2)}" letter-spacing="2">${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}</text>

    <g transform="translate(${SIDE_S} ${Math.round(tagTopY)}) scale(${easeOutBack(tagP).toFixed(3)})" transform-origin="0 ${tagBoxH / 2}" opacity="${clamp01(tagP * 2).toFixed(2)}">
      <rect x="0" y="0" width="${tagBoxW}" height="${Math.round(tagBoxH)}" fill="${tarjaColor}"/>
      <text x="${tPadX}" y="${Math.round(tPadT + tagFS * 0.80)}"
        font-family="${F_INTER_XB}" font-weight="800" font-size="${tagFS}"
        fill="#ffffff" letter-spacing="${tagLS}">${escapeXml(cat)}</text>
    </g>

    <text font-family="${F_ANTON}" font-size="${headFS}" fill="#ffffff" letter-spacing="0.5">${headSpans}</text>

    <text x="${SIDE_S}" y="${siteBaseline}"
      font-family="${F_INTER_SB}" font-size="${siteFS}" fill="#ffffff"
      opacity="${(footerOpacity * 0.85).toFixed(2)}" letter-spacing="0.5">somaisumfadepearljam.com.br</text>
  </svg>`;
}

// Fundo do card: foto (mesma escolha do slide do feed) em cover + gradiente card02 vertical. Na faixa da manchete
// (da tarja até o rodapé) a foto vem desfocada e mais escura, com borda de 160 px em degradê: foto clara atrás não
// briga com a letra branca. Sem foto: grafite.
const FEATHER = 160;
export async function prepareCardBg(item) {
  const baseBuf = (await fetchBaseImageBuffer(item))
    || (await sharp({ create: { width: W, height: H, channels: 3, background: { r: 26, g: 24, b: 21 } } }).png().toBuffer());
  const cover = await sharp(baseBuf, { failOn: "none" })
    .resize(W, H, { fit: "cover", position: "attention" }).sharpen(1.1).png().toBuffer();
  const y0 = Math.max(0, Math.round(layoutCard(item).tagTopY - 70)), yF = Math.max(0, y0 - FEATHER);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="m" gradientUnits="userSpaceOnUse" x1="0" y1="${yF}" x2="0" y2="${y0}">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/>
    </linearGradient></defs><rect x="0" y="${yF}" width="${W}" height="${H - yF}" fill="url(#m)"/></svg>`);
  const desfocada = await sharp(cover).blur(26).modulate({ brightness: 0.55, saturation: 0.7 })
    .composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const grad = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="22%" stop-color="#000" stop-opacity="0"/>
      <stop offset="${Math.round((yF / H) * 100)}%" stop-color="#000" stop-opacity="0"/>
      <stop offset="${Math.round((y0 / H) * 100)}%" stop-color="#000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  return sharp(cover).composite([{ input: desfocada, blend: "over" }, { input: grad, blend: "over" }]).png().toBuffer();
}
