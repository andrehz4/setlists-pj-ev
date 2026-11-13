// Layout H (disco de vinil): peças comuns. Disco girando a 33 rpm (198°/s), braço da vitrola, adesivo redondo, texto
// que sobe de dentro de uma máscara e fundo em íris. Tudo função pura de T.
import { esc, F_INTER_XB } from "../../pecas.mjs";

export const F_ARCHIVO = "'Archivo Black','Inter ExtraBold',sans-serif";
export const F_SERIF = "'Instrument Serif',Georgia,serif";
export { esc, F_INTER_XB };
export const RPM33 = 198;
export const larguraArchivo = (t, f) => String(t).length * 0.78 * f;
// corpo do Archivo que faz `t` caber em `largura`, sem passar de `max`
export const cabe = (t, largura, max) => Math.min(max, largura / (String(t).length * 0.78));

let _id = 0;
const novoId = (p) => `${p}${++_id}`;

// Disco: vinil com sulcos, brilho parado (a luz não gira) e selo girando com o logo (ou cor sólida com texto).
export function disco(T, { cx, cy, r, ang, cor, logoUri, selo }) {
  const sulcos = [];
  for (let k = 0.42; k < 0.97; k += 0.035) sulcos.push(`<circle cx="${cx}" cy="${cy}" r="${(r * k).toFixed(1)}" fill="none" stroke="#262422" stroke-width="1.6"/>`);
  const brilho = [20, 200].map((a) => `<path d="M${cx},${cy} L${cx + r * Math.cos((a - 12) * Math.PI / 180)},${cy + r * Math.sin((a - 12) * Math.PI / 180)} A${r},${r} 0 0 1 ${cx + r * Math.cos((a + 12) * Math.PI / 180)},${cy + r * Math.sin((a + 12) * Math.PI / 180)} Z" fill="#ffffff" opacity="0.07"/>`).join("");
  const rs = r * 0.36, id = novoId("sl");
  const miolo = logoUri
    ? `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${rs}"/></clipPath><image href="${logoUri}" x="${cx - rs}" y="${cy - rs}" width="${rs * 2}" height="${rs * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${rs}" fill="${cor.acento}"/>${selo ? `<text x="${cx}" y="${cy + rs * 0.12}" text-anchor="middle" font-family="${F_ARCHIVO}" font-size="${(rs * 0.3).toFixed(1)}" fill="${cor.sobreAcento}">${esc(selo)}</text>` : ""}`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cor.disco}"/>${sulcos.join("")}${brilho}
  <g transform="rotate(${ang.toFixed(2)} ${cx} ${cy})">${miolo}<circle cx="${cx}" cy="${cy - rs * 0.8}" r="${rs * 0.05}" fill="#ffffff" opacity="0.6"/></g>
  <circle cx="${cx}" cy="${cy}" r="${Math.max(6, r * 0.022)}" fill="${cor.disco}"/>`;
}

// Braço da vitrola: pivô em (px, py), ângulo em graus (0 = apontando pra baixo).
export function braco({ px, py, ang, cor }) {
  return `<g transform="rotate(${ang.toFixed(2)} ${px} ${py})"><circle cx="${px}" cy="${py}" r="46" fill="${cor.tinta}"/><circle cx="${px}" cy="${py}" r="20" fill="${cor.bg}"/>
  <rect x="${px - 9}" y="${py}" width="18" height="520" rx="9" fill="${cor.tinta}"/><rect x="${px - 30}" y="${py + 500}" width="60" height="90" rx="8" fill="${cor.tinta}"/></g>`;
}

// Adesivo redondo girado, com até 2 linhas.
export function adesivo({ cx, cy, r, rot, s = 1, fundo, cor, linhas }) {
  const f = r * 0.36;
  const txt = linhas.map((l, i) => `<text x="${cx}" y="${(cy + (i - (linhas.length - 1) / 2) * f * 1.1 + f * 0.36).toFixed(1)}" text-anchor="middle" font-family="${F_ARCHIVO}" font-size="${cabe(l, r * 1.6, f).toFixed(1)}" fill="${cor}">${esc(l)}</text>`).join("");
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fundo}"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${cor}" stroke-width="3" stroke-dasharray="4 8"/>${txt}</g>`;
}

// Linha de texto que sobe de dentro de uma máscara (k de 0 a 1).
export function sobe(k, { x, y, f, texto, fill, familia = F_ARCHIVO, ancora = "start", sombra }) {
  if (k <= 0) return "";
  const id = novoId("sb"), dy = (1 - k) * f * 1.1;
  const t = (dx, cor) => `<text x="${x + dx}" y="${(y + dy + dx).toFixed(1)}" text-anchor="${ancora}" font-family="${familia}" font-size="${f.toFixed(1)}" fill="${cor}">${esc(texto)}</text>`;
  return `<clipPath id="${id}"><rect x="0" y="${(y - f * 1.02).toFixed(1)}" width="1080" height="${(f * 1.32).toFixed(1)}"/></clipPath>
  <g clip-path="url(#${id})">${sombra ? t(7, sombra) : ""}${t(0, fill)}</g>`;
}

export const iris = (k, cx, cy, fill) => (k > 0 ? `<circle cx="${cx}" cy="${cy}" r="${(2400 * k).toFixed(1)}" fill="${fill}"/>` : "");
