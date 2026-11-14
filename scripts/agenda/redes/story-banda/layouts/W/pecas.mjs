// Layout W (homenagem ao clima do álbum de 2009: tirinha de verão, colorida e otimista): peças comuns. Quadro de
// gibi com contorno grosso e sombra chapada, retícula Ben-Day, balão de fala com rabicho, recordatório, estrela de
// onomatopeia, fundo de sarjeta com meio-tom e texto datilografado com cursor. Tudo função pura de T.
import { esc } from "../../pecas.mjs";
import { largura } from "./medida.mjs";

export { esc };
export const FAM = {
  archivo: ["'Archivo Black','Inter ExtraBold',sans-serif", 400], mao: ["'Permanent Marker','Archivo Black',cursive", 400],
  sans: ["'Inter',system-ui,sans-serif", 700], semi: ["'Inter',system-ui,sans-serif", 600],
};
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
export const op3 = (v) => Math.max(0, Math.min(1, v)).toFixed(3);
export const LINHA = 7; // contorno do quadro (gibi pede traço grosso; desenho interno usa 2 a 3.5)

// texto; contorno = [cor, largura] desenha a borda por trás (paint-order) como letreiro de gibi
export function txt(x, y, t, f, fill, { fonte = "archivo", anchor = "middle", ls = 0, op = 1, rot = 0, contorno = null } = {}) {
  const [fam, w] = FAM[fonte], r = rot ? ` transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"` : "";
  const c = contorno ? ` stroke="${contorno[0]}" stroke-width="${contorno[1]}" stroke-linejoin="round" paint-order="stroke"` : "";
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op3(op)}"${r}${c}>${esc(t)}</text>`;
}

// retícula Ben-Day: pontos a 45 graus; devolve { def, url }
export function reticula(cor, passo = 16, raio = 3.2, op = 1) {
  const id = novoId("wr");
  return { url: `url(#${id})`, def: `<pattern id="${id}" width="${passo}" height="${passo}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx="${passo / 2}" cy="${passo / 2}" r="${raio}" fill="${cor}" opacity="${op}"/></pattern>` };
}

// Quadro de gibi: sombra chapada deslocada, fundo (cor + retícula opcional), miolo recortado e contorno grosso.
// k (0..1) abre o quadro a partir de `origem` (cantos "tl", "tr", "bl", "br" ou "c"), com leve inclinação `rot`.
export function painel(x, y, w, h, cor, { fill, pontos = null, k = 1, origem = "c", rot = 0 } = {}, miolo = "") {
  if (k <= 0) return "";
  const cl = novoId("wc"), ox = origem.includes("l") ? x : origem.includes("r") ? x + w : x + w / 2;
  const oy = origem.includes("t") ? y : origem.includes("b") ? y + h : y + h / 2, ret = pontos ? reticula(pontos[0], pontos[1], pontos[2], pontos[3]) : null;
  return `<g transform="translate(${f1(ox)} ${f1(oy)}) rotate(${f1(rot)}) scale(${k.toFixed(3)}) translate(${f1(-ox)} ${f1(-oy)})">
    <rect x="${x + 12}" y="${y + 14}" width="${w}" height="${h}" fill="${cor.sombra}" opacity="${cor.sombraOp}"/>
    <clipPath id="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <g clip-path="url(#${cl})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill || cor.painel}"/>${ret ? `${ret.def}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ret.url}"/>` : ""}${miolo}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${cor.linha}" stroke-width="${LINHA}" stroke-linejoin="miter"/></g>`;
}

// Balão de fala: elipse arredondada + rabicho até (tx, ty). Traça tudo e preenche por cima pra sumir a costura.
export function balao(cx, cy, w, h, cor, { tx, ty, k = 1, fill } = {}) {
  if (k <= 0) return "";
  const rx = w / 2, ry = h / 2, ang = Math.atan2(ty - cy, tx - cx), base = 0.22;
  const pt = (a, s = 0.86) => [cx + Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s];
  const [a1, b1] = pt(ang - base), [a2, b2] = pt(ang + base);
  const cauda = `M${f1(a1)},${f1(b1)} Q${f1((a1 + tx) / 2 + 10)},${f1((b1 + ty) / 2)} ${f1(tx)},${f1(ty)} Q${f1((a2 + tx) / 2)},${f1((b2 + ty) / 2 - 6)} ${f1(a2)},${f1(b2)} Z`;
  const elip = `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"`, fl = fill || cor.balao;
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${k.toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})">
    ${elip} fill="${cor.sombra}" opacity="${cor.sombraOp}" transform="translate(8 10)"/>
    ${elip} fill="none" stroke="${cor.linha}" stroke-width="10"/><path d="${cauda}" fill="none" stroke="${cor.linha}" stroke-width="10" stroke-linejoin="round"/>
    ${elip} fill="${fl}"/><path d="${cauda}" fill="${fl}"/></g>`;
}

// Recordatório (caixa de narração retangular, presa no canto do quadro)
export const legenda = (x, y, w, h, cor, fill, miolo = "", rot = 0) => `<g transform="rotate(${f1(rot)} ${f1(x + w / 2)} ${f1(y + h / 2)})">
  <rect x="${x + 7}" y="${y + 8}" width="${w}" height="${h}" fill="${cor.sombra}" opacity="${cor.sombraOp}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${cor.linha}" stroke-width="4.5"/>${miolo}</g>`;

// Estrela de onomatopeia (pontas irregulares, determinísticas pela semente)
export function estrela(cx, cy, r1, r2, n, fill, cor, { semente = 1, k = 1, rot = 0 } = {}) {
  if (k <= 0) return "";
  const pts = Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r2 : r1 * (0.82 + rnd(semente + i) * 0.3);
    return `${f1(Math.cos(a) * r)},${f1(Math.sin(a) * r)}`; }).join(" ");
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${k.toFixed(3)})"><polygon points="${pts}" fill="${cor.sombra}" opacity="${cor.sombraOp}" transform="translate(8 10)"/>
    <polygon points="${pts}" fill="${fill}" stroke="${cor.linha}" stroke-width="6" stroke-linejoin="round"/></g>`;
}

// Fundo de sarjeta: cor chapada com meio-tom que engrossa pra baixo (cache por tema, é o pedaço mais pesado)
const _fundo = new Map();
export function fundo(cor) {
  if (_fundo.has(cor.nome)) return _fundo.get(cor.nome);
  const pts = [];
  for (let j = 0; j < 56; j++) for (let i = 0; i < 31; i++) {
    const r = 1 + (j / 56) * 9;
    if (r > 1.6) pts.push(`<circle cx="${i * 36 + (j % 2) * 18}" cy="${j * 36}" r="${f1(r)}"/>`);
  }
  const s = `<rect width="1080" height="1920" fill="${cor.bg}"/><g fill="${cor.bgPonto}" opacity="${cor.bgPontoOp}">${pts.join("")}</g>`;
  _fundo.set(cor.nome, s);
  return s;
}

// Máquina de escrever: quanto de `t` já foi batido em k (0..1); `apaga` (0..1) come do fim pro começo
export const batido = (t, k, apaga = 0) => { const c = [...t], n = Math.round(c.length * Math.min(1, k)); return c.slice(0, Math.round(n * (1 - apaga))).join(""); };
// texto datilografado (Inter SemiBold com espaçamento) + cursor que pisca; ancorado à esquerda
export function datilo(x, y, t, f, fill, { cursor = true, T = 0, ls = 2 } = {}) {
  const w = largura(t, f, "semi", ls), pisca = Math.floor(T * 4) % 2 === 0;
  return txt(x, y, t, f, fill, { fonte: "semi", anchor: "start", ls }) +
    (cursor && pisca ? `<rect x="${f1(x + w + 6)}" y="${f1(y - f * 0.78)}" width="${f1(f * 0.5)}" height="${f1(f * 0.92)}" fill="${fill}" opacity="0.85"/>` : "");
}
