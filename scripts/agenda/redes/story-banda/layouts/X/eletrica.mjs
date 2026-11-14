// Layout X: peças elétricas desenhadas em SVG. Raio em zigue-zague (deslocamento de ponto médio determinístico,
// com ramificações finas e brilho), lâmpada de camarim, torre de alta tensão em treliça, fio com catenária e faísca
// correndo, disjuntor com alavanca e o estalo de quando liga.
import { p, enter, pop, lerp, clamp } from "../../tempo.mjs";
import { rnd, novoId, f1, op3, halo, txt } from "./pecas.mjs";

// pontos do zigue-zague entre A e B: cada nível divide os segmentos e empurra o meio pro lado (semente fixa)
function zigue(ax, ay, bx, by, desvio, niveis, semente) {
  let pts = [[ax, ay], [bx, by]];
  for (let n = 0; n < niveis; n++) {
    const novos = [pts[0]], amp = desvio / 2 ** n;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
      const d = (rnd(semente + n * 97 + i * 13) - 0.5) * 2 * amp;
      novos.push([(x0 + x1) / 2 - (dy / L) * d, (y0 + y1) / 2 + (dx / L) * d], pts[i]);
    }
    pts = novos;
  }
  return pts;
}
const linha = (pts) => `M${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join("L")}`;

// Raio de A a B que cai entre t0 e t0 + 0.22 s e apaga até t0 + 0.9 (resto de brilho). Ramos finos saem de 3 pontos.
export function raio(T, t0, [ax, ay], [bx, by], cor, { semente = 1, desvio = 120, w = 1 } = {}) {
  const k = p(T, t0, 0.22, enter), apaga = 1 - p(T, t0 + 0.25, 0.65, enter);
  if (k <= 0 || apaga <= 0) return "";
  const pts = zigue(ax, ay, bx, by, desvio, 6, semente);
  const ramos = [0.28, 0.5, 0.71].map((u, j) => { const [x, y] = pts[Math.floor(u * (pts.length - 1))], s = rnd(semente + j * 7) > 0.5 ? 1 : -1;
    const L = Math.hypot(bx - ax, by - ay) * (0.16 + 0.08 * rnd(semente + j * 3));
    return linha(zigue(x, y, x + s * L * 0.7, y + L * 0.7, desvio * 0.35, 4, semente + 50 + j)); }).join("");
  const a = halo(18 * w), b = halo(5 * w), d = linha(pts), dash = `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"`;
  const tr = (dd, c, sw, o, f) => `<path d="${dd}" fill="none" stroke="${c}" stroke-width="${f1(sw * w)}" stroke-linejoin="round" stroke-linecap="round" opacity="${op3(o * apaga)}" ${f ? `filter="url(#${f})"` : ""} ${dash}/>`;
  return `${a.def}${b.def}${tr(d, cor.neon, 26, 0.55, a.id)}${tr(d, cor.neon, 9, 0.8, b.id)}${tr(ramos, cor.neon, 5, 0.6, b.id)}
    ${tr(ramos, cor.nucleo, 1.4, 0.85)}${tr(d, cor.nucleo, 3.4, 1)}`;
}

// clarão do raio: véu claro rápido e baixo (no máximo 0.16), pra não virar estroboscópio
export const clarao = (T, t0, cor) => { const o = 0.16 * p(T, t0, 0.08) * (1 - p(T, t0 + 0.08, 0.5));
  return o > 0.002 ? `<rect width="1080" height="1920" fill="${cor.nucleo}" opacity="${op3(o)}"/>` : ""; };

// Lâmpada de camarim: soquete, bulbo com degradê e halo quando acesa (k 0..1)
export function lampada(x, y, r, cor, k) {
  const g = novoId("xl"), h = halo(r * 0.9);
  return `<radialGradient id="${g}" cx="0.4" cy="0.38" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="${cor.lampada}"/><stop offset="1" stop-color="${cor.lampada2}"/></radialGradient>
    ${h.def}<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 2)}" fill="${cor.lampada}" opacity="${op3(0.5 * k)}" filter="url(#${h.id})"/>
    <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + 3)}" fill="${cor.metal}" stroke="${cor.ouro}" stroke-width="1.2"/>
    <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${cor.lampada2}" opacity="0.55"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#${g})" opacity="${op3(0.15 + 0.85 * k)}"/>
    <path d="M${f1(x - r * 0.45)},${f1(y - r * 0.2)} q${f1(r * 0.2)},${f1(-r * 0.45)} ${f1(r * 0.55)},${f1(-r * 0.4)}" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.7"/>`;
}

// Torre de alta tensão em treliça, base em (x, y), altura h. Devolve o desenho e os 2 pontos de fixação do fio.
export function torre(x, y, h, cor, k = 1) {
  const s = h / 120, X = (v) => f1(x + v * s), Y = (v) => f1(y - v * s);
  const pernas = `M${X(-22)},${Y(0)} L${X(-6)},${Y(84)} L${X(0)},${Y(120)} L${X(6)},${Y(84)} L${X(22)},${Y(0)}`;
  const bracos = `M${X(-34)},${Y(96)} H${X(34)} M${X(-26)},${Y(76)} H${X(26)} M${X(-34)},${Y(96)} L${X(-6)},${Y(108)} M${X(34)},${Y(96)} L${X(6)},${Y(108)}`;
  const xis = [0, 21, 42, 63].map((a, i) => { const b = a + 21, la = 22 - (16 * a) / 84, lb = 22 - (16 * b) / 84;
    return i < 4 ? `M${X(-la)},${Y(a)} L${X(lb)},${Y(b)} M${X(la)},${Y(a)} L${X(-lb)},${Y(b)} M${X(-lb)},${Y(b)} H${X(lb)}` : ""; }).join("");
  const iso = (v) => `<path d="M${X(v)},${Y(96)} v${f1(8 * s)}" stroke="${cor.nucleo}" stroke-width="${f1(2 * s)}"/>`;
  return { desenho: `<g opacity="${op3(k)}" fill="none" stroke="${cor.linha}" stroke-linejoin="round"><path d="${pernas}" stroke-width="${f1(1.8 * s)}"/>
    <path d="${xis}${bracos}" stroke-width="${f1(1 * s)}"/>${iso(-30)}${iso(30)}</g>`, fio: [[x - 30 * s, y - 88 * s], [x + 30 * s, y - 88 * s]] };
}

// ponto da catenária (bezier quadrática com barriga `sag`) em u 0..1
const naCurva = ([ax, ay], [bx, by], sag, u) => { const cx = (ax + bx) / 2, cy = (ay + by) / 2 + sag;
  return [(1 - u) ** 2 * ax + 2 * (1 - u) * u * cx + u * u * bx, (1 - u) ** 2 * ay + 2 * (1 - u) * u * cy + u * u * by]; };

// Fio de A a B desenhado de t0 em diante; depois de t0 + 0.5 uma faísca corre por ele em laço (0.9 s por volta)
export function fio(T, t0, A, B, cor, { sag = 46, fase = 0 } = {}) {
  const k = p(T, t0, 0.5, enter);
  if (k <= 0) return "";
  const [cx, cy] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + sag], d = `M${f1(A[0])},${f1(A[1])} Q${f1(cx)},${f1(cy)} ${f1(B[0])},${f1(B[1])}`;
  const dash = `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"`;
  let faisca = "";
  if (T > t0 + 0.5) {
    const u = ((T - t0 - 0.5) / 0.9 + fase) % 1, h = halo(7);
    faisca = h.def + [0, 0.03, 0.06, 0.09].map((du, i) => { const [x, y] = naCurva(A, B, sag, clamp(u - du));
      return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(i ? 5 - i : 9)}" fill="${i ? cor.neon : cor.nucleo}" opacity="${op3(1 - i * 0.25)}" ${i ? "" : `filter="url(#${h.id})"`}/>`; }).join("") +
      (() => { const [x, y] = naCurva(A, B, sag, u); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.5" fill="#fff"/>`; })();
  }
  return `<path d="${d}" fill="none" stroke="${cor.fio}" stroke-width="2.2" ${dash}/><path d="${d}" fill="none" stroke="${cor.neon}" stroke-width="0.8" opacity="0.6" ${dash}/>${faisca}`;
}

// Estalo: 8 risquinhos que saem de (x, y) e somem em 0.35 s
export function estalo(T, t0, x, y, cor, r = 40) {
  const k = p(T, t0, 0.35, enter);
  if (k <= 0 || k >= 1) return "";
  const riscos = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + rnd(i + x) * 0.4, r0 = r * (0.3 + k * 0.7), r1 = r0 + r * 0.5 * (1 - k);
    return `M${f1(x + Math.cos(a) * r0)},${f1(y + Math.sin(a) * r0)} L${f1(x + Math.cos(a) * r1)},${f1(y + Math.sin(a) * r1)}`; }).join("");
  return `<path d="${riscos}" stroke="${cor.nucleo}" stroke-width="3" stroke-linecap="round" opacity="${op3(1 - k)}"/>`;
}

// Disjuntor (caixa h x 0.55h) em (x, y = topo). Alavanca desce (desligado) e sobe com estalo em t0; LED acende.
export function disjuntor(T, t0, x, y, h, cor) {
  const w = h * 0.55, k = p(T, t0, 0.18, pop), g = novoId("xd"), lv = lerp(h * 0.58, h * 0.2, clamp(k)), led = clamp(p(T, t0 + 0.1, 0.3) * 1);
  return `<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${cor.metal2}"/><stop offset="0.5" stop-color="${cor.metal}"/><stop offset="1" stop-color="${cor.metal2}"/></linearGradient>
    <rect x="${f1(x + 5)}" y="${f1(y + 7)}" width="${f1(w)}" height="${f1(h)}" rx="6" fill="#000" opacity="0.4"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="6" fill="url(#${g})" stroke="${cor.ouro}" stroke-width="1.2"/>
    <rect x="${f1(x + w * 0.3)}" y="${f1(y + h * 0.16)}" width="${f1(w * 0.4)}" height="${f1(h * 0.58)}" rx="4" fill="#000" opacity="0.7"/>
    <rect x="${f1(x + w * 0.22)}" y="${f1(y + lv)}" width="${f1(w * 0.56)}" height="${f1(h * 0.2)}" rx="4" fill="${cor.nucleo}" opacity="0.92"/>
    ${txt(x + w / 2 - 6, y + h * 0.11, "LIGA", h * 0.075, cor.ouro, { fonte: "xb", ls: 1 })}${txt(x + w / 2, y + h * 0.88, "DESLIGA", h * 0.06, cor.ouro, { fonte: "xb", op: 0.6 })}
    ${lampada(x + w - 14, y + 14, 5, cor, led)}${estalo(T, t0 + 0.05, x + w / 2, y + h * 0.3, cor, h * 0.35)}`;
}
