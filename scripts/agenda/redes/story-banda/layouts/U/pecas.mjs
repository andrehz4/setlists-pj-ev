// Layout U (homenagem ao clima do álbum de 2002: documento de protesto num inverno seco, sem foto, sem logotipo e sem
// o nome do disco): peças comuns. Texto de máquina de escrever (Inter em grade monoespaçada, cada letra com tinta e
// altura desiguais, batida letra a letra), rótulo impresso de formulário e folha de ofício amarelada. Função pura de T.
import { p, enter, lerp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";
import { largura, corpoQueCabe } from "./medida.mjs";

export { esc, F_ANTON, largura, corpoQueCabe };
// Não há fonte de máquina no projeto: a "máquina" é Inter Regular em grade fixa (passo PASSO x corpo), com traço fino
// por cima pra engrossar a tinta como fita gasta.
export const F_MAQ = "'Inter',system-ui,sans-serif";
export const PASSO = 0.64;
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
// corpo da máquina em que `t` (n letras) cabe em `w` px, até `max`
export const cabeMaq = (t, w, max) => Math.min(max, w / (Math.max(1, [...String(t)].length) * PASSO));
// letras batidas até T: começa em t0, uma letra a cada `passo` s
export const batidas = (T, t0, passo) => (T < t0 ? 0 : Math.floor((T - t0) / passo) + 1);
// letras largas que a máquina aperta pra caber na casa
const LARGAS = new Set([..."MWmw@%&"]);

// Linha datilografada. n = quantas letras já foram batidas (Infinity = todas). anchor: start | middle | end.
export function maquina(x, y, t, f, cor, { n = Infinity, anchor = "start", seed = 1, tinta = cor.tinta, op = 1, cursor = false } = {}) {
  const letras = [...String(t)], passo = f * PASSO, larg = letras.length * passo;
  const x0 = anchor === "middle" ? x - larg / 2 : anchor === "end" ? x - larg : x;
  let s = "";
  letras.slice(0, n).forEach((ch, i) => {
    if (ch === " ") return;
    const r1 = rnd(seed * 31 + i), r2 = rnd(seed * 57 + i * 3), cx = x0 + (i + 0.5) * passo;
    const dy = (r1 - 0.5) * f * 0.05, giro = (r2 - 0.5) * 2.4, tom = 0.7 + 0.3 * rnd(seed * 13 + i * 7), sx = LARGAS.has(ch) ? 0.8 : 1;
    s += `<text transform="translate(${f1(cx)} ${f1(y + dy)}) rotate(${giro.toFixed(2)}) scale(${sx} 1)" text-anchor="middle" font-family="${F_MAQ}" font-size="${f1(f)}" fill="${tinta}" stroke="${tinta}" stroke-width="${f1(f * 0.018)}" opacity="${(tom * op).toFixed(3)}">${esc(ch)}</text>`;
  });
  // cursor da máquina: traço sob a próxima casa enquanto bate
  if (cursor && n < letras.length) s += `<rect x="${f1(x0 + n * passo + passo * 0.12)}" y="${f1(y + f * 0.12)}" width="${f1(passo * 0.76)}" height="${f1(Math.max(3, f * 0.07))}" fill="${cor.carimbo}"/>`;
  return s;
}

// Rótulo impresso do formulário (Inter ExtraBold, caixa alta espaçada)
export const rotulo = (x, y, t, f, fill, { anchor = "start", op = 0.75, ls = 3 } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_INTER_XB}" font-weight="800" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;

// grão: ladrilho de 200 px com pontos fixos (calculado uma vez)
const PONTOS = Array.from({ length: 240 }, (_, i) => `<circle cx="${f1(rnd(i) * 200)}" cy="${f1(rnd(i + 400) * 200)}" r="${f1(0.5 + rnd(i + 800) * 1.1)}"/>`).join("");
export const grao = (corGrao, op, { x = 0, y = 0, w = 1080, h = 1920 } = {}) => {
  const id = novoId("ug");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${PONTOS}</g></pattern>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})" opacity="${op}"/>`;
};

// Área da folha de ofício nas cenas de página inteira (fora da área segura do story)
export const FL = { x: 110, y: 240, w: 860, h: 1460 };
// margem de texto dentro da folha (depois dos furos de arquivo)
export const MX = FL.x + 110, MW = FL.w - 170;

// Folha de ofício amarelada: sombra, papel com borda envelhecida, dobra, manchas, furos de arquivo, margem e grão.
// miolo(x, y, w, h) desenha o conteúdo por cima. A folha entra de baixo em `at` e assenta em `rot`.
const MANCHAS = [[0.8, 0.14, 160], [0.18, 0.78, 140], [0.66, 0.9, 90]];
export function folha(T, { x = FL.x, y = FL.y, w = FL.w, h = FL.h, rot = 0, at = null, cor, seed = 1, furos = true, miolo = () => "" }) {
  const k = at === null ? 1 : p(T, at, 0.45, enter);
  if (k <= 0) return "";
  const dy = lerp(1300, 0, k), giro = lerp(rot + 6 * (rnd(seed) - 0.5) + 4, rot, k), g = novoId("uf"), m = novoId("um"), cl = novoId("uc");
  const manchas = MANCHAS.map(([a, b, r], i) => `<circle cx="${f1(x + a * w)}" cy="${f1(y + b * h)}" r="${f1(r * (0.7 + 0.6 * rnd(seed + i)))}" fill="url(#${m})"/>`).join("");
  const furo = (yy) => `<circle cx="${x + 46}" cy="${f1(yy)}" r="13" fill="${cor.ceu2}"/><circle cx="${x + 46}" cy="${f1(yy)}" r="13" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="2.5"/>`;
  return `<g transform="translate(0 ${f1(dy)}) rotate(${giro.toFixed(2)} ${f1(x + w / 2)} ${f1(y + h / 2)})">
    <radialGradient id="${g}" cx="0.5" cy="0.45" r="0.8"><stop offset="0.55" stop-color="${cor.papel}"/><stop offset="1" stop-color="${cor.papel2}"/></radialGradient>
    <radialGradient id="${m}"><stop offset="0" stop-color="${cor.mancha}" stop-opacity="0.13"/><stop offset="0.75" stop-color="${cor.mancha}" stop-opacity="0.06"/><stop offset="1" stop-color="${cor.mancha}" stop-opacity="0"/></radialGradient>
    <rect x="${x + 12}" y="${y + 20}" width="${w}" height="${h}" fill="#000" opacity="0.28"/><rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" fill="#000" opacity="0.18"/>
    <clipPath id="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${g})"/>
    <g clip-path="url(#${cl})">${manchas}${grao(cor.mancha, 0.22, { x, y, w, h })}
      <rect x="${x}" y="${f1(y + h * 0.34)}" width="${w}" height="3" fill="#000" opacity="0.06"/><rect x="${x}" y="${f1(y + h * 0.34 + 3)}" width="${w}" height="2" fill="#fff" opacity="0.18"/></g>
    <path d="M${x + 88},${y} V${y + h} M${x + 94},${y} V${y + h}" stroke="${cor.carimbo}" stroke-width="1.2" opacity="0.35"/>
    ${furos ? furo(y + h * 0.3) + furo(y + h * 0.7) : ""}${miolo(x, y, w, h)}</g>`;
}

// Cabeçalho de página: rótulo à esquerda, AUTO Nº à direita e fio duplo embaixo
export const cabecalho = (cor, esq, auto, y = FL.y + 92) => rotulo(MX, y, esq, 22, cor.tinta) + rotulo(FL.x + FL.w - 60, y, auto, 22, cor.tinta, { anchor: "end" }) +
  `<path d="M${MX},${y + 22} H${FL.x + FL.w - 60} M${MX},${y + 28} H${FL.x + FL.w - 60}" stroke="${cor.tinta}" stroke-width="1.2" opacity="0.55"/>`;

// número do auto, fixo pelo dia
export const autoN = (dia) => `AUTO Nº ${dia.slice(5, 7)}${dia.slice(8, 10)}/${dia.slice(0, 4)}`;
