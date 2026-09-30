// Base do reel: medidas, durações padrão, marca, easings (idênticas ao
// MOTION-SPEC), escape XML e medida/quebra de texto. Sem ffmpeg, sem cena.

import sharp from "sharp";
import { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";

export { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR };

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const COLD_DUR = 3.0;
export const BLOCK_DUR = 4.5;
export const OUTRO_DUR = 2.5;

export const F_TYPEWRITER = "'Special Elite',Courier,monospace";

export const BRAND = {
  creme: "#ede4cc",
  ink: "#0a0908",
  sujo: "#f7f1de",
  wordmark: "Só Mais um Fã de PEARL JAM",
  handle: "@smufdpj",
  site: "somaisumfadepearljam.com.br",
};

export const TAG_LABELS = {
  turne: "TURNÊ", lancamento: "LANÇAMENTO", tenclub: "TEN CLUB",
  memoria: "MEMÓRIA", br: "BRASIL", bootleg: "BOOTLEG",
  comunidade: "COMUNIDADE", eddie: "EDDIE", mike: "MIKE",
  stone: "STONE", jeff: "JEFF", matt: "MATT", boom: "BOOM",
  josh: "JOSH", loja: "LOJA",
};

// ============ easings (definicao identica ao spec/animations.jsx) ============
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const linear = (t) => clamp01(t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeOutQuart = (t) => 1 - Math.pow(1 - clamp01(t), 4);
export const easeOutQuad = (t) => { const x = clamp01(t); return 1 - (1 - x) * (1 - x); };
export const easeInCubic = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { const x = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const seg = (t, start, dur, ease = easeOutCubic) => ease(clamp01((t - start) / dur));

// ============ util ============
export function escapeXml(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

// Medicao REAL de texto: renderiza a string com sharp e mede o ink via
// trim. Estimar largura por char nao funciona (Anton renderizado e mais
// largo que a estimativa e as palavras se sobrepoem). Cache por chave.
export const _measureCache = new Map();
export async function measureText(text, { size, family = F_ANTON, weight = null, italic = false, letterSpacing = 0 } = {}) {
  const key = [text, size, family, weight, italic, letterSpacing].join("|");
  if (_measureCache.has(key)) return _measureCache.get(key);
  const pad = Math.ceil(size);
  const cw = Math.ceil(String(text).length * size * 1.4) + pad * 2;
  const ch = Math.ceil(size * 2.2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><text x="${pad}" y="${Math.round(size * 1.3)}" font-family="${family}"${weight ? ` font-weight="${weight}"` : ""}${italic ? ` font-style="italic"` : ""} font-size="${size}"${letterSpacing ? ` letter-spacing="${letterSpacing}"` : ""} fill="#fff">${escapeXml(text)}</text></svg>`;
  let width;
  try {
    const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
    width = info.width;
  } catch {
    width = Math.ceil(String(text).length * size * 0.55);
  }
  _measureCache.set(key, width);
  return width;
}

// Wrap de palavras (fallback sincrono por estimativa, usado nos testes e
// quando nao ha layout medido). Gap de 0.24em entre palavras (spec).
export function wrapWords(text, size, maxWidth, widths = null) {
  const charW = size * 0.5;
  const gap = Math.round(size * 0.24);
  const words = String(text || "").toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [];
  let curW = 0;
  words.forEach((w, i) => {
    const ww = widths ? widths[i] : w.length * charW;
    const next = curW === 0 ? ww : curW + gap + ww;
    if (cur.length && next > maxWidth) {
      lines.push(cur);
      cur = [{ text: w, x: 0, w: ww }];
      curW = ww;
    } else {
      cur.push({ text: w, x: curW === 0 ? 0 : curW + gap, w: ww });
      curW = next;
    }
  });
  if (cur.length) lines.push(cur);
  return lines;
}

// Layout medido: mesma saida do wrapWords, com larguras reais por palavra.
export async function layoutWords(text, size, maxWidth) {
  const words = String(text || "").toUpperCase().split(/\s+/).filter(Boolean);
  const widths = [];
  for (const w of words) widths.push(await measureText(w, { size, family: F_ANTON }));
  return wrapWords(text, size, maxWidth, widths);
}
