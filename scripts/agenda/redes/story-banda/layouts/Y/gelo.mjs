// Layout Y: o gelo desenhado. Bloco facetado (triângulos em três tons de azul translúcido, aresta de luz fina),
// rachaduras que crescem com T, gotas que escorrem e caem, cubo de gelo em perspectiva e placa de gelo flutuante.
import { rnd, novoId, f1, f3 } from "./pecas.mjs";

// mistura duas cores #rrggbb (t de 0 a 1)
export function mix(a, b, t) {
  const c = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t).toString(16).padStart(2, "0")).join("")}`;
}
// tom da faceta: luz vem de cima à esquerda; t 0 = gelo1 (luz), 0.5 = gelo2, 1 = gelo3 (sombra)
const tom = (cor, t) => (t < 0.5 ? mix(cor.gelo1, cor.gelo2, t * 2) : mix(cor.gelo2, cor.gelo3, (t - 0.5) * 2));

// contorno irregular de um bloco (N pontos no perímetro de um retângulo arredondado, com jitter determinístico)
export function contorno(cx, cy, w, h, seed, N = 16, jit = 0.06) {
  return Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2 + 0.2, c = Math.cos(a), s = Math.sin(a);
    const re = 1 / Math.max(Math.abs(c) / (w / 2), Math.abs(s) / (h / 2)), el = 1 / Math.hypot(c / (w / 2), s / (h / 2));
    const r = (el * 0.3 + re * 0.7) * (1 + (rnd(seed + i * 7) - 0.5) * 2 * jit);
    return [cx + c * r, cy + s * r];
  });
}
const pts = (l) => l.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");

// Bloco facetado: anel externo + anel interno + centro, triangulados; cada faceta com tom pela posição
export function bloco(cx, cy, w, h, seed, cor, { op = 0.9, N = 16, sombra = true } = {}) {
  const ext = contorno(cx, cy, w, h, seed, N), int = contorno(cx + w * 0.03, cy - h * 0.04, w * 0.62, h * 0.58, seed + 99, N, 0.12), c = [cx + w * 0.05, cy - h * 0.06];
  const tri = [];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    tri.push([ext[i], ext[j], int[i]], [int[i], ext[j], int[j]], [int[i], int[j], c]);
  }
  const fac = tri.map((t, i) => {
    const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const luz = 0.5 + 0.32 * ((mx - cx) / w + (my - cy) / h) + (rnd(seed + i * 3.1) - 0.5) * 0.34;
    return `<polygon points="${pts(t)}" fill="${tom(cor, Math.min(1, Math.max(0, luz)))}"/>`;
  }).join("");
  const cl = novoId("yk"), bri = novoId("yh");
  return `<clipPath id="${cl}"><polygon points="${pts(ext)}"/></clipPath>
    <linearGradient id="${bri}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor.brilho}" stop-opacity="0.55"/><stop offset="0.35" stop-color="${cor.brilho}" stop-opacity="0"/></linearGradient>
    ${sombra ? `<polygon points="${pts(ext.map(([x, y]) => [x + 18, y + 26]))}" fill="#000" opacity="0.28"/>` : ""}
    <g opacity="${op}" clip-path="url(#${cl})">${fac}<g fill="none" stroke="${cor.brilho}" stroke-width="0.7" opacity="0.35">${tri.map((t) => `<polygon points="${pts(t)}"/>`).join("")}</g>
    <rect x="${f1(cx - w / 2)}" y="${f1(cy - h / 2)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${bri})"/></g>
    <polygon points="${pts(ext)}" fill="none" stroke="${cor.brilho}" stroke-width="1.4" stroke-linejoin="round" opacity="0.8"/>`;
}

// Rachadura: zigue-zague fino a partir de (x, y) no ângulo `ang`, com um galho; k = quanto já rachou (0 a 1)
export function racha(x, y, ang, len, seed, cor, k) {
  if (k <= 0) return "";
  const passos = 9, l = [[x, y]], galho = [];
  for (let i = 1; i <= passos; i++) {
    const a = ang + (rnd(seed + i) - 0.5) * 0.9, d = len / passos, [px, py] = l.at(-1);
    l.push([px + Math.cos(a) * d, py + Math.sin(a) * d]);
    if (i === 4) { const b = ang + (rnd(seed + 40) > 0.5 ? 0.8 : -0.8); galho.push(l.at(-1), [l.at(-1)[0] + Math.cos(b) * len * 0.3, l.at(-1)[1] + Math.sin(b) * len * 0.3]); }
  }
  const d = `M${pts(l).replace(/ /g, " L")} M${pts(galho).replace(/ /g, " L")}`;
  return `<path d="${d}" fill="none" stroke="${cor.gelo3}" stroke-width="2.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f3(1 - k)}"/>
    <path d="${d}" transform="translate(1.2 1.2)" fill="none" stroke="${cor.brilho}" stroke-width="0.9" stroke-linecap="round" opacity="0.85" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f3(1 - k)}"/>`;
}

// Gota: pendurada na borda (cresce) e depois cai em loop; fase determinística por semente
export function gota(T, x, y, seed, cor, queda = 420) {
  const per = 1.6 + rnd(seed) * 1.2, t = ((T + rnd(seed + 5) * per) % per) / per, r = 5 + rnd(seed + 9) * 3;
  const pend = Math.min(1, t * 2.4), cai = Math.max(0, (t - 0.42) / 0.58);
  const corpo = (gx, gy, s) => `<path d="M${f1(gx)},${f1(gy - r * 2.4 * s)} C${f1(gx + r * 0.9 * s)},${f1(gy - r * s)} ${f1(gx + r * s)},${f1(gy)} ${f1(gx)},${f1(gy + r * 0.7 * s)} C${f1(gx - r * s)},${f1(gy)} ${f1(gx - r * 0.9 * s)},${f1(gy - r * s)} ${f1(gx)},${f1(gy - r * 2.4 * s)} Z" fill="${cor.gelo2}" opacity="0.85"/>
    <circle cx="${f1(gx - r * 0.3 * s)}" cy="${f1(gy - r * 0.3 * s)}" r="${f1(r * 0.25 * s)}" fill="${cor.brilho}" opacity="0.9"/>`;
  const filete = `<path d="M${f1(x)},${f1(y - 4)} Q${f1(x + 1.5)},${f1(y + 10)} ${f1(x)},${f1(y + 14 * pend)}" stroke="${cor.gelo2}" stroke-width="${f1(r * 0.7)}" stroke-linecap="round" opacity="0.7"/>`;
  return filete + (cai <= 0 ? corpo(x, y + 14 * pend + r, pend) : `<g opacity="${f3(1 - cai * 0.8)}">${corpo(x, y + 18 + cai * cai * queda, 1)}</g>`);
}

// Cubo de gelo em perspectiva (frente S x S em x, y): devolve { atras, frente, face } pra pôr o conteúdo no meio
export function cubo(x, y, S, cor) {
  const dx = S * 0.3, dy = -S * 0.24, g = novoId("yq"), bo = novoId("yo");
  const topo = `${f1(x)},${f1(y)} ${f1(x + dx)},${f1(y + dy)} ${f1(x + S + dx)},${f1(y + dy)} ${f1(x + S)},${f1(y)}`;
  const lado = `${f1(x + S)},${f1(y)} ${f1(x + S + dx)},${f1(y + dy)} ${f1(x + S + dx)},${f1(y + S + dy)} ${f1(x + S)},${f1(y + S)}`;
  const bolhas = Array.from({ length: 18 }, (_, i) => `<circle cx="${f1(x + rnd(i + 401) * S)}" cy="${f1(y + rnd(i + 451) * S)}" r="${f1(1.5 + rnd(i + 501) * 4.5)}" fill="none" stroke="${cor.brilho}" stroke-width="1" opacity="${f3(0.3 + rnd(i + 551) * 0.4)}"/>`).join("");
  const atras = `<polygon points="${f1(x + 26)},${f1(y + 40)} ${f1(x + S + dx + 26)},${f1(y + dy + 40)} ${f1(x + S + dx + 26)},${f1(y + S + dy + 40)} ${f1(x + 26)},${f1(y + S + 40)}" fill="#000" opacity="0.3"/>
    <polygon points="${topo}" fill="${cor.gelo1}" opacity="0.92"/><polygon points="${lado}" fill="${cor.gelo3}" opacity="0.9"/>`;
  const frente = `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor.gelo1}" stop-opacity="0.38"/><stop offset="0.5" stop-color="${cor.gelo2}" stop-opacity="0.1"/><stop offset="1" stop-color="${cor.gelo3}" stop-opacity="0.35"/></linearGradient>
    <filter id="${bo}"><feGaussianBlur stdDeviation="10"/></filter>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(S)}" height="${f1(S)}" fill="url(#${g})"/>
    <rect x="${f1(x + 10)}" y="${f1(y + 10)}" width="${f1(S - 20)}" height="${f1(S - 20)}" fill="none" stroke="${cor.gelo1}" stroke-width="22" opacity="0.6" filter="url(#${bo})"/>${bolhas}
    <path d="M${f1(x + S * 0.08)},${f1(y + S * 0.62)} L${f1(x + S * 0.62)},${f1(y + S * 0.08)} L${f1(x + S * 0.74)},${f1(y + S * 0.08)} L${f1(x + S * 0.08)},${f1(y + S * 0.74)} Z" fill="${cor.brilho}" opacity="0.22"/>
    <path d="M${f1(x + S * 0.3)},${f1(y + S * 0.92)} L${f1(x + S * 0.92)},${f1(y + S * 0.3)} L${f1(x + S * 0.92)},${f1(y + S * 0.36)} L${f1(x + S * 0.36)},${f1(y + S * 0.92)} Z" fill="${cor.brilho}" opacity="0.14"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(S)}" height="${f1(S)}" fill="none" stroke="${cor.brilho}" stroke-width="2" opacity="0.85"/>
    <path d="M${topo.split(" ").slice(0, 3).join(" L")}" fill="none" stroke="${cor.brilho}" stroke-width="1.4" opacity="0.8"/>`;
  return { atras, frente };
}

// Placa de gelo flutuante (vista de leve de cima): tampo facetado, espessura, parte submersa e marola
export function placa(cx, cy, w, h, seed, cor) {
  const esp = Math.max(18, h * 0.16), sub = contorno(cx + 10, cy + esp + h * 0.18, w * 1.06, h * 1.15, seed + 5, 18, 0.08);
  const borda = contorno(cx, cy + esp, w, h, seed, 18, 0.05);
  return `<polygon points="${pts(sub)}" fill="${cor.gelo2}" opacity="0.18"/>
    <polygon points="${pts(borda)}" fill="${cor.gelo3}" opacity="0.95"/>
    <ellipse cx="${f1(cx)}" cy="${f1(cy + esp + h / 2 + 4)}" rx="${f1(w * 0.52)}" ry="7" fill="none" stroke="${cor.reflexo}" stroke-width="1.4" opacity="0.45"/>
    ${bloco(cx, cy, w, h, seed, cor, { op: 0.97, N: 18, sombra: false })}`;
}
