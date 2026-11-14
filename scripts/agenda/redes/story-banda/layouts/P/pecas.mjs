// Layout P ("Vs.", homenagem ao álbum de 1993 em DESENHO, sem a foto, o logotipo ou a tipografia da capa): peças
// comuns. Fundo de fotocópia (P&B, riscos de toner, granulado leve em padrão SVG), alambrado em losango que estufa
// onde a ovelha empurra, etiqueta de papel presa no arame com abraçadeiras e varredura de troca de cena. Função pura de T.
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";

export { esc, F_ANTON, F_INTER_XB };
// larguras estimadas: Anton ~0.5 da altura por caractere, Inter ExtraBold ~0.62
export const cabeAnton = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.5));
export const cabeInter = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.62));
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
const f1 = (v) => v.toFixed(1);

// granulado: ladrilho de 180 px com pontos fixos (calculado uma vez; custo de render quase zero)
const PONTOS = Array.from({ length: 260 }, (_, i) => `<circle cx="${f1(rnd(i) * 180)}" cy="${f1(rnd(i + 500) * 180)}" r="${f1(0.7 + rnd(i + 900) * 1.3)}"/>`).join("");
export const grao = (cor, op = cor.graoOp) => {
  const id = novoId("pg");
  return `<pattern id="${id}" width="180" height="180" patternUnits="userSpaceOnUse"><g fill="${cor.grao}">${PONTOS}</g></pattern>
    <rect width="1080" height="1920" fill="url(#${id})" opacity="${op}"/>`;
};

// riscos de toner de fotocópia: faixas horizontais finas em posições fixas
const RISCOS = [140, 410, 655, 980, 1210, 1490, 1760].map((y, i) => ({ y, h: 2 + 5 * rnd(i + 40), op: 0.05 + 0.08 * rnd(i + 70) }));
export const toner = (cor) => RISCOS.map((r) => `<rect x="0" y="${r.y}" width="1080" height="${f1(r.h)}" fill="${cor.grao}" opacity="${r.op.toFixed(3)}"/>`).join("");

// Fundo: papel de fotocópia com vinheta (cantos queimados da xerox), toner e granulado
export function fundo(cor) {
  const v = novoId("pv");
  return `<radialGradient id="${v}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="${cor.bg}"/><stop offset="1" stop-color="${cor.bg2}"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${v})"/>${toner(cor)}${grao(cor)}`;
}

// Alambrado: dois feixes de arame a 45 graus. bojo = { x, y, r, b } estufa a malha (pontos se afastam do centro, como
// a cerca vindo pra frente). Sem bojo, cada arame é uma reta (2 pontos); com bojo, amostra a cada 22 px.
export function cerca(cor, { bojo = null, passo = 150, op = 0.9 } = {}) {
  const desloca = (x, y) => {
    if (!bojo || bojo.b <= 0) return [x, y];
    const dx = x - bojo.x, dy = y - bojo.y, g = Math.exp(-(dx * dx + dy * dy) / (bojo.r * bojo.r)) * bojo.b * 0.42;
    return [x + dx * g, y + dy * g];
  };
  const feixe = (s) => {
    let d = "";
    // feixe 1: x + y = c; feixe 2: y = x + (1920 - c). Nos dois, x vai de max(0, c - 1920) a min(1080, c).
    for (let c = passo / 2; c <= 1080 + 1920; c += passo) {
      const x0 = Math.max(0, c - 1920), x1 = Math.min(1080, c), pts = [];
      if (x1 <= x0) continue;
      const passos = bojo && bojo.b > 0 ? Math.ceil((x1 - x0) / 22) : 1;
      for (let j = 0; j <= passos; j++) {
        const x = x0 + ((x1 - x0) * j) / passos, y = s > 0 ? c - x : 1920 - (c - x);
        pts.push(desloca(x, y));
      }
      d += `M${pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join("L")}`;
    }
    return d;
  };
  const d = feixe(1) + feixe(-1);
  return `<g opacity="${op}" fill="none" stroke-linecap="round"><path d="${d}" stroke="${cor.sombraArame}" stroke-width="7" opacity="0.3" transform="translate(5 7)"/>
    <path d="${d}" stroke="${cor.arame}" stroke-width="4.5"/><path d="${d}" stroke="#ffffff" stroke-width="1.6" opacity="0.28" transform="translate(-1.2 -1.2)"/></g>`;
}

// Abraçadeira de nylon: anel em volta do arame com a ponta cortada pra fora
export const abracadeira = (x, y, rot, cor) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})">
  <rect x="-7" y="-20" width="14" height="40" rx="5" fill="${cor.abracadeira}" stroke="${cor.contorno}" stroke-width="2"/>
  <rect x="-4" y="-34" width="8" height="18" rx="2" fill="${cor.abracadeira}" stroke="${cor.contorno}" stroke-width="2"/></g>`;

// Etiqueta de papel xerox presa no arame: balança de cima pra baixo a partir de `at` (pivô no topo) e assenta em `rot`.
// miolo(x, y, w, h) desenha o conteúdo. face e tinta podem trocar (faixa escura de título).
export function etiqueta(T, { x, y, w, h, rot = 0, at, cor, face = cor.papel, seed = 1, miolo = () => "" }) {
  const k = p(T, at, 0.5, pop);
  if (k <= 0) return "";
  const giro = lerp(-14 + 6 * rnd(seed), rot, Math.min(1.15, k)), cx = x + w / 2, dy = lerp(-260, 0, Math.min(1, p(T, at, 0.3, enter)));
  const id = novoId("pe"), risco = 2 + Math.floor(rnd(seed + 3) * 3);
  const manchas = Array.from({ length: risco }, (_, i) => `<rect x="${x}" y="${f1(y + h * rnd(seed * 7 + i))}" width="${w}" height="${f1(2 + 4 * rnd(seed + i))}" fill="${cor.tinta}" opacity="0.07"/>`).join("");
  return `<g opacity="${Math.min(1, k * 3).toFixed(3)}" transform="translate(0 ${f1(dy)}) rotate(${giro.toFixed(2)} ${cx} ${y})">
    <rect x="${x + 10}" y="${y + 16}" width="${w}" height="${h}" fill="#000" opacity="0.32"/>
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${face}" stroke="${cor.contorno}" stroke-width="3"/><g clip-path="url(#${id})">${manchas}</g>
    ${miolo(x, y, w, h)}${abracadeira(x + 46, y + 22, 8, cor)}${abracadeira(x + w - 46, y + 22, -8, cor)}</g>`;
}

// Texto condensado (Anton) e de apoio (Inter ExtraBold), centralizados em cx por padrão
export const anton = (x, y, t, f, fill, anchor = "middle", ls = 2) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_ANTON}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}">${esc(t)}</text>`;
export const inter = (x, y, t, f, fill, anchor = "middle", op = 1) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_INTER_XB}" font-weight="800" font-size="${f1(f)}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;

// Varredura de fundo subindo (troca de cena)
export const varre = (T, at, cor) => {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  return y < 1920 ? `<g transform="translate(0 ${f1(y)})">${fundo(cor)}</g>` : "";
};
