// Layout O ("Ten", homenagem ao álbum de 1991, sem copiar a capa): peças comuns. Fundo rosa com luz de palco,
// placa de compensado recortada (face pintada, borda crua de madeira com espessura e veio), mão erguida em silhueta
// genérica e multidão de mãos que sobe e balança. Tudo função pura de T.
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";

export const F_MARKER = "'Permanent Marker','Archivo Black','Inter ExtraBold',sans-serif";
export { esc, F_ANTON, F_INTER_XB };
// larguras estimadas: Permanent Marker em caixa alta ~0.7 da altura por caractere, Anton ~0.5, Inter ~0.62
export const cabeMarker = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.7));
export const cabeAnton = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.5));
export const cabeInter = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.62));

let _id = 0;
const novoId = (pre) => `${pre}${++_id}`;
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// Fundo: degradê rosa, cone de luz de palco vindo de cima e vinheta
export function fundo(cor) {
  const g = novoId("og"), l = novoId("ol");
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.bg1}"/><stop offset="1" stop-color="${cor.bg2}"/></linearGradient>
    <radialGradient id="${l}" cx="0.5" cy="0.05" r="0.75"><stop offset="0" stop-color="${cor.luz}" stop-opacity="0.55"/><stop offset="1" stop-color="${cor.luz}" stop-opacity="0"/></radialGradient></defs>
    <rect width="1080" height="1920" fill="url(#${g})"/><path d="M380,0 L700,0 L1080,1500 L0,1500 Z" fill="url(#${l})"/>`;
}

// contorno de compensado recortado: retângulo com cantos chanfrados irregulares (sempre os mesmos pra mesma semente)
function recorte(x, y, w, h, seed) {
  const c = (i) => 18 + 34 * rnd(seed + i);
  return `M${x + c(1)},${y} L${x + w - c(2)},${y + 4 * rnd(seed + 9)} L${x + w},${y + c(3)} L${x + w - 3},${y + h - c(4)} L${x + w - c(5)},${y + h}
    L${x + c(6)},${y + h - 3} L${x},${y + h - c(7)} L${x + 4 * rnd(seed + 8)},${y + c(8)} Z`;
}

// Placa: { svg }. Sobe de baixo com pop a partir de `at`, gira `rot`. miolo(x, y, w, h) desenha por cima da face.
export function placa(T, { x, y, w, h, rot = 0, at, cor, face = cor.placa, seed = 1, miolo = () => "", dur = 0.45 }) {
  const k = p(T, at, dur, pop);
  if (k <= 0) return "";
  const dy = lerp(700, 0, Math.min(1, k)) + (k > 1 ? (1 - k) * 40 : 0), cx = x + w / 2, cy = y + h / 2;
  const forma = recorte(x, y, w, h, seed), id = novoId("oc");
  const veio = Array.from({ length: 7 }, (_, i) => {
    const yy = y + (h / 7) * (i + 0.5), a = 10 + 14 * rnd(seed * 5 + i);
    return `<path d="M${x},${yy.toFixed(1)} C${x + w * 0.3},${(yy - a).toFixed(1)} ${x + w * 0.6},${(yy + a).toFixed(1)} ${x + w},${(yy - a / 2).toFixed(1)}" fill="none" stroke="${cor.veio}" stroke-width="3" opacity="0.16"/>`;
  }).join("");
  return `<g opacity="${Math.min(1, k * 3).toFixed(3)}" transform="translate(0 ${dy.toFixed(1)}) rotate(${rot} ${cx} ${cy})">
    <path d="${forma}" transform="translate(14 20)" fill="#000" opacity="0.25"/><path d="${forma}" transform="translate(8 11)" fill="${cor.borda}"/>
    <clipPath id="${id}"><path d="${forma}"/></clipPath><path d="${forma}" fill="${face}"/><g clip-path="url(#${id})">${veio}</g>${miolo(x, y, w, h)}</g>`;
}

// Mão erguida, silhueta genérica (braço, palma, 4 dedos e polegar). Base do braço em (0, 0), dedos pra cima.
export function mao(x, y, s, rot, cor, espelha = false) {
  const dedos = [[-54, 108], [-25, 132], [4, 126], [33, 100]].map(([dx, hh]) => `<rect x="${dx}" y="${-300 - hh}" width="25" height="${hh + 30}" rx="12.5"/>`).join("");
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${espelha ? -s : s} ${s})" fill="${cor.mao}">
    <rect x="-30" y="-210" width="60" height="240" rx="26"/><rect x="-58" y="-320" width="116" height="140" rx="42"/>${dedos}
    <rect x="-28" y="-250" width="28" height="96" rx="14" transform="rotate(-38 -58 -230)"/></g>`;
}

// Multidão de mãos no pé da tela: sobem a partir de `at` e balançam devagar. n mãos, altura base yBase.
export function multidao(T, { at, cor, n = 7, yBase = 2010, s = 0.95, alto = 0 }) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const k = p(T, at + i * 0.07, 0.5, enter), x = 60 + (960 / (n - 1)) * i + (rnd(i + 3) - 0.5) * 50;
    if (k <= 0) continue;
    const sobe = lerp(500, 0, k) - alto * rnd(i + 11), balanca = Math.sin(T * 2.2 + i * 1.3) * 6;
    out += mao(x, yBase + sobe + 120 * rnd(i + 7), s * (0.85 + 0.3 * rnd(i + 5)), balanca + (rnd(i) - 0.5) * 20, cor, i % 2 === 1);
  }
  return `<g opacity="0.96">${out}</g>`;
}

// Texto pintado à mão (Permanent Marker), centralizado em cx
export const pintado = (cx, y, t, f, fill, rot = 0) =>
  `<text x="${cx}" y="${y.toFixed(1)}" text-anchor="middle" font-family="${F_MARKER}" font-size="${f.toFixed(1)}" fill="${fill}" transform="rotate(${rot} ${cx} ${y.toFixed(1)})">${esc(t)}</text>`;

// Varredura de fundo subindo (troca de cena)
export const varre = (T, at, cor) => {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  return y < 1920 ? `<g transform="translate(0 ${y.toFixed(1)})">${fundo(cor)}</g>` : "";
};

