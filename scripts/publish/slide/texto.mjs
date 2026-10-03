// Texto dos slides: quebra de linha equilibrada, auto-ajuste da manchete e medida real de largura.
import { F_ANTON } from "../fontconfig-boot.mjs";
import { sharp, escapeXml } from "./base.mjs";

// Distribui as palavras em L linhas de comprimento parelho (rag editorial), minimizando a maior
// linha. Espelha os <br/> manuais do design (linhas curtas, ~3 palavras, sem correr até a borda).
export function splitBalanced(words, L) {
  const total = words.join(" ").length;
  const target = total / L;
  const lines = [];
  let i = 0;
  for (let ln = 0; ln < L; ln++) {
    let line = words[i++] || "";
    while (
      i < words.length &&
      (words.length - i) > (L - ln - 1) && // >=1 palavra por linha restante
      (line + " " + words[i]).length <= Math.ceil(target * 1.12)
    ) {
      line += " " + words[i++];
    }
    lines.push(line);
  }
  while (i < words.length) lines[L - 1] += " " + words[i++];
  return lines;
}

// Quebra editorial: ~3 palavras por linha, equilibrada. null se nem assim cabe (o auto-fit reduz a fonte).
function balancedWrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const startL = Math.min(maxLines, Math.max(1, Math.ceil(words.length / 3)));
  for (let L = startL; L <= maxLines; L++) {
    const lines = splitBalanced(words, L);
    if (lines.every((ln) => ln.length <= maxChars)) return lines;
  }
  return null;
}

// Auto-fit da manchete Anton (condensada, caixa alta). Tenta o tamanho do design primeiro e só reduz
// como rede de segurança se um título longo estourar maxLines. k≈0.46 = avanço médio do glifo Anton.
export function fitHeadline(text, boxW, maxLines, startSize, minSize) {
  const up = String(text || "").toUpperCase();
  for (let fs = startSize; fs >= minSize; fs -= 2) {
    const maxChars = Math.max(6, Math.floor(boxW / (fs * 0.46)));
    const lines = balancedWrap(up, maxChars, maxLines);
    if (lines) return { fs, lines, lh: Math.round(fs * 0.95) };
  }
  // último recurso: menor fonte, split balanceado com reticências
  const maxChars = Math.max(6, Math.floor(boxW / (minSize * 0.46)));
  const lines = splitBalanced(up.split(/\s+/).filter(Boolean), maxLines)
    .map((l) => l.length > maxChars ? l.slice(0, maxChars - 1).replace(/[.,;:!?\s]+$/, "") + "…" : l);
  return { fs: minSize, lines, lh: Math.round(minSize * 0.95) };
}

// Citação em linhas, mantendo a caixa original. Reduz a fonte até caber em maxLines.
export function wrapQuote(text, boxW, maxLines, startSize, minSize) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  for (let fs = startSize; fs >= minSize; fs -= 2) {
    // 0.58 por char: Playfair é largo; estimar baixo faz a linha estourar a largura real.
    const maxChars = Math.max(8, Math.floor(boxW / (fs * 0.58)));
    const lines = []; let cur = "";
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + " " + w).length <= maxChars) cur += " " + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines) return { fs, lines, lh: Math.round(fs * 1.24) };
  }
  return null;
}

// Quebra simples por número de caracteres, com reticências (layout antigo cadernob).
export function wrapText(text, maxChars, maxLines) {
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

// Largura REAL de texto (renderiza e mede a tinta via trim), com cache. Estimar por char erra no Anton.
const _measureCache = new Map();
export async function measureText(text, { size, family = F_ANTON, letterSpacing = 0 } = {}) {
  const key = [text, size, family, letterSpacing].join("|");
  if (_measureCache.has(key)) return _measureCache.get(key);
  const pad = Math.ceil(size);
  const w = Math.ceil(String(text).length * size * 1.4) + pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.ceil(size * 2.2)}">`
    + `<text x="${pad}" y="${Math.round(size * 1.3)}" font-family="${family}" font-size="${size}"`
    + ` letter-spacing="${letterSpacing}" fill="#fff">${escapeXml(text)}</text></svg>`;
  let width;
  try {
    const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
    width = info.width;
  } catch (e) {
    console.warn(`[slide] medida real de "${String(text).slice(0, 30)}" falhou (${e.message}), usando estimativa`);
    width = Math.ceil(String(text).length * size * 0.55);
  }
  _measureCache.set(key, width);
  return width;
}
