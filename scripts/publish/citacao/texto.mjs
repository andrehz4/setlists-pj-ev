// Ferramentas de texto dos slides de citação: famílias, medida REAL de largura
// (renderiza e mede via sharp.trim, igual às capas) e quebra de linha
// equilibrada (o "text-wrap: balance" do Claude Design).

import sharp from "sharp";
import { F_ANTON, F_INTER, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";

// Playfair itálica (400/500/700) veio em 2026-09-30; a Black reta NÃO foi
// instalada de propósito, pra não mudar os slides antigos que usam F_PLAYFAIR.
export const F_PF_ITALICO = "'Playfair Display',Georgia,serif";
export const F_PF_MEDIO = "'Playfair Display Medium','Playfair Display',Georgia,serif";
export const F_ASPAS = F_PLAYFAIR; // Black Itálica
export { F_ANTON, F_INTER, F_INTER_XB };

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const cache = new Map();
// Largura em px. opts: size, family, weight, style ("italic"), spacing (px).
export async function medir(texto, { size, family = F_INTER, weight = 400, style = "normal", spacing = 0 }) {
  const key = [texto, size, family, weight, style, spacing].join("|");
  if (cache.has(key)) return cache.get(key);
  const pad = Math.ceil(size);
  const w = Math.ceil(String(texto).length * (size + spacing) * 1.4) + pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.ceil(size * 2.2)}">`
    + `<text x="${pad}" y="${Math.round(size * 1.3)}" font-family="${family}" font-size="${size}" font-weight="${weight}"`
    + ` font-style="${style}" letter-spacing="${spacing}" fill="#fff">${esc(texto)}</text></svg>`;
  let largura;
  try {
    const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
    largura = info.width;
  } catch {
    largura = Math.ceil(String(texto).length * size * 0.55);
  }
  cache.set(key, largura);
  return largura;
}

async function gulosa(palavras, maxW, medida) {
  const linhas = []; let cur = "";
  for (const p of palavras) {
    const t = cur ? `${cur} ${p}` : p;
    if (!cur || (await medida(t)) <= maxW) cur = t;
    else { linhas.push(cur); cur = p; }
  }
  if (cur) linhas.push(cur);
  return linhas;
}

// Quebra equilibrada: acha o número de linhas da quebra gulosa e depois a
// MENOR largura que mantém esse número (linhas de tamanho parecido).
export async function quebrarEquilibrado(texto, maxW, medida) {
  const palavras = String(texto || "").split(/\s+/).filter(Boolean);
  const base = await gulosa(palavras, maxW, medida);
  let lo = Math.round(maxW * 0.5), hi = maxW, melhor = base;
  while (hi - lo > 8) {
    const mid = Math.round((lo + hi) / 2);
    const t = await gulosa(palavras, mid, medida);
    if (t.length <= base.length) { melhor = t; hi = mid; } else lo = mid;
  }
  return melhor;
}

// Maior corpo (de fsMax até fsMin, passo 2) em que o texto cabe na caixa.
export async function encaixar(texto, { maxW, maxH, fsMax, fsMin, lh, fonte }) {
  for (let fs = fsMax; fs >= fsMin; fs -= 2) {
    const linhas = await quebrarEquilibrado(texto, maxW, (t) => medir(t, { ...fonte, size: fs }));
    if (linhas.length * fs * lh <= maxH) return { fs, linhas };
  }
  const linhas = await quebrarEquilibrado(texto, maxW, (t) => medir(t, { ...fonte, size: fsMin }));
  return { fs: fsMin, linhas };
}

// Iniciais pro círculo sem foto: "David Letterman" -> "DL",
// "Eddie Vedder e Stone Gossard" -> "E&S", "Pearl Jam" -> "PJ".
export function iniciais(nome) {
  const partes = String(nome || "").split(/\s+e\s+/i).filter(Boolean);
  const maiusc = (s) => s.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
  if (partes.length > 1) return partes.slice(0, 2).map((p) => (maiusc(p)[0] || p)[0].toUpperCase()).join("&");
  const ws = maiusc(partes[0] || "");
  if (!ws.length) return (partes[0] || "?")[0].toUpperCase();
  return (ws[0][0] + (ws.length > 1 ? ws[ws.length - 1][0] : "")).toUpperCase();
}
