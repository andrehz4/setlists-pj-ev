// Layout N ("Rádio FM"): peças do receiver anos 70. Dial com escala de 88 a 108 MHz e ponteiro que procura a estação,
// visor iluminado com brilho, VU que pula, botão giratório, grade de alto-falante e gabinete. Tudo função pura de T.
import { p, enter, lerp, clamp } from "../../tempo.mjs";
import { esc, F_INTER_XB } from "../../pecas.mjs";
import { F_INTER, F_ANTON } from "../../../../../publish/fontconfig-boot.mjs";

export { esc, F_INTER_XB, F_INTER, F_ANTON };
export const largAnton = (t, f) => String(t).length * 0.46 * f;
export const largInter = (t, f) => String(t).length * 0.56 * f;
export const cabe = (t, largura, max, larg = largInter) => Math.min(max, largura / larg(t, 1));

// filtro de brilho do visor (vai uma vez no <defs> do quadro)
export const DEFS = `<defs><filter id="nbr" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
export const luz = (svg, op = 0.85) => `<g filter="url(#nbr)" opacity="${op}">${svg}</g>${svg}`;

// frequência fixa por nome: 88.1 a 107.9, sempre decimal ímpar (como no FM brasileiro)
export function freqDe(texto) {
  let h = 7;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) % 100003;
  return 88.1 + (h % 100) * 0.2;
}
export const fmt = (f) => f.toFixed(1);

// ponteiro procurando: sai de `de`, passa do ponto, balança e trava em `ate` entre t0 e t0 + d
export function procura(T, de, ate, t0, d) {
  const k = clamp((T - t0) / d);
  return lerp(de, ate, enter(k)) + 2.2 * Math.sin(k * 15) * (1 - k) * (k > 0 && k < 1 ? 1 : 0);
}

// gabinete: cor de fundo + veio horizontal (madeira, escovado) + friso
export function gabinete(cor) {
  const veios = Array.from({ length: 24 }, (_, i) => {
    const y = 40 + i * 80 + ((i * 37) % 23);
    return `<path d="M0,${y} C300,${y + 14} 700,${y - 12} 1080,${y + 6}" stroke="${cor.veio}" stroke-width="${3 + (i % 3) * 2}" fill="none" opacity="0.7"/>`;
  }).join("");
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>${veios}`;
}

// placa frontal (faceplate) com parafusos nos cantos
export function placa(x, y, w, h, cor) {
  const pf = [[x + 26, y + 26], [x + w - 26, y + 26], [x + 26, y + h - 26], [x + w - 26, y + h - 26]]
    .map(([a, b]) => `<circle cx="${a}" cy="${b}" r="9" fill="${cor.apoio}"/><path d="M${a - 6},${b} L${a + 6},${b}" stroke="${cor.painel}" stroke-width="2.5"/>`).join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${cor.painel}"/>
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="18" fill="none" stroke="${cor.apoio}" stroke-opacity="0.35" stroke-width="2"/>${pf}`;
}

// visor escuro com reflexo de vidro
export const visor = (x, y, w, h, cor) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${cor.visor}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${cor.luz}" opacity="0.05"/>
  <path d="M${x + 16},${y + 10} L${x + w * 0.42},${y + 10} L${x + w * 0.3},${y + h * 0.42} L${x + 16},${y + h * 0.42} Z" fill="#ffffff" opacity="0.04"/>`;

// dial: escala 88 a 108 dentro de (x, y, w, h), ponteiro em `freq`. marcas = [{ f, rotulo }] pra estações do dia.
export function dial(T, { x, y, w, h, freq, cor, marcas = [] }) {
  const fx = (f) => x + 40 + ((f - 88) / 20) * (w - 80);
  let s = visor(x, y, w, h, cor);
  for (let f = 88; f <= 108.01; f += 1) {
    const grande = f % 4 === 0, xx = fx(f);
    s += `<rect x="${(xx - 1.5).toFixed(1)}" y="${y + h * 0.18}" width="3" height="${grande ? h * 0.3 : h * 0.16}" fill="${cor.luz}" opacity="${grande ? 0.9 : 0.5}"/>`;
    if (grande) s += `<text x="${xx.toFixed(1)}" y="${(y + h * 0.78).toFixed(1)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${(h * 0.2).toFixed(1)}" fill="${cor.luz}" opacity="0.75">${f}</text>`;
  }
  s += marcas.map((m) => `<circle cx="${fx(m.f).toFixed(1)}" cy="${(y + h * 0.58).toFixed(1)}" r="${(h * 0.05).toFixed(1)}" fill="${cor.luz}"/>`).join("");
  const px = fx(clamp(freq, 87.6, 108.4));
  s += `<rect x="${(px - 4).toFixed(1)}" y="${y + 8}" width="8" height="${h - 16}" rx="4" fill="${cor.acento}"/>
    <rect x="${(px - 12).toFixed(1)}" y="${y + 8}" width="24" height="${h - 16}" rx="10" fill="${cor.acento}" opacity="0.18"/>`;
  return s + `<text x="${x + w - 24}" y="${y + h * 0.2 + 14}" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="${(h * 0.14).toFixed(1)}" fill="${cor.luz}" opacity="0.55">MHz</text>`;
}

// VU: arco com ponteiro que pula (ruído determinístico por soma de senos)
export function vu(T, { cx, cy, r, cor, semente = 0, rotulo = "VU" }) {
  const n = 0.5 + 0.28 * Math.sin(T * 9.1 + semente) + 0.16 * Math.sin(T * 23.7 + semente * 2) + 0.06 * Math.sin(T * 51 + semente);
  const a = (-50 + 100 * clamp(n)) * Math.PI / 180;
  const arco = (r1) => `M${cx - r1 * Math.sin(50 * Math.PI / 180)},${cy - r1 * Math.cos(50 * Math.PI / 180)} A${r1},${r1} 0 0 1 ${cx + r1 * Math.sin(50 * Math.PI / 180)},${cy - r1 * Math.cos(50 * Math.PI / 180)}`;
  return `<rect x="${cx - r * 1.15}" y="${cy - r * 1.12}" width="${r * 2.3}" height="${r * 1.38}" rx="12" fill="${cor.mostrador}"/>
    <path d="${arco(r * 0.85)}" stroke="#1a1410" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="M${cx + r * 0.85 * Math.sin(20 * Math.PI / 180)},${cy - r * 0.85 * Math.cos(20 * Math.PI / 180)} A${r * 0.85},${r * 0.85} 0 0 1 ${cx + r * 0.85 * Math.sin(50 * Math.PI / 180)},${cy - r * 0.85 * Math.cos(50 * Math.PI / 180)}" stroke="${cor.acento}" stroke-width="7" fill="none"/>
    <text x="${cx}" y="${cy - r * 0.2}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${(r * 0.26).toFixed(1)}" fill="#1a1410" opacity="0.7">${rotulo}</text>
    <path d="M${cx},${cy + r * 0.12} L${(cx + r * 0.95 * Math.sin(a)).toFixed(1)},${(cy - r * 0.95 * Math.cos(a)).toFixed(1)}" stroke="#1a1410" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy + r * 0.12}" r="${r * 0.08}" fill="#1a1410"/>`;
}

// botão giratório com marca de posição
export function botao(cx, cy, r, ang, cor) {
  const rad = (ang - 90) * Math.PI / 180;
  const estrias = Array.from({ length: 24 }, (_, i) => { const t = (i * 15) * Math.PI / 180;
    return `<path d="M${(cx + r * 0.86 * Math.cos(t)).toFixed(1)},${(cy + r * 0.86 * Math.sin(t)).toFixed(1)} L${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}" stroke="${cor.painel}" stroke-width="3"/>`; }).join("");
  return `<circle cx="${cx}" cy="${cy + 6}" r="${r}" fill="#000" opacity="0.3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${cor.botao}"/>${estrias}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.7}" fill="${cor.botao}" stroke="${cor.apoio}" stroke-opacity="0.5" stroke-width="3"/>
    <circle cx="${(cx + r * 0.5 * Math.cos(rad)).toFixed(1)}" cy="${(cy + r * 0.5 * Math.sin(rad)).toFixed(1)}" r="${r * 0.09}" fill="${cor.acento}"/>`;
}

// grade de alto-falante (furinhos) dentro de um círculo
export function grade(cx, cy, r, cor) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cor.painel}"/>`;
  for (let yy = -r + 18; yy < r; yy += 30) for (let xx = -r + 18; xx < r; xx += 30) {
    if (xx * xx + yy * yy < (r - 14) * (r - 14)) s += `<circle cx="${cx + xx}" cy="${cy + yy}" r="6" fill="${cor.visor}" opacity="0.75"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cor.apoio}" stroke-width="6" stroke-opacity="0.6"/>`;
}

// lâmpada "NO AR": acende com tremida entre t0 e t0 + 0.3
export function noAr(T, x, y, t0, cor) {
  const on = T >= t0 && !(T < t0 + 0.3 && Math.floor((T - t0) * 20) % 2 === 1);
  const pill = `<rect x="${x}" y="${y}" width="230" height="74" rx="37" fill="${on ? cor.acento : cor.visor}" stroke="${cor.acento}" stroke-width="4"/>
    <text x="${x + 115}" y="${y + 51}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="38" fill="${on ? "#ffffff" : cor.acento}">NO AR</text>`;
  return on ? `<g filter="url(#nbr)" opacity="0.7"><rect x="${x}" y="${y}" width="230" height="74" rx="37" fill="${cor.acento}"/></g>${pill}` : pill;
}

// texto que sai do chiado: antes de travar mostra letras trocadas, depois o texto certo
const CHIADO = "#%@&*?!/=+";
export function sintoniza(T, texto, t0, d) {
  if (T < t0) return "";
  const k = clamp((T - t0) / d);
  return [...String(texto)].map((c, i) => (c === " " || k >= (i + 1) / String(texto).length ? c : CHIADO[(i * 7 + Math.floor(T * 24)) % CHIADO.length])).join("");
}

export const label = (t, x, y, cor, { f = 28, anc = "start", fill = cor.apoio, op = 1 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anc}" font-family="${F_INTER_XB}" font-weight="800" font-size="${f}" letter-spacing="${(f * 0.12).toFixed(1)}" fill="${fill}" opacity="${op.toFixed ? op.toFixed(3) : op}">${esc(t)}</text>`;
export const entra = (T, t) => p(T, t, 0.3, enter);
