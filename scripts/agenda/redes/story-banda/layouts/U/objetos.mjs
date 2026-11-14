// Layout U: objetos de repartição desenhados em SVG. Carimbo de borracha com falhas de tinta (cai com escala e
// assenta), grampo, clipe de arame, círculo de caneta esferográfica, assinatura rabiscada e carimbo redondo.
// Traços que "se desenham" usam pathLength + stroke-dashoffset (k de 0 a 1).
import { p, pop, lerp } from "../../tempo.mjs";
import { rnd, novoId, f1, F_ANTON, esc, corpoQueCabe } from "./pecas.mjs";

const traco = (d, cor, w, k = 1, extra = "") => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"
  pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - Math.min(1, Math.max(0, k))).toFixed(3)}" ${extra}/>`;

// falhas de tinta: pontinhos e riscos que a máscara tira do carimbo (fixos por semente)
const falhas = (w, h, seed, n = Math.round(Math.min(46, (w * h) / 2600))) => Array.from({ length: n }, (_, i) => {
  const a = rnd(seed * 11 + i), b = rnd(seed * 17 + i * 3), r = 1.1 + rnd(seed + i * 5) * 2.8;
  return i % 9 ? `<circle cx="${f1(a * w)}" cy="${f1(b * h)}" r="${f1(r)}"/>` : `<rect x="${f1(a * w)}" y="${f1(b * h)}" width="${f1(r * 6)}" height="${f1(r * 0.5)}"/>`;
}).join("");

// Carimbo retangular: borda dupla e linhas em Anton medidas de verdade. Cai em `at` (escala 1.7 -> 1, pop).
export function carimbo(T, { cx, cy, w, linhas, at, rot = -6, cor, tinta = cor.carimbo, fMax = 90, ls = 4, seed = 1, op = 0.9 }) {
  const k = p(T, at, 0.32, pop);
  if (k <= 0) return "";
  const f = Math.min(...linhas.map((l) => corpoQueCabe(l, w - 70, fMax, "anton", ls))), lh = f * 1.1, h = 46 + linhas.length * lh;
  const m = novoId("ux"), esc2 = lerp(1.7, 1, Math.min(1, k)), x0 = -w / 2, y0 = -h / 2;
  const texto = linhas.map((l, i) => `<text x="${ls / 2}" y="${f1(y0 + 23 + (i + 0.86) * lh)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${tinta}">${esc(l)}</text>`).join("");
  return `<g opacity="${Math.min(op, k * 3).toFixed(3)}" transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${esc2.toFixed(3)})">
    <mask id="${m}"><rect x="${x0 - 20}" y="${y0 - 20}" width="${w + 40}" height="${h + 40}" fill="#fff"/><g fill="#000" transform="translate(${x0} ${y0})">${falhas(w, h, seed)}</g></mask>
    <g mask="url(#${m})"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="10" fill="none" stroke="${tinta}" stroke-width="7"/>
    <rect x="${x0 + 13}" y="${y0 + 13}" width="${w - 26}" height="${h - 26}" rx="5" fill="none" stroke="${tinta}" stroke-width="2.4"/>${texto}</g></g>`;
}
export const alturaCarimbo = (linhas, w, fMax = 90, ls = 4) => 46 + linhas.length * 1.1 * Math.min(...linhas.map((l) => corpoQueCabe(l, w - 70, fMax, "anton", ls)));

// Carimbo redondo de visto: dois anéis, texto no meio e estrelinhas
export function carimboRedondo(T, { cx, cy, r = 110, cima, meio, at, rot = 12, cor, seed = 5 }) {
  const k = p(T, at, 0.3, pop);
  if (k <= 0) return "";
  const m = novoId("ux"), t = cor.carimbo, fm = corpoQueCabe(meio, r * 1.5, r * 0.42, "anton", 2), fc = corpoQueCabe(cima, r * 1.25, r * 0.2, "anton", 3);
  return `<g opacity="${Math.min(0.88, k * 3).toFixed(3)}" transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${lerp(1.6, 1, Math.min(1, k)).toFixed(3)})">
    <mask id="${m}"><rect x="${-r - 10}" y="${-r - 10}" width="${2 * r + 20}" height="${2 * r + 20}" fill="#fff"/><g fill="#000" transform="translate(${-r} ${-r})">${falhas(2 * r, 2 * r, seed, 30)}</g></mask>
    <g mask="url(#${m})" fill="${t}"><circle r="${r}" fill="none" stroke="${t}" stroke-width="6"/><circle r="${r - 14}" fill="none" stroke="${t}" stroke-width="2"/>
    <text y="${f1(-r * 0.36)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f1(fc)}" letter-spacing="3">${esc(cima)}</text>
    <text y="${f1(fm * 0.36)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f1(fm)}" letter-spacing="2">${esc(meio)}</text>
    <path d="M${-r * 0.55},${r * 0.42} H${r * 0.55}" stroke="${t}" stroke-width="2.5"/>
    ${[-0.3, 0, 0.3].map((a) => `<circle cx="${f1(a * r)}" cy="${f1(r * 0.6)}" r="4"/>`).join("")}</g></g>`;
}

// Grampo visto de frente: barra de metal fina com as pernas entrando no papel
export const grampo = (x, y, rot, cor, w = 74) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})">
  <rect x="${-w / 2 + 2}" y="1" width="${w}" height="7" rx="2" fill="#000" opacity="0.3"/>
  <rect x="${-w / 2 - 1}" y="-4" width="5" height="9" fill="#000" opacity="0.45"/><rect x="${w / 2 - 4}" y="-4" width="5" height="9" fill="#000" opacity="0.45"/>
  <rect x="${-w / 2}" y="-3.5" width="${w}" height="7" rx="2" fill="${cor.metal}" stroke="${cor.metal2}" stroke-width="1"/>
  <rect x="${-w / 2 + 4}" y="-2.4" width="${w - 8}" height="1.6" fill="#fff" opacity="0.6"/></g>`;

// Clipe de arame (comprimento ~170 em s = 1), preso na borda do papel
export function clipe(x, y, rot, cor, s = 1) {
  const d = "M14,46 V-58 A14,14 0 0 1 42,-58 V62 A21,21 0 0 1 0,62 V-72 A28,28 0 0 1 56,-72 V38";
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})" fill="none" stroke-linecap="round">
    <path d="${d}" stroke="#000" stroke-width="6" opacity="0.28" transform="translate(5 7)"/><path d="${d}" stroke="${cor.metal2}" stroke-width="6"/>
    <path d="${d}" stroke="${cor.metal}" stroke-width="3.6"/><path d="${d}" stroke="#fff" stroke-width="1.2" opacity="0.55" transform="translate(-0.8 -0.8)"/></g>`;
}

// Círculo de caneta: volta e pouco, raio irregular; o x marca o ponto exato
export function circuloCaneta(cx, cy, r, k, cor, seed = 1) {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const a = -1.9 + (i / 40) * Math.PI * 2.25, rr = r * (1 + 0.1 * Math.sin(i * 0.7 + seed) + 0.06 * (rnd(seed * 7 + i) - 0.5)) * (1 - 0.08 * (i / 40));
    return `${f1(cx + Math.cos(a) * rr * 1.08)},${f1(cy + Math.sin(a) * rr)}`;
  });
  return traco(`M${pts.join("L")}`, cor.caneta, 3.4, k, 'opacity="0.9"') +
    (k > 0.4 ? `<path d="M${cx - 8},${cy - 8} L${cx + 8},${cy + 8} M${cx + 8},${cy - 8} L${cx - 8},${cy + 8}" stroke="${cor.caneta}" stroke-width="3" stroke-linecap="round"/>` : "");
}

// Assinatura rabiscada (largura ~ 420 em s = 1) com o floreio de sublinhado
const RABISCO = "M0,40 C10,-10 40,-30 46,0 C52,30 20,70 34,44 C50,14 70,-6 78,16 C84,34 72,52 88,40 C104,26 112,8 122,22 C130,36 120,50 136,42" +
  " C150,34 160,6 176,-18 C186,-34 196,-26 186,0 C176,30 168,58 184,44 C204,26 214,10 226,26 C236,40 228,54 246,44" +
  " C266,32 280,12 296,22 C310,32 300,52 322,46 C346,40 370,24 392,30 M-6,70 C90,58 220,62 410,52 C380,64 350,70 330,78";
export const assinatura = (x, y, s, k, cor) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${traco(RABISCO, cor.caneta, 3.2 / s, k)}</g>`;
