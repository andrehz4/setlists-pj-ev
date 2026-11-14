// Layout K ("Setlist de palco"): peças comuns. Chão do palco (tábuas, luz, cabo, marcas de fita), folha de setlist
// colada com fita crepe, escrita de caneta que aparece da esquerda pra direita, risco e círculo feitos à mão.
// Tudo função pura de T.
import { clamp, lerp } from "../../tempo.mjs";
import { esc, F_INTER_XB } from "../../pecas.mjs";

export const F_MARKER = "'Permanent Marker','Archivo Black','Inter ExtraBold',sans-serif";
export { esc, F_INTER_XB };
// largura estimada da Permanent Marker (maiúsculas e minúsculas misturadas)
export const larg = (t, f) => String(t).length * 0.62 * f;
export const cabe = (t, largura, max) => Math.min(max, largura / (String(t).length * 0.62));

let _id = 0;
const novoId = (p) => `${p}${++_id}`;

// Chão do palco visto de cima: tábuas, luz que passeia devagar, cabo e um X de fita de marcação.
export function palco(T, cor) {
  const tab = Array.from({ length: 18 }, (_, i) => `<rect x="-200" y="${i * 128 - 200}" width="1480" height="126" fill="${i % 2 ? cor.palco : cor.palco2}"/>
    <rect x="-200" y="${i * 128 - 74}" width="1480" height="3" fill="#000" opacity="0.55"/>
    <circle cx="${(i * 337) % 1000 + 40}" cy="${i * 128 - 137}" r="5" fill="#000" opacity="0.5"/>`).join("");
  const id = novoId("kl"), lx = 540 + 90 * Math.sin(T * 0.5);
  return `<rect width="1080" height="1920" fill="${cor.palco}"/><g transform="rotate(-6 540 960)">${tab}</g>
  <radialGradient id="${id}"><stop offset="0" stop-color="${cor.luz}" stop-opacity="0.32"/><stop offset="1" stop-color="${cor.luz}" stop-opacity="0"/></radialGradient>
  <ellipse cx="${lx.toFixed(1)}" cy="900" rx="900" ry="1000" fill="url(#${id})"/>
  <path d="M-40,1720 C260,1600 420,1880 760,1770 S1040,1640 1140,1700" fill="none" stroke="#0b0b0b" stroke-width="28" stroke-linecap="round"/>
  <path d="M-40,1712 C260,1592 420,1872 760,1762 S1040,1632 1140,1692" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.12"/>
  <g transform="rotate(20 960 250)" opacity="0.85"><rect x="880" y="236" width="160" height="30" fill="${cor.fita}"/><rect x="945" y="171" width="30" height="160" fill="${cor.fita}"/></g>`;
}

// Fita crepe: retângulo com as pontas serrilhadas
export function fita(x, y, w, rot, cor) {
  const h = 58, dente = (x0, dir) => Array.from({ length: 6 }, (_, i) => `${x0 + (i % 2 ? dir * 7 : 0)},${(i * h) / 5}`).join(" ");
  return `<g transform="translate(${x} ${y}) rotate(${rot})" opacity="0.92"><polygon points="${dente(0, 1)} ${dente(w, -1).split(" ").reverse().join(" ")}" fill="${cor.fita}"/>
    <rect x="8" y="8" width="${w - 16}" height="6" fill="#ffffff" opacity="0.25"/></g>`;
}

// Folha de setlist em (x, y), w x h, girada `rot` graus. k = entrada (0 fora da tela embaixo, 1 no lugar).
// sai = saída (0 no lugar, 1 fora da tela em cima). conteudo em coordenadas locais da folha.
export function folha({ x, y, w, h, rot, cor, k = 1, sai = 0 }, conteudo) {
  const dy = lerp(1500, 0, k) - 1900 * sai, r = rot + (1 - k) * 8;
  const pauta = cor.linha ? Array.from({ length: Math.floor((h - 130) / 72) }, (_, i) =>
    `<rect x="0" y="${130 + i * 72}" width="${w}" height="2" fill="${cor.linha}" opacity="0.7"/>`).join("") +
    `<rect x="70" y="0" width="3" height="${h}" fill="${cor.margem}" opacity="0.6"/>` : "";
  return `<g transform="translate(${x} ${(y + dy).toFixed(1)}) rotate(${r.toFixed(2)} ${w / 2} ${h / 2})">
    <rect x="14" y="22" width="${w}" height="${h}" fill="#000" opacity="0.45"/>
    <rect width="${w}" height="${h}" fill="${cor.papel}"/>${pauta}${conteudo}
    ${fita(-50, 10, 200, -38, cor)}${fita(w - 150, -110, 200, 38, cor)}${fita(-60, h - 70, 190, 34, cor)}${fita(w - 140, h + 40, 190, -34, cor)}</g>`;
}

// Escrita de caneta: o texto aparece da esquerda pra direita a partir de `at`, como se fosse escrito.
export function escreve(T, at, { x, y, t, f, cor, fonte = F_MARKER, ancora = "start", dur, rot = 0, op = 1 }) {
  const d = dur ?? Math.min(0.5, Math.max(0.2, String(t).length * 0.03)), k = clamp((T - at) / d);
  if (k <= 0 || !t) return "";
  const w = larg(t, f) * 1.15 + 60, x0 = ancora === "middle" ? x - w / 2 : ancora === "end" ? x - w : x - 20, id = novoId("ke");
  return `<g transform="rotate(${rot} ${x} ${y})" opacity="${op}"><clipPath id="${id}"><rect x="${x0.toFixed(1)}" y="${(y - f * 1.2).toFixed(1)}" width="${(w * k).toFixed(1)}" height="${(f * 1.7).toFixed(1)}"/></clipPath>
    <text x="${x}" y="${y}" text-anchor="${ancora}" font-family="${fonte}" font-size="${f.toFixed(1)}" fill="${cor}" clip-path="url(#${id})">${esc(t)}</text></g>`;
}

// Risco à mão: traço levemente torto de x1 a x2 na altura y, desenhado em 0,25 s
export function risco(T, at, { x1, x2, y, cor, w = 9 }) {
  const k = clamp((T - at) / 0.25);
  if (k <= 0) return "";
  const xe = lerp(x1, x2, k), ye = y - 10 * k;
  return `<path d="M${x1},${y + 4} Q${(x1 + xe) / 2},${y - 8} ${xe.toFixed(1)},${ye.toFixed(1)}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>`;
}

// Círculo à mão em volta de algo: elipse que passa um pouco do começo, desenhada em 0,45 s
export function circulo(T, at, { cx, cy, rx, ry, cor, w = 7 }) {
  const k = clamp((T - at) / 0.45);
  if (k <= 0) return "";
  const L = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.12;
  const d = `M${cx - rx},${cy + 6} A${rx},${ry} 0 0 1 ${cx + rx},${cy} A${rx},${ry} 0 0 1 ${cx - rx + 10},${cy - 16}`;
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${L.toFixed(1)} ${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - k)).toFixed(1)}"/>`;
}

// X de caneta (marca do show no mapa)
export function xis(T, at, { x, y, s = 30, cor, w = 9 }) {
  const k1 = clamp((T - at) / 0.15), k2 = clamp((T - at - 0.15) / 0.15);
  return (k1 > 0 ? `<path d="M${x - s},${y - s} L${(x - s + 2 * s * k1).toFixed(1)},${(y - s + 2 * s * k1).toFixed(1)}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>` : "") +
    (k2 > 0 ? `<path d="M${x + s},${y - s} L${(x + s - 2 * s * k2).toFixed(1)},${(y - s + 2 * s * k2).toFixed(1)}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"/>` : "");
}
