// Layout S ("Yield", homenagem ao clima do álbum de 1998: estrada aberta e placas de trânsito, sem foto, sem logotipo e
// sem o nome do disco): peças comuns. Placa verde de rodovia no padrão brasileiro (fundo verde, orla branca, cantos
// redondos, parafusos), poste galvanizado, placa triangular de "dê a preferência" sem texto, marco de quilômetro,
// seta de sinalização e grão. Tudo função pura dos parâmetros.
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";
import { largura, cabe } from "./medida.mjs";

export { esc, largura, cabe };
export const F_INTER_B = "'Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);

// Texto. fonte: "xb" (Inter ExtraBold, a letra das placas), "b" (Inter Bold) ou "anton" (o outdoor)
export function texto(x, y, t, f, fill, { fonte = "xb", anchor = "middle", ls = 0, op = 1 } = {}) {
  const fam = fonte === "anton" ? `font-family="${F_ANTON}"` : fonte === "b" ? `font-family="${F_INTER_B}" font-weight="700"` : `font-family="${F_INTER_XB}" font-weight="800"`;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" ${fam} font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;
}

// grão: ladrilho de 200 px com pontinhos fixos (custo quase zero por quadro)
const PONTOS = Array.from({ length: 240 }, (_, i) => `<circle cx="${f1(rnd(i) * 200)}" cy="${f1(rnd(i + 300) * 200)}" r="${f1(0.5 + rnd(i + 700) * 1.0)}"/>`).join("");
export const grao = (corGrao, op, x = 0, y = 0, w = 1080, h = 1920) => { const id = novoId("sg");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${PONTOS}</g></pattern><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})" opacity="${op}"/>`; };

// Poste galvanizado de (x, y1) até (x, y2): degradê de metal, brilho fino e sombra no chão
export function poste(x, y1, y2, w, cor) {
  const g = novoId("sm");
  return `<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${cor.metal2}"/><stop offset="0.35" stop-color="${cor.metal1}"/><stop offset="0.55" stop-color="${cor.metal1}"/><stop offset="1" stop-color="${cor.metal2}"/></linearGradient>
    <ellipse cx="${f1(x)}" cy="${f1(y2)}" rx="${f1(w * 2.2)}" ry="${f1(w * 0.45)}" fill="#000" opacity="0.28"/>
    <rect x="${f1(x - w / 2)}" y="${f1(y1)}" width="${f1(w)}" height="${f1(y2 - y1)}" fill="url(#${g})"/>
    <rect x="${f1(x - w * 0.18)}" y="${f1(y1)}" width="${f1(Math.max(1, w * 0.08))}" height="${f1(y2 - y1)}" fill="#fff" opacity="0.35"/>`;
}

// Abraçadeira que prende a placa no poste
export const abracadeira = (x, y, w, cor) => `<rect x="${f1(x - w)}" y="${f1(y - 7)}" width="${f1(w * 2)}" height="14" rx="3" fill="${cor.metal2}"/>
  <rect x="${f1(x - w)}" y="${f1(y - 7)}" width="${f1(w * 2)}" height="4" rx="2" fill="#fff" opacity="0.3"/>`;

// Placa verde de rodovia: sombra suave, fundo com leve degradê, orla branca, 4 parafusos e o reflexo (noite = forte).
// `miolo` é o SVG do conteúdo, já posicionado em coordenadas da tela.
export function placa({ x, y, w, h, cor, rx = 20 }, miolo = "") {
  const g = novoId("sp"), r = novoId("sr"), b = novoId("sb"), orla = Math.max(5, Math.min(11, w / 90));
  const paraf = [[x + 26, y + 26], [x + w - 26, y + 26], [x + 26, y + h - 26], [x + w - 26, y + h - 26]].map(([a, c]) =>
    `<circle cx="${f1(a)}" cy="${f1(c)}" r="5" fill="${cor.placa2}"/><circle cx="${f1(a - 1)}" cy="${f1(c - 1)}" r="3" fill="#fff" opacity="0.55"/>`).join("");
  const brilho = cor.reflexo > 0.3 ? `<filter id="${b}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" result="m"/><feMerge><feMergeNode in="m"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : "";
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${cor.placa}"/><stop offset="1" stop-color="${cor.placa2}"/></linearGradient>
    <radialGradient id="${r}" cx="0.42" cy="0.35" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="${(0.1 + cor.reflexo * 0.22).toFixed(2)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>${brilho}
    <rect x="${f1(x + 12)}" y="${f1(y + 18)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="#000" opacity="0.32"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="url(#${g})"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="url(#${r})"/>
    <g ${brilho ? `filter="url(#${b})"` : ""}><rect x="${f1(x + orla * 1.4)}" y="${f1(y + orla * 1.4)}" width="${f1(w - orla * 2.8)}" height="${f1(h - orla * 2.8)}" rx="${rx - 6}" fill="none" stroke="${cor.branco}" stroke-width="${f1(orla)}"/>${miolo}</g>
    ${paraf}${grao("#000", 0.12, x, y, w, h)}`;
}

// "Dê a preferência": triângulo de ponta pra baixo, orla vermelha larga e miolo branco, SEM texto, no poste
export function preferencia(cx, cy, s, cor, chao) {
  const tri = (r) => `M${f1(-r)},${f1(-r * 0.58)} L${f1(r)},${f1(-r * 0.58)} L0,${f1(r * 1.15)} Z`;
  return `${poste(cx, cy, chao, 12 * s, cor)}<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
    <path d="${tri(92)}" transform="translate(7 10)" fill="#000" opacity="0.3" stroke="#000" stroke-width="14" stroke-linejoin="round"/>
    <path d="${tri(92)}" fill="${cor.vermelhoPlaca}" stroke="${cor.vermelhoPlaca}" stroke-width="14" stroke-linejoin="round"/>
    <path d="${tri(56)}" fill="${cor.branco}" stroke="${cor.branco}" stroke-width="8" stroke-linejoin="round"/>
    <path d="${tri(92)}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" opacity="${(0.25 + cor.reflexo * 0.5).toFixed(2)}"/></g>
    ${abracadeira(cx, cy - 20 * s, 14 * s, cor)}`;
}

// Marco de quilômetro: plaquinha vertical branca com orla preta, "KM" e o número, num pé curto
export function marcoKm(cx, cy, s, km, cor) {
  return `${poste(cx, cy, cy + 150 * s, 9 * s, cor)}<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
    <rect x="-44" y="-130" width="88" height="140" rx="8" fill="#000" opacity="0.25" transform="translate(5 7)"/>
    <rect x="-44" y="-130" width="88" height="140" rx="8" fill="${cor.branco}"/><rect x="-37" y="-123" width="74" height="126" rx="5" fill="none" stroke="#141414" stroke-width="3"/>
    ${texto(0, -86, "KM", 28, "#141414", { ls: 2 })}${texto(0, -24, String(km), cabe(String(km), 64, 50), "#141414")}</g>`;
}

// Seta de sinalização (aponta pra cima em ang = 0)
export const seta = (x, y, s, ang, fill) => `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${ang}) scale(${s})"
  d="M0,-50 L36,-12 L13,-12 L13,48 L-13,48 L-13,-12 L-36,-12 Z" fill="${fill}" stroke="${fill}" stroke-width="3" stroke-linejoin="round"/>`;

// km "da viagem" fixo por texto (sem Math.random): sempre o mesmo número pra mesma banda
export const kmDe = (t) => 12 + Math.floor(rnd([...String(t)].reduce((a, c) => a + c.charCodeAt(0), 0)) * 480);
