// Layout M ("Lambe-lambe"): peças comuns. Parede de tijolo, cartaz com borda rasgada que desenrola de cima pra baixo
// (rolo de papel na ponta), brilho de cola molhada que seca e cola escorrendo. Tudo função pura de T.
import { p, enter, lerp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";

export { esc, F_ANTON, F_INTER_XB };
// Anton é condensada: ~0.46 da altura por caractere em caixa alta (folga de segurança no 0.5)
export const cabeAnton = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.5));
export const cabeInter = (t, largura, max) => Math.min(max, largura / (Math.max(1, String(t).length) * 0.62));

let _id = 0;
const novoId = (pre) => `${pre}${++_id}`;
// ruído determinístico 0..1
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// Contorno com borda rasgada: dentes pequenos nos 4 lados, sempre os mesmos pra mesma semente.
export function rasgado(x, y, w, h, seed, amp = 9) {
  const pts = [], passo = 26;
  const lado = (n, f) => { for (let i = 0; i <= n; i++) pts.push(f(i / n, (rnd(seed + pts.length) - 0.5) * 2 * amp)); };
  lado(Math.ceil(w / passo), (t, d) => [x + t * w, y + d]);
  lado(Math.ceil(h / passo), (t, d) => [x + w + d, y + t * h]);
  lado(Math.ceil(w / passo), (t, d) => [x + w - t * w, y + h + d]);
  lado(Math.ceil(h / passo), (t, d) => [x + d, y + h - t * h]);
  return `M${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join("L")}Z`;
}

// Parede de tijolo (padrão SVG) com sombra nas bordas
export function parede(cor) {
  const id = novoId("tj");
  return `<defs><pattern id="${id}" width="180" height="90" patternUnits="userSpaceOnUse">
    <rect width="180" height="90" fill="${cor.junta}"/><rect x="4" y="4" width="172" height="37" fill="${cor.parede}"/>
    <rect x="-86" y="49" width="172" height="37" fill="${cor.parede}"/><rect x="94" y="49" width="172" height="37" fill="${cor.parede}"/>
    <rect x="20" y="10" width="60" height="6" fill="#ffffff" opacity="0.05"/><rect x="110" y="62" width="40" height="5" fill="#000" opacity="0.08"/></pattern></defs>
    <rect width="1080" height="1920" fill="url(#${id})"/><rect width="1080" height="1920" fill="${cor.bg}" opacity="0.18"/>`;
}

// Resto de cartaz velho arrancado (só papel e umas faixas de tinta), pra parede não ficar limpa
export const resto = (cor, x, y, w, h, rot, seed) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" opacity="0.55">
  <path d="${rasgado(x, y, w, h, seed, 18)}" fill="${cor.velho}"/><rect x="${x + 30}" y="${y + 40}" width="${w * 0.6}" height="${h * 0.18}" fill="${cor.tinta}" opacity="0.35"/></g>`;

// Cartaz: { svg }. Desenrola de cima pra baixo a partir de `at` (0.5 s), gira `rot` graus no centro, rolo na ponta,
// brilho de cola que seca em 1.6 s e escorridos que descem depois de colado. miolo(x, y, w, h) desenha o conteúdo.
export function cartaz(T, { x, y, w, h, rot = 0, at, cor, papel, seed = 1, miolo, escorre = 3 }) {
  const k = p(T, at, 0.5, enter);
  if (k <= 0) return "";
  const id = novoId("cz"), corte = y - 30 + (h + 60) * k, cx = x + w / 2, cy = y + h / 2;
  const rolo = k < 1 ? `<rect x="${x - 14}" y="${(corte - 22).toFixed(1)}" width="${w + 28}" height="34" rx="17" fill="${papel}"/>
    <rect x="${x - 14}" y="${(corte - 4).toFixed(1)}" width="${w + 28}" height="16" rx="8" fill="#000" opacity="0.28"/>` : "";
  const molhado = 0.22 * (1 - p(T, at + 0.4, 1.6, enter));
  const gotas = Array.from({ length: escorre }, (_, i) => {
    const gx = x + w * (0.15 + 0.7 * rnd(seed * 7 + i)), L = 40 + 110 * rnd(seed * 3 + i), d = p(T, at + 0.6 + i * 0.25, 1.4, enter);
    return d > 0 ? `<line x1="${gx.toFixed(1)}" y1="${y + h - 6}" x2="${gx.toFixed(1)}" y2="${(y + h + L * d).toFixed(1)}" stroke="${cor.cola}" stroke-width="9" stroke-linecap="round" opacity="0.55"/>` : "";
  }).join("");
  return `<g transform="rotate(${rot} ${cx} ${cy})"><clipPath id="${id}"><rect x="${x - 40}" y="${y - 40}" width="${w + 80}" height="${(corte - y + 40).toFixed(1)}"/></clipPath>
    <g clip-path="url(#${id})"><path d="${rasgado(x + 8, y + 12, w, h, seed)}" fill="#000" opacity="0.3"/><path d="${rasgado(x, y, w, h, seed)}" fill="${papel}"/>
    ${miolo(x, y, w, h)}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" opacity="${molhado.toFixed(3)}"/></g>${rolo}${k >= 1 ? gotas : ""}</g>`;
}

// Faixa de tinta com texto vazado (cor do papel por cima de bloco de tinta)
export const faixa = (x, y, w, h, fundo, tinta, texto, f, fonte = F_ANTON) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fundo}"/>
  <text x="${x + w / 2}" y="${(y + h / 2 + f * 0.36).toFixed(1)}" text-anchor="middle" font-family="${fonte}" font-size="${f.toFixed(1)}" fill="${tinta}">${esc(texto)}</text>`;

export const desce = (T, at, d = 0.4) => lerp(-1920, 0, p(T, at, d, enter));
