// Layout D, geometria do mapa (cenas 3 e 4): contornos dos estados em coordenadas de mundo (calculados uma vez),
// câmera que enquadra os ESTADOS dos shows, mistura de câmeras em log e o lugar das etiquetas das cidades.
import { lerp } from "../../tempo.mjs";
import { ufs, centroUf } from "../../../mapa.mjs";
import { mundo, caixaDe, tela } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { larg, cabe } from "./pecas.mjs";

export const MAP3 = { x: 60, y: 490, w: 960, h: 1130 };
export const MAP4 = { x: 60, y: 490, w: 960, h: 320 };
export const LH = 108;
const S_MAX = 360, SPAN_MIN = 1.16; // = s máx 14 e caixa mínima 30 do Design, na escala de mundo (graus)

let _d;
// d de cada estado em coordenadas de mundo (cache: os polígonos não mudam)
export const contornos = () => (_d ||= Object.fromEntries(Object.entries(ufs()).map(([uf, polys]) =>
  [uf, polys.map((q) => `M${q.map((v) => mundo(v).map((n) => n.toFixed(3)).join(",")).join("L")}Z`).join("")])));

export function enquadra(cx0, r, pad) {
  const [x0, y0, x1, y1] = cx0, w = Math.max(x1 - x0, SPAN_MIN), h = Math.max(y1 - y0, SPAN_MIN);
  const s = Math.min((r.w - 2 * pad) / w, (r.h - 2 * pad) / h, S_MAX);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s, rx: r.x + r.w / 2, ry: r.y + r.h / 2 };
}
export const mistura = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t),
  s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t) });
export const transforma = (c) =>
  `translate(${(c.rx - c.cx * c.s).toFixed(2)} ${(c.ry - c.cy * c.s).toFixed(2)}) scale(${c.s.toFixed(4)})`;
export { tela };

// "20,54° S  47,40° O"
const grau = (v) => Math.abs(v).toFixed(2).replace(".", ",");
export const coord = ([lon, lat]) => `${grau(lat)}° ${lat < 0 ? "S" : "N"}  ${grau(lon)}° O`;

// Afasta itens na vertical (distância mínima gap) dentro de [lo, hi], como o spread do Design
function espalha(itens, gap, lo, hi) {
  const s = [...itens].sort((a, b) => a.ly - b.ly);
  for (let i = 0; i < s.length; i++) s[i].ly = Math.max(s[i].ly, lo, i ? s[i - 1].ly + gap : lo);
  for (let i = s.length - 1; i >= 0; i--) s[i].ly = Math.min(s[i].ly, i < s.length - 1 ? s[i + 1].ly - gap : hi);
}

export function modeloMapa(story) {
  const N = story.shows.length, lista = [...new Set(story.shows.map((s) => s.uf))].filter((u) => ufs()[u]);
  const titulo = lista.length === 1 ? nomeUf(lista[0]).toUpperCase() : lista.join(" + ");
  const caixa = caixaDe(lista.flatMap((u) => ufs()[u].flat().map(mundo)));
  // 4 shows ou mais: o mapa pequeno da cena 4 fica mais baixo pra sobrar lugar pra lista
  const map4 = N >= 4 ? { ...MAP4, h: 200 } : MAP4;
  const cam3 = enquadra(caixa, MAP3, 50), cam4 = enquadra(caixa, map4, 16);
  const nx = N > 1 ? 60 : 0;
  const pts = story.shows.map((s, i) => {
    const ll = s.lonlat || centroUf(s.uf), m = mundo(ll), [ax, ay] = tela(cam3, m);
    const c = s.aproximado || !s.lonlat ? `${s.uf}, local aproximado` : coord(ll);
    // cidade em 42 e coordenada em 28, reduzidas se a etiqueta passar de 960
    const fc = Math.min(42, cabe(s.cidade, 960 - 44 - nx, 42, "xb")), fk = Math.min(28, cabe(c, 960 - 44 - nx, 28, "sb"));
    const lw = Math.max(larg(s.cidade, fc, "xb"), larg(c, fk, "sb")) + 44 + nx;
    const right = ax + 50 + lw <= 1020;
    const bx = right ? ax + 50 : Math.max(60, ax - 50 - lw);
    return { ...s, n: i + 1, m, coord: c, fc, fk, lw, right, bx, ly: ay - 70 - LH, t: 5.85 + i * 0.4 };
  });
  espalha(pts, LH + 14, MAP3.y + 16, MAP3.y + MAP3.h - LH - 16);
  return { lista, titulo, fTitulo: cabe(titulo, 960, 130), cam3, cam4, map4, pts, nx };
}
