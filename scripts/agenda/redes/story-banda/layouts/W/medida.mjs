// Layout W: largura REAL de texto, lida do .ttf (tabela cmap formato 4 + hmtx), pra nada estourar nem encostar.
// Lê cada fonte uma vez no import. Sem kerning: quem usa deixa folga.
import fs from "node:fs";
import { naRaiz } from "../../../../../config.mjs";

function carregar(arquivo) {
  const b = fs.readFileSync(naRaiz(`media/fonts/${arquivo}`)), tab = {};
  for (let i = 0, n = b.readUInt16BE(4); i < n; i++) tab[b.toString("latin1", 12 + i * 16, 16 + i * 16)] = b.readUInt32BE(20 + i * 16);
  const upm = b.readUInt16BE(tab.head + 18), nh = b.readUInt16BE(tab.hhea + 34);
  const avanco = (g) => b.readUInt16BE(tab.hmtx + 4 * Math.min(g, nh - 1));
  let sub = 0; // subtabela Unicode BMP em formato 4
  for (let i = 0, n = b.readUInt16BE(tab.cmap + 2); i < n; i++) {
    const r = tab.cmap + 4 + i * 8, pl = b.readUInt16BE(r), en = b.readUInt16BE(r + 2), off = tab.cmap + b.readUInt32BE(r + 4);
    if (b.readUInt16BE(off) === 4 && ((pl === 3 && en === 1) || pl === 0)) { sub = off; break; }
  }
  const seg = b.readUInt16BE(sub + 6) / 2, fim = sub + 14, ini = fim + seg * 2 + 2, delta = ini + seg * 2, rof = delta + seg * 2;
  const glifo = (c) => {
    for (let i = 0; i < seg; i++) {
      if (c > b.readUInt16BE(fim + i * 2)) continue;
      const s = b.readUInt16BE(ini + i * 2);
      if (c < s) return 0;
      const ro = b.readUInt16BE(rof + i * 2), d = b.readInt16BE(delta + i * 2);
      if (!ro) return (c + d) & 0xffff;
      const g = b.readUInt16BE(rof + i * 2 + ro + (c - s) * 2);
      return g ? (g + d) & 0xffff : 0;
    }
    return 0;
  };
  const cache = new Map();
  return (ch) => { const c = ch.codePointAt(0); if (!cache.has(c)) cache.set(c, avanco(glifo(c)) / upm); return cache.get(c); };
}

const FONTES = { archivo: carregar("ArchivoBlack-Regular.ttf"), mao: carregar("PermanentMarker-Regular.ttf"), sans: carregar("Inter-Bold.ttf"), semi: carregar("Inter-SemiBold.ttf") };

// largura em px de `t` no corpo `f`, com letter-spacing `ls`
export function largura(t, f, fonte = "archivo", ls = 0) {
  const s = [...String(t)];
  return s.reduce((a, ch) => a + FONTES[fonte](ch), 0) * f + ls * Math.max(0, s.length - 1);
}

// corpo que faz `t` caber em `w` px (folga de 4%), sem passar de `max`
export const cabe = (t, w, max, fonte = "archivo", ls = 0) =>
  Math.min(max, (w * 0.96 - ls * Math.max(0, [...String(t)].length - 1)) / Math.max(0.01, largura(t, 1, fonte)));
