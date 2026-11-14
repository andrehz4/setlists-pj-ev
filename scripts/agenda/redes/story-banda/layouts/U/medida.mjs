// Layout U: largura REAL de texto lida do .ttf (cmap formato 4 + hmtx), sem estimar por caractere. Lê cada fonte uma
// vez no import. Sem kerning (Anton e Inter quase não usam em caixa alta), então quem usa deixa uma folga pequena.
import fs from "node:fs";
import { naRaiz } from "../../../../../config.mjs";

function carregar(arquivo) {
  const b = fs.readFileSync(naRaiz(`media/fonts/${arquivo}`)), tab = {};
  for (let i = 0, n = b.readUInt16BE(4); i < n; i++) tab[b.toString("latin1", 12 + i * 16, 16 + i * 16)] = b.readUInt32BE(20 + i * 16);
  const upm = b.readUInt16BE(tab.head + 18), nh = b.readUInt16BE(tab.hhea + 34);
  const avanco = (g) => b.readUInt16BE(tab.hmtx + 4 * Math.min(g, nh - 1));
  let sub = 0; // subtabela Unicode BMP (3,1) ou (0,x) em formato 4
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
  return (ch) => {
    const c = ch.codePointAt(0);
    if (!cache.has(c)) cache.set(c, avanco(glifo(c)) / upm);
    return cache.get(c);
  };
}

const FONTES = { anton: carregar("Anton-Regular.ttf"), inter: carregar("Inter-Regular.ttf"), interB: carregar("Inter-Bold.ttf") };

// largura em px de `t` no corpo `f`, com letter-spacing `ls` (px por letra)
export function largura(t, f, fonte = "anton", ls = 0) {
  const w = FONTES[fonte];
  return [...String(t)].reduce((s, ch) => s + w(ch) * f + ls, 0);
}
// maior corpo (até `max`) em que `t` cabe em `w` px
export const corpoQueCabe = (t, w, max, fonte = "anton", ls = 0) => {
  const n = [...String(t)].length, base = largura(t, 100, fonte, 0) / 100;
  return Math.min(max, (w - n * ls) / Math.max(0.01, base));
};
