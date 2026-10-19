// Peças do carrossel "Agenda da semana" no estilo ingresso (desenho do Claude Design, proposta 1b/2b, em
// design-handoff/retorno/agenda-semana/). SVG puro pro sharp/librsvg: sem CSS, sem quebra automática.
import { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../../../publish/fontconfig-boot.mjs";

export const W = 1080, H = 1350;
export const CREME = "#ede4cc", CREME2 = "#f7f1de", TINTA = "#0a0908";
export const ASSIN = "Só Mais um Fã de PEARL JAM";
export const RODAPE = "agenda completa: somaisumfadepearljam.com.br/agenda";

// base: fundo da vez · texto: acento de texto pequeno sobre creme · marca: áreas · titulo: título grande sobre creme.
// No vermelho o acento escurece (#c40500): a data em vermelho puro sumia no fundo vermelho da arte antiga.
export const CORES = {
  preto: { base: "#0a0a0a", texto: "#c40500", marca: "#E10600", titulo: TINTA },
  vermelho: { base: "#E10600", texto: "#c40500", marca: "#E10600", titulo: "#E10600" },
  ocre: { base: "#a87f2c", texto: "#7d5c1a", marca: "#a87f2c", titulo: "#7d5c1a" },
  azul: { base: "#2a5b9e", texto: "#2a5b9e", marca: "#2a5b9e", titulo: "#2a5b9e" },
};
const POR_HEX = { "#0a0a0a": "preto", "#e10600": "vermelho", "#a87f2c": "ocre", "#2a5b9e": "azul" };
export const corDoCiclo = (hex) => POR_HEX[String(hex || "").toLowerCase()] || "azul";

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const n1 = (v) => Math.round(v * 10) / 10;
const ymd = (iso) => iso.split("-").map(Number);
export const dm = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
export const diaSem = (iso) => { const [y, m, d] = ymd(iso); return DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; };
export function semanaIso(iso) {
  const [y, m, d] = ymd(iso); const t = new Date(Date.UTC(y, m - 1, d));
  const dn = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dn + 3);
  const f = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - f) / 864e5 - 3 + ((f.getUTCDay() + 6) % 7)) / 7);
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Largura estimada (em em) por caractere, conservadora: melhor sobrar que estourar (teste com a fonte real em
// carrossel.test.mjs).
function cw(ch, f) {
  if (f === "anton") {
    if (ch === " ") return .2; if ("IJ1.,:!".includes(ch)) return .27; if ("MW".includes(ch)) return .62;
    if (ch === "/") return .32; if (ch === "@") return .72; if (ch === "_") return .42; return .47;
  }
  const xb = f === "xb" || f === "b";
  if (ch === " ") return .27; if ("il.,:;|'!".includes(ch)) return .28; if ("IJ1/".includes(ch)) return .4;
  if (ch === "@") return .96; if ("MW".includes(ch)) return .92; if ("mw".includes(ch)) return .84;
  if (/[A-ZÁÃÂÀÉÊÍÓÕÔÚÇ]/.test(ch)) return xb ? .72 : .68;
  if (/[0-9]/.test(ch)) return xb ? .65 : .61;
  return xb ? .6 : .56;
}
export function medir(t, size, f) { let w = 0; for (const ch of t) w += cw(ch, f); return w * size * 1.03; }
export const caber = (t, size, f, maxW) => { const w = medir(t, size, f); return w <= maxW ? size : Math.floor(size * maxW / w); };

const FA = {
  anton: () => `font-family="${F_ANTON}"`,
  xb: () => `font-family="${F_INTER_XB}" font-weight="800"`,
  b: () => `font-family="${F_INTER}" font-weight="700"`,
  sb: () => `font-family="${F_INTER_SB}" font-weight="600"`,
  r: () => `font-family="${F_INTER}" font-weight="400"`,
  pf: () => `font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900"`,
};
export const fonte = (f) => FA[f]();
export function txt(x, y, s, o) {
  return `<text x="${n1(x)}" y="${n1(y)}" ${FA[o.f]()} font-size="${n1(o.size)}" fill="${o.fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.op != null ? ` opacity="${o.op}"` : ""}${o.tf ? ` transform="${o.tf}"` : ""}>${esc(s)}</text>`;
}
export const tspan = (s, o) => `<tspan ${FA[o.f]()} font-size="${n1(o.size)}" fill="${o.fill}">${esc(s)}</tspan>`;

export function grao(id, cor, seed, n, size, rMin, rMax, oMin, oMax) {
  const r = rng(seed); let c = "";
  for (let i = 0; i < n; i++) c += `<circle cx="${n1(r() * size)}" cy="${n1(r() * size)}" r="${(rMin + r() * (rMax - rMin)).toFixed(2)}" fill="${cor}" opacity="${(oMin + r() * (oMax - oMin)).toFixed(2)}"/>`;
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${c}</pattern>`;
}
export const ticket = (x, y, w, h, sx, r) => `M${n1(x)},${n1(y)} H${n1(sx - r)} A${n1(r)},${n1(r)} 0 0 0 ${n1(sx + r)},${n1(y)} H${n1(x + w)} V${n1(y + h)} H${n1(sx + r)} A${n1(r)},${n1(r)} 0 0 0 ${n1(sx - r)},${n1(y + h)} H${n1(x)} Z`;
export const abre = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

// Fundo da vez escurecido 22% + retícula de xerox (o preto fica sem véu).
export function fundoIngresso(p, corId) {
  const c = CORES[corId], escuro = corId === "preto";
  return [`<defs>
<pattern id="${p}h" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="8" cy="8" r="2.2" fill="${escuro ? CREME : "#000"}" opacity="${escuro ? .06 : .13}"/></pattern>
${grao(p + "g", TINTA, 4, 70, 150, .5, 1.4, .05, .14)}
${grao(p + "f", "#000", 9, 110, 90, .6, 2.4, 1, 1)}
<mask id="${p}m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect width="${W}" height="${H}" fill="url(#${p}f)"/></mask>
<filter id="${p}s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>`,
  `<rect width="${W}" height="${H}" fill="${c.base}"/>${escuro ? "" : `<rect width="${W}" height="${H}" fill="#000" opacity=".22"/>`}<rect width="${W}" height="${H}" fill="url(#${p}h)"/>`];
}
export function ingressoGrande(p, x, y, w, h, sx, cor) {
  const tp = ticket(x, y, w, h, sx, 22);
  return [`<path d="${tp}" fill="#000" opacity=".4" filter="url(#${p}s)" transform="translate(6,9)"/>`,
    `<path d="${tp}" fill="${cor}"/><path d="${tp}" fill="url(#${p}g)"/>`,
    `<line x1="${sx}" y1="${y + 34}" x2="${sx}" y2="${y + h - 34}" stroke="${TINTA}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 14" opacity=".35"/>`];
}
// Código de barras falso (determinístico) a partir de x0, largura w.
export function barras(x0, w, y, h, seed = 23) {
  const r = rng(seed), out = [];
  let bx = x0; while (bx < x0 + w) { const bw = 2 + Math.floor(r() * 4); out.push(`<rect x="${bx}" y="${y}" width="${bw}" height="${h}" fill="${TINTA}"/>`); bx += bw + 2 + Math.floor(r() * 4); }
  return out;
}
