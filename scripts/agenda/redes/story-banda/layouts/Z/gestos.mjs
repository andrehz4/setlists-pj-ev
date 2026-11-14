// Layout Z: gestos da lanterna, todos como lista de pontos pra trilha() (determinísticos pela semente).
// Rabisco ambiente, laçadas de caligrafia, laço em volta de um texto, contorno de moldura e caminho entre pontos.
import { rnd } from "./pecas.mjs";

const amostra = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));

// Rabisco longo de lanterna: atravessa a tela de (x0,y0) a (x1,y1) ondulando (soma de senos com fase da semente)
export function rabisco(s, x0, y0, x1, y1, amp = 120, ondas = 2.2) {
  const a = rnd(s) * 6.28, b = rnd(s + 7) * 6.28, nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1;
  return amostra(160, (u) => { const o = amp * (Math.sin(u * ondas * 6.28 + a) * 0.7 + Math.sin(u * ondas * 2.3 * 6.28 + b) * 0.3) * Math.sin(u * Math.PI);
    return [x0 + (x1 - x0) * u + (nx / L) * o, y0 + (y1 - y0) * u + (ny / L) * o]; });
}

// Laçadas de caligrafia (trocoide): de x0 a x1 na altura y, com `n` voltas de raio r
export function lacadas(x0, x1, y, n = 4, r = 26) {
  const T = n * 6.28, v = (x1 - x0) / T;
  return amostra(n * 40, (u) => { const t = u * T; return [x0 + v * t - r * 1.25 * Math.sin(t), y - r * 0.55 * (1 - Math.cos(t)) + 10 * Math.sin(u * 3.14)]; });
}

// Sublinhado de pincelada: sobe, cruza e termina numa laçada pequena (como assinatura)
export function assinatura(x0, x1, y, s = 1) {
  const w = x1 - x0, ini = amostra(60, (u) => [x0 + w * 0.92 * u, y + 16 * Math.sin(u * 3.14 + rnd(s) * 0.6) - 8 * u]);
  const [ex, ey] = ini.at(-1), fim = amostra(50, (u) => { const t = u * 6.28 * 1.1; return [ex + 40 * Math.sin(t) + w * 0.08 * u, ey - 30 * (1 - Math.cos(t)) * 0.6]; });
  return ini.concat(fim);
}

// Laço em volta de um texto: elipse de 1,15 volta, levemente torta, começando embaixo à esquerda
export function laco(cx, cy, rx, ry, s = 1) {
  const g = rnd(s) * 0.1 - 0.05;
  return amostra(140, (u) => { const t = 2.4 + u * 6.28 * 1.15, k = 1 + 0.05 * Math.sin(t * 2 + s) + 0.04 * u;
    return [cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t) + rx * g * Math.cos(t)]; });
}

// Contorno de moldura arredondada, começando no meio do lado de cima e girando no sentido horário
export function moldura(x, y, w, h, r) {
  const pts = [], arco = (cx, cy, a0) => { for (let i = 0; i <= 10; i++) { const a = a0 + (i / 10) * 1.5708; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  pts.push([x + w / 2, y]); arco(x + w - r, y + r, -1.5708); arco(x + w - r, y + h - r, 0); arco(x + r, y + h - r, 1.5708); arco(x + r, y + r, 3.1416);
  pts.push([x + w / 2, y]);
  const denso = [];
  pts.forEach((q, i) => { if (!i) return denso.push(q); const [a, b] = pts[i - 1], n = Math.max(1, Math.ceil(Math.hypot(q[0] - a, q[1] - b) / 12));
    for (let j = 1; j <= n; j++) denso.push([a + (q[0] - a) * (j / n), b + (q[1] - b) * (j / n)]); });
  return denso;
}

// Caminho suave entre pontos (Catmull-Rom), com entrada e saída fora da tela. Devolve { pts, idx } (índice de cada nó).
export function caminhoEntre(nos, entrada, saida) {
  const P = [entrada, ...nos, saida], pts = [], idx = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    if (i > 0) idx.push(pts.length);
    for (let j = 0; j < 40; j++) { const t = j / 40, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map((e) => 0.5 * (2 * b[e] + (-a[e] + c[e]) * t + (2 * a[e] - 5 * b[e] + 4 * c[e] - d[e]) * t2 + (-a[e] + 3 * b[e] - 3 * c[e] + d[e]) * t3))); }
  }
  pts.push(P.at(-1));
  return { pts, idx };
}
