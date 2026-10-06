// Mapa (câmera do Brasil inteiro até as cidades da banda, pinos caindo) e lista dos shows (MOTION-SPEC-banda).
import { ufs } from "../mapa.mjs";
import { p, pop, enter, move, lerp, clamp } from "./tempo.mjs";
import { COR, esc, larguraAnton, larguraInter, F_ANTON, F_INTER_XB } from "./pecas.mjs";

const K = Math.cos((20 * Math.PI) / 180);
const mundo = ([lon, lat]) => [lon * K, -lat];
// câmera que enquadra a caixa (em graus) dentro do retângulo de tela
function enquadra(caixa, r, minSpan, pad) {
  const [x0, y0, x1, y1] = caixa, w = Math.max(x1 - x0, minSpan), h = Math.max(y1 - y0, minSpan);
  const s = Math.min((r.w - 2 * pad) / w, (r.h - 2 * pad) / h);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s, rx: r.x + r.w / 2, ry: r.y + r.h / 2 };
}
const mistura = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t) });
const tela = (c, [wx, wy]) => [c.rx + (wx - c.cx) * c.s, c.ry + (wy - c.cy) * c.s];

const BRASIL = [-74 * K, -5.5, -34.5 * K, 34];
const R3 = { x: 60, y: 590, w: 960, h: 1050 }, R4 = { x: 60, y: 455, w: 960, h: 300 };

export function mapa(T, story, cor) {
  if (T < 5.5) return "";
  const pts = story.shows.map((s) => mundo(s.lonlat));
  const caixa = [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
  const cBr = enquadra(BRASIL, R3, 1, 0), c3 = enquadra(caixa, R3, 6, 140), c4 = enquadra(caixa, R4, 3, 50);
  let cam = mistura(cBr, c3, p(T, 5.9, 1.5, move));
  cam = { ...cam, s: cam.s * (1 + 0.035 * p(T, 7.4, 1.6, move)) };
  cam = mistura(cam, c4, p(T, 9.0, 0.7, move));
  const op = p(T, 5.6, 0.5, enter), sc = lerp(0.92, 1, op);
  const acende = Object.fromEntries(story.shows.map((s, i) => [s.uf, p(T, 7.84 + i * 0.45, 0.3, enter)]));
  const estados = Object.entries(ufs()).map(([uf, polys]) => {
    const d = polys.map((poly) => `M${poly.map((q) => tela(cam, mundo(q)).map((v) => v.toFixed(1)).join(",")).join("L")}Z`).join("");
    return `<path d="${d}" fill="${COR.creme}" fill-opacity="${(0.2 + 0.55 * (acende[uf] || 0)).toFixed(3)}" stroke="${cor.bg}" stroke-width="2.5"/>`;
  }).join("");
  const R = lerp(40, 26, p(T, 9.0, 0.7, move)), N = story.shows.length;
  const pinos = story.shows.map((s, i) => {
    const drop = 7.5 + i * 0.45, cai = p(T, drop, 0.34, pop);
    if (T < drop) return "";
    const [x, y0] = tela(cam, mundo(s.lonlat)), y = y0 - 170 * (1 - cai);
    const onda = p(T, drop + 0.34, 0.45, enter), on = 9.5 + i * 0.25;
    const pulso = 1 + 0.25 * (p(T, on, 0.3, pop) - p(T, on + 0.4, 0.25, enter));
    const etq = p(T, drop + 0.44, 0.3, enter) * (1 - p(T, 9.0, 0.3, enter));
    const w = s.cidade.length * 0.6 * 34 + 28, dir = x + R + 16 + w < 1020;
    const ex = dir ? x + R + 16 + 20 * (1 - etq) : x - R - 16 - w - 20 * (1 - etq);
    return `${onda > 0 && onda < 1 ? `<circle cx="${x}" cy="${y0}" r="${R + 70 * onda}" fill="none" stroke="${COR.creme}" stroke-width="4" opacity="${1 - onda}"/>` : ""}
    <g transform="translate(${x} ${y}) scale(${pulso.toFixed(3)})"><circle r="${R}" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="5"/>
    ${N > 1 ? `<text y="${R * 0.4}" text-anchor="middle" font-family="${F_ANTON}" font-size="${R * 1.15}" fill="${COR.creme}">${i + 1}</text>` : `<circle r="${R * 0.3}" fill="${COR.creme}"/>`}</g>
    ${etq > 0 ? `<g opacity="${etq.toFixed(3)}" transform="rotate(-2 ${ex} ${y0})"><rect x="${ex}" y="${y0 - 26}" width="${w}" height="52" fill="${COR.creme}"/>
    <text x="${ex + 14}" y="${y0 + 12}" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="${COR.tinta}">${esc(s.cidade)}</text></g>` : ""}`;
  }).join("");
  return `<g opacity="${op.toFixed(3)}" transform="translate(540 1100) scale(${sc.toFixed(4)}) translate(-540 -1100)">${estados}${pinos}</g>`;
}

const hora = (h) => (h ? h.replace(":00", "H").replace(":", "H") : null);
export function shows(T, story, cor) {
  const sobe = p(T, 9.0, 0.7, move);
  if (sobe <= 0) return "";
  const topo = lerp(1920, 785, sobe), N = story.shows.length;
  const cityF = Math.min(170, (835 / N - 60) / 1.8), horaF = 0.7 * cityF, casaF = clamp(0.36 * cityF, 30, 60);
  const bloco = 1.05 * cityF + 16 + horaF + 32, total = N * bloco + (N - 1) * 50;
  let y = 815 + (835 - total) / 2;
  const itens = story.shows.map((s, i) => {
    const on = 9.5 + i * 0.25, o = p(T, on, 0.35, enter), dx = 80 * (1 - o);
    const badge = N > 1 ? 0.62 * cityF + 20 : 0, livre = 960 - badge;
    const f = Math.min(cityF, livre / (s.cidade.length * 0.5)), y1 = y + cityF;
    const h = hora(s.hora), hs = p(T, on + 0.15, 0.3, pop), hw = h ? larguraAnton(h, horaF) + 42 : 0, y2 = y1 + 16;
    const casa = s.casa || (!h ? `detalhes no ${story.conta}` : "");
    const g = `<g opacity="${o.toFixed(3)}" transform="translate(${dx} 0)">
      ${N > 1 ? `<circle cx="${60 + 0.31 * cityF}" cy="${y1 - 0.36 * cityF}" r="${0.31 * cityF}" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="5"/>
      <text x="${60 + 0.31 * cityF}" y="${y1 - 0.16 * cityF}" text-anchor="middle" font-family="${F_ANTON}" font-size="${0.45 * cityF}" fill="${COR.creme}">${i + 1}</text>` : ""}
      <text x="${60 + badge}" y="${y1}" font-family="${F_ANTON}" font-size="${f}" fill="${COR.creme}">${esc(s.cidade.toUpperCase())}</text>
      ${h ? `<g transform="translate(60 ${y2 + (horaF + 34) / 2}) rotate(-2) scale(${lerp(1.5, 1, hs).toFixed(3)}) translate(0 ${-(horaF + 34) / 2})"><rect width="${hw}" height="${horaF + 34}" fill="${cor.strip}"/>
      <text x="21" y="${20 + horaF * 0.84}" font-family="${F_ANTON}" font-size="${horaF}" fill="${COR.creme}">${h}</text></g>` : ""}
      ${casa ? `<text x="${60 + (h ? hw + 24 : 0)}" y="${y2 + horaF * 0.5 + 17 + casaF * 0.36}" font-family="${F_INTER_XB}" font-weight="800" font-size="${Math.min(casaF, (960 - hw - 24) / (casa.length * 0.6))}" fill="${COR.creme}">${esc(casa)}</text>` : ""}</g>`;
    y += bloco + 50;
    return g;
  }).join("");
  return `<rect x="0" y="${topo}" width="1080" height="${1920 - topo}" fill="${cor.bg}"/><rect x="0" y="${topo}" width="1080" height="4" fill="${COR.tinta}"/>${itens}`;
}
