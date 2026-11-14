// Layout Y (homenagem ao clima do álbum de 2020: gelo e degelo, sem foto, sem logotipo e sem o nome do disco): peças
// comuns. Céu polar com estrelas e aurora em cortinas, água escura com reflexos, grão fino e texto medido de verdade.
// Tudo função pura de T.
import { p, enter, lerp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";
import { cabe, largura } from "./medida.mjs";

export { esc, cabe, largura };
export const F_SB = "'Inter SemiBold','Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
export const f3 = (v) => v.toFixed(3);

// Texto. fonte: "anton" (títulos), "xb" (Inter ExtraBold) ou "sb" (Inter SemiBold)
export function txt(x, y, t, f, fill, { anchor = "middle", fonte = "anton", ls = 0, op = 1, extra = "" } = {}) {
  const fam = fonte === "anton" ? F_ANTON : fonte === "xb" ? F_INTER_XB : F_SB, w = fonte === "xb" ? 800 : fonte === "sb" ? 600 : 400;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${f3(op)}" ${extra}>${esc(t)}</text>`;
}

// Texto gravado no gelo: sulco escuro deslocado pra cima, luz pra baixo e o miolo por cima (efeito de entalhe)
export const gravado = (x, y, t, f, cor, o = {}) => txt(x, y - 2.5, t, f, cor.gelo3, { ...o, op: (o.op ?? 1) * 0.9 }) +
  txt(x, y + 2, t, f, cor.brilho, { ...o, op: (o.op ?? 1) * 0.7 }) + txt(x, y, t, f, cor.entalhe, o);

// Grão: ladrilho de 240 px com pontinhos fixos (custo quase zero por quadro)
const PONTOS = Array.from({ length: 260 }, (_, i) => `<circle cx="${f1(rnd(i) * 240)}" cy="${f1(rnd(i + 300) * 240)}" r="${f1(0.5 + rnd(i + 700) * 0.9)}"/>`).join("");
export const grao = (fill, op) => { const id = novoId("yg");
  return `<pattern id="${id}" width="240" height="240" patternUnits="userSpaceOnUse"><g fill="${fill}">${PONTOS}</g></pattern><rect width="1080" height="1920" fill="url(#${id})" opacity="${op}"/>`; };

// Estrelas fixas (só no céu), com cintilar leve por T
const ESTRELAS = Array.from({ length: 90 }, (_, i) => [rnd(i + 31) * 1080, rnd(i + 131) * 1100, 0.6 + rnd(i + 231) * 1.6, rnd(i + 331) * 6]);
const estrelas = (T, cor) => `<g fill="${cor.estrela}">${ESTRELAS.map(([x, y, r, f]) =>
  `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" opacity="${f3(cor.estrelaOp * (0.55 + 0.45 * Math.sin(T * 2.2 + f)))}"/>`).join("")}</g>`;

// Uma cortina de aurora: faixa ondulada com degradê vertical (some em cima e embaixo) e raios finos verticais
function cortina(T, y, amp, fase, fill1, fill2, op) {
  const g = novoId("ya"), r = novoId("yr"), m = novoId("ym"), pts = [];
  for (let i = 0; i <= 12; i++) { const x = -60 + i * 100; pts.push([x, y + amp * Math.sin(i * 0.7 + fase + T * 0.35) + 30 * Math.sin(i * 1.9 + fase)]); }
  const topo = pts.map(([x, yy]) => `${f1(x)},${f1(yy - 230)}`).join(" L"), base = pts.slice().reverse().map(([x, yy]) => `${f1(x)},${f1(yy + 60)}`).join(" L");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fill2}" stop-opacity="0"/><stop offset="0.55" stop-color="${fill2}" stop-opacity="0.55"/><stop offset="0.85" stop-color="${fill1}" stop-opacity="0.9"/><stop offset="1" stop-color="${fill1}" stop-opacity="0"/></linearGradient>
    <pattern id="${r}" width="14" height="40" patternUnits="userSpaceOnUse"><rect width="14" height="40" fill="#fff" opacity="0.55"/><rect x="${f1(4 + 3 * Math.sin(fase))}" width="2.2" height="40" fill="#fff"/></pattern>
    <mask id="${m}"><rect x="-60" y="0" width="1200" height="1920" fill="url(#${r})"/></mask>
    <path d="M${topo} L${base} Z" fill="url(#${g})" opacity="${f3(op)}" mask="url(#${m})"/>`;
}

// Céu polar: degradê frio, estrelas, aurora em três cortinas (k = quanto da aurora já se acendeu)
export function ceu(T, cor, { k = 1, horizonte = 1180 } = {}) {
  const g = novoId("yc"), bl = novoId("yb");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.ceu1}"/><stop offset="0.7" stop-color="${cor.ceu2}"/><stop offset="1" stop-color="${cor.ceu3}"/></linearGradient>
    <filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
    <rect width="1080" height="${horizonte + 2}" fill="url(#${g})"/>${estrelas(T, cor)}
    <g filter="url(#${bl})">${cortina(T, 520, 60, 0, cor.aurora1, cor.aurora2, 0.75 * k)}${cortina(T, 700, 80, 2.1, cor.aurora2, cor.aurora1, 0.5 * k)}${cortina(T, 380, 50, 4.2, cor.aurora1, cor.aurora3, 0.35 * k)}</g>`;
}

// Água escura do horizonte pra baixo: degradê, faixas de reflexo que tremem e um brilho largo do céu
export function agua(T, cor, horizonte = 1180) {
  const g = novoId("yw"), h = 1920 - horizonte;
  const faixas = Array.from({ length: 34 }, (_, i) => {
    const y = horizonte + 8 + Math.pow(i / 34, 1.6) * h, w = 60 + rnd(i + 51) * 260 * (1 + i / 20), x = rnd(i + 91) * 1080 + 18 * Math.sin(T * 1.3 + i);
    return `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(1 + i / 14)}" rx="1" fill="${cor.reflexo}" opacity="${f3(0.12 + rnd(i + 7) * 0.22)}"/>`;
  }).join("");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.agua2}"/><stop offset="1" stop-color="${cor.agua}"/></linearGradient>
    <rect y="${horizonte}" width="1080" height="${h}" fill="url(#${g})"/>${faixas}
    <rect y="${horizonte - 1}" width="1080" height="2" fill="${cor.reflexo}" opacity="0.5"/>`;
}

// Paisagem completa: céu + água + grão
export const paisagem = (T, cor, o = {}) => ceu(T, cor, o) + agua(T, cor, o.horizonte) + grao(cor.graoCor, cor.graoOp);

// Troca de cena: geada com borda cristalina. Entrada (sai = false) sobe e cobre a tela; saída descobre de baixo pra cima.
const CRISTAIS = Array.from({ length: 40 }, (_, i) => [rnd(i + 601) * 1080, rnd(i + 641) * 1920, 20 + rnd(i + 681) * 60, rnd(i + 721) * 3]);
export function geada(T, at, cor, sai = false) {
  const k = p(T, at, 0.45, enter);
  if ((!sai && k <= 0) || (sai && k >= 1)) return "";
  const y = lerp(2010, -130, k), d = sai ? 1 : -1, g = novoId("yf");
  const dentes = Array.from({ length: 27 }, (_, i) => `L${f1(i * 40 + 20)},${f1(y + d * (30 + rnd(i + 17) * 80))} L${f1(i * 40 + 40)},${f1(y)}`).join(" ");
  const cris = CRISTAIS.map(([x, cy, r, a]) => `<path d="M${f1(x - r)},${f1(cy)} H${f1(x + r)} M${f1(x)},${f1(cy - r)} V${f1(cy + r)}" transform="rotate(${f1(a * 30)} ${f1(x)} ${f1(cy)})"/>`).join("");
  const cl = novoId("yv");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.gelo1}"/><stop offset="1" stop-color="${cor.gelo2}"/></linearGradient>
    <clipPath id="${cl}"><path d="M0,${f1(y)} ${dentes} L1080,${sai ? -10 : 1930} L0,${sai ? -10 : 1930} Z"/></clipPath>
    <g clip-path="url(#${cl})"><rect width="1080" height="1920" fill="url(#${g})"/><g stroke="${cor.gelo3}" stroke-width="1" opacity="0.35">${cris}</g></g>`;
}
