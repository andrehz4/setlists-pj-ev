// Peças comuns às 3 variações da cena do mapa (A pinos, B papel recortado, C rota de turnê): câmera, estados,
// pino, onda e etiqueta da cidade (MOTION-SPEC-banda, cena 3).
import { ufs } from "../mapa.mjs";
import { p, pop, enter, move, lerp } from "./tempo.mjs";
import { COR, esc, F_ANTON, F_INTER_XB } from "./pecas.mjs";

const K = Math.cos((20 * Math.PI) / 180);
export const mundo = ([lon, lat]) => [lon * K, -lat];
export const caixaDe = (pts) => [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])),
  Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
// câmera que enquadra a caixa (em graus) dentro do retângulo de tela; minSpan limita o zoom
export function enquadra(caixa, r, minSpan, pad) {
  const [x0, y0, x1, y1] = caixa, w = Math.max(x1 - x0, minSpan), h = Math.max(y1 - y0, minSpan);
  const s = Math.min((r.w - 2 * pad) / w, (r.h - 2 * pad) / h);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s, rx: r.x + r.w / 2, ry: r.y + r.h / 2 };
}
const mistura = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
  rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t) });
export const tela = (c, [wx, wy]) => [c.rx + (wx - c.cx) * c.s, c.ry + (wy - c.cy) * c.s];

const BRASIL = [-74 * K, -5.5, -34.5 * K, 34];
export const R3 = { x: 60, y: 590, w: 960, h: 1050 }, R4 = { x: 60, y: 455, w: 960, h: 300 };

// Brasil inteiro -> c3 (5.9 a 7.4), drift leve, c3 -> c4 quando a lista sobe (9.0)
export function camera(T, c3, c4) {
  let cam = mistura(enquadra(BRASIL, R3, 1, 0), c3, p(T, 5.9, 1.5, move));
  cam = { ...cam, s: cam.s * (1 + 0.035 * p(T, 7.4, 1.6, move)) };
  return mistura(cam, c4, p(T, 9.0, 0.7, move));
}
export const naCena4 = (T) => p(T, 9.0, 0.7, move);
export const saindo = (T) => p(T, 9.0, 0.3, enter);
export const caminho = (polys) => polys.map((q) => `M${q.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}Z`).join("");

// todos os estados; brilho(uf) de 0 a 1 vira a opacidade do creme
export const estados = (cam, cor, brilho) => Object.entries(ufs()).map(([uf, polys]) =>
  `<path d="${caminho(polys.map((poly) => poly.map((q) => tela(cam, mundo(q)))))}" fill="${COR.creme}" fill-opacity="${brilho(uf).toFixed(3)}" stroke="${cor.bg}" stroke-width="2.5"/>`).join("");

// grupo da cena: aparece em 5.6 (opacidade e escala 0.92 -> 1)
export function grupoMapa(T, miolo) {
  const op = p(T, 5.6, 0.5, enter), sc = lerp(0.92, 1, op);
  return `<g opacity="${op.toFixed(3)}" transform="translate(540 1100) scale(${sc.toFixed(4)}) translate(-540 -1100)">${miolo}</g>`;
}

// pino numerado (N > 1) ou com miolo creme; pulsa quando o show dele entra na lista
export function pino(T, { x, y, R, i, N, cor, s = 1 }) {
  const on = 9.5 + i * 0.25, k = s * (1 + 0.25 * (p(T, on, 0.3, pop) - p(T, on + 0.4, 0.25, enter)));
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})"><circle r="${R}" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="5"/>
  ${N > 1 ? `<text y="${R * 0.4}" text-anchor="middle" font-family="${F_ANTON}" font-size="${R * 1.15}" fill="${COR.creme}">${i + 1}</text>` : `<circle r="${R * 0.3}" fill="${COR.creme}"/>`}</g>`;
}
export function onda(T, x, y, R, pouso) {
  const o = p(T, pouso, 0.45, enter);
  return o > 0 && o < 1 ? `<circle cx="${x}" cy="${y}" r="${R + 70 * o}" fill="none" stroke="${COR.creme}" stroke-width="4" opacity="${1 - o}"/>` : "";
}
// etiqueta creme com o nome da cidade ao lado do pino (direita, ou esquerda se passar de x 1020)
export function etiquetaCidade(T, x, y, R, cidade, pouso) {
  const etq = p(T, pouso + 0.1, 0.3, enter) * (1 - saindo(T));
  if (etq <= 0) return "";
  const w = cidade.length * 0.6 * 34 + 28, dir = x + R + 16 + w < 1020;
  const ex = dir ? x + R + 16 + 20 * (1 - etq) : x - R - 16 - w - 20 * (1 - etq);
  return `<g opacity="${etq.toFixed(3)}" transform="rotate(-2 ${ex} ${y})"><rect x="${ex}" y="${y - 26}" width="${w}" height="52" fill="${COR.creme}"/>
  <text x="${ex + 14}" y="${y + 12}" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="${COR.tinta}">${esc(cidade)}</text></g>`;
}

// Afasta pinos que ficariam um em cima do outro (distância mínima 2R + 8), puxando de leve de volta pro ponto real e
// sem sair do retângulo. Devolve o deslocamento [dx, dy] de cada um (determinístico).
export function afastar(pontos, R, r) {
  const q = pontos.map((a) => [...a]), min = 2 * R + 8;
  for (let it = 0; it < 160; it++) {
    for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
      let dx = q[j][0] - q[i][0], dy = q[j][1] - q[i][1], d = Math.hypot(dx, dy);
      if (d < 0.01) { dx = Math.cos(i + j * 2.1); dy = Math.sin(i + j * 2.1); d = 1; }
      if (d < min) { const k = (min - d) / 2 / d; q[i][0] -= dx * k; q[i][1] -= dy * k; q[j][0] += dx * k; q[j][1] += dy * k; }
    }
    q.forEach((v, i) => {
      v[0] = Math.min(Math.max(v[0] + (pontos[i][0] - v[0]) * 0.02, r.x + R), r.x + r.w - R);
      v[1] = Math.min(Math.max(v[1] + (pontos[i][1] - v[1]) * 0.02, r.y + R), r.y + r.h - R);
    });
  }
  return q.map((v, i) => [v[0] - pontos[i][0], v[1] - pontos[i][1]]);
}
