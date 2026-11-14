// Layout T: desenhos próprios em SVG. Galáxia espiral (o "objeto catalogado" de cada show, um desenho por semente) e
// onda de osciloscópio em dois canais (L e R) que se fundem numa só. Tudo determinístico (rnd com semente fixa).
import { novoId, f1, rnd } from "./ceu.mjs";

// Galáxia espiral: núcleo em degradê, 2 braços de pontinhos em espiral logarítmica e poeira. rot = giro em graus.
export function galaxia(cx, cy, r, cor, s, rot = 0, op = 1) {
  const n = novoId("tgx"), incl = 0.45 + rnd(s + 3) * 0.35, giro = rnd(s + 7) * 360, pts = [];
  for (let braco = 0; braco < 2; braco++) for (let i = 0; i < 70; i++) {
    const t = i / 70, a = braco * Math.PI + t * 3.6 + (rnd(s + i * 3 + braco) - 0.5) * 0.5, d = r * (0.12 + 0.88 * t) * (0.85 + rnd(s + i + 400) * 0.3);
    pts.push(`<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="${f1(0.6 + (1 - t) * 1.6 * rnd(s + i + 90))}" opacity="${f1(0.35 + 0.6 * (1 - t))}"/>`);
  }
  const nuvem = `<radialGradient id="${n}"><stop offset="0" stop-color="${cor.estrela}" stop-opacity="0.95"/><stop offset="0.18" stop-color="${cor.quente}" stop-opacity="0.6"/>
    <stop offset="0.55" stop-color="${cor.neb1}" stop-opacity="0.22"/><stop offset="1" stop-color="${cor.neb1}" stop-opacity="0"/></radialGradient>`;
  return `${nuvem}<g opacity="${op}" transform="translate(${f1(cx)} ${f1(cy)}) scale(1 ${incl.toFixed(3)}) rotate(${f1(giro + rot)})">
    <circle r="${f1(r * 1.05)}" fill="url(#${n})"/><g fill="${cor.estrela}">${pts.join("")}</g><circle r="${f1(r * 0.09)}" fill="${cor.estrela}"/></g>`;
}

// forma da onda: soma de 3 senoides com frequência e fase próprias do canal
const forma = (x, canal, T) => {
  const [a, b, c] = canal === "L" ? [0.012, 0.031, 0.0067] : [0.016, 0.026, 0.0091];
  return Math.sin(x * a + T * 2.1) * 0.55 + Math.sin(x * b + 1.3 + T * 1.4) * 0.3 + Math.sin(x * c + 2.2) * 0.15;
};

// Onda num traço de osciloscópio entre x0 e x1. junta (0..1) leva L e R pra mesma linha central e mesma forma.
export function ondaCanal(canal, { x0 = 110, x1 = 970, yL, yR, amp, junta, T, cor, w = 2.6 }) {
  const meio = (yL + yR) / 2, y0 = canal === "L" ? yL : yR, yc = y0 + (meio - y0) * junta, pts = [];
  for (let x = x0; x <= x1; x += 6) {
    const borda = Math.sin(((x - x0) / (x1 - x0)) * Math.PI), alvo = (forma(x, "L", T) + forma(x, "R", T)) / 2;
    const v = forma(x, canal, T) * (1 - junta) + alvo * junta;
    pts.push(`${x === x0 ? "M" : "L"}${x},${f1(yc + v * amp * (0.35 + 0.65 * borda))}`);
  }
  const c = canal === "L" ? cor.canalL : cor.canalR, d = pts.join("");
  // brilho de fósforo: traço largo e fraco por baixo, traço fino por cima
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w * 4}" stroke-linecap="round" stroke-linejoin="round" opacity="0.16"/>
    <path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// tela do osciloscópio: moldura arredondada, grade 10 x 8 com subdivisões no eixo central
export function telaOsc(x, y, w, h, cor) {
  const linhas = [];
  for (let i = 1; i < 10; i++) linhas.push(`M${f1(x + (w * i) / 10)},${y} V${y + h}`);
  for (let j = 1; j < 8; j++) linhas.push(`M${x},${f1(y + (h * j) / 8)} H${x + w}`);
  const sub = Array.from({ length: 50 }, (_, i) => `M${f1(x + (w * i) / 50)},${f1(y + h / 2 - 5)} v10`).join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${cor.bg2}" opacity="0.7"/>
    <path d="${linhas.join("")}" stroke="${cor.linha}" stroke-width="1" opacity="0.35"/><path d="${sub}" stroke="${cor.linha}" stroke-width="1" opacity="0.55"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="none" stroke="${cor.linha}" stroke-width="2" opacity="0.8"/>`;
}

// colchetes de canto (enquadramento de visor) num retângulo
export const colchetes = (x, y, w, h, c, l = 34, sw = 2.4) => `<path d="M${x},${y + l} V${y} H${x + l} M${x + w - l},${y} H${x + w} V${y + l}
  M${x + w},${y + h - l} V${y + h} H${x + w - l} M${x + l},${y + h} H${x} V${y + h - l}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
