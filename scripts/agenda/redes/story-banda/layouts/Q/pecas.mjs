// Layout Q ("Vitalogy", homenagem ao clima do álbum de 1994: velho livro de medicina caseira, sem foto, sem logotipo e
// sem o nome do disco): peças comuns. Capa de tecido gasto com relevo dourado, página amarelada com manchas, filetes
// e molduras vitorianas, cantoneiras de foto, folha virando e textos serifados. Tudo função pura de T.
import { p, enter, lerp } from "../../tempo.mjs";
import { esc } from "../../pecas.mjs";

export { esc };
// Só existem cortes itálicos do Playfair e do Instrument Serif no projeto: o itálico é a voz do livro.
export const F_BLACK = "'Playfair Display Black','Playfair Display',Georgia,serif";
export const F_PF = "'Playfair Display',Georgia,serif";
export const F_INSTR = "'Instrument Serif','Playfair Display',Georgia,serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
// corpo que faz `t` caber em `largura` (fator = largura média de letra em relação ao corpo), sem passar de `max`
export const cabe = (t, largura, max, fator = 0.6) => Math.min(max, largura / (Math.max(1, String(t).length) * fator));

// Página aberta: área útil da folha (deixa a área segura do story de fora)
export const PG = { x: 70, y: 230, w: 940, h: 1500 };

// Texto serifado itálico. peso: "black" (Playfair Black), "bold", "reg" (Playfair) ou "instr" (Instrument Serif)
export function serif(x, y, t, f, fill, { anchor = "middle", peso = "reg", ls = 0, op = 1 } = {}) {
  const fam = peso === "black" ? F_BLACK : peso === "instr" ? F_INSTR : F_PF, w = peso === "bold" ? 700 : peso === "black" ? 900 : 400;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-style="italic" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;
}

// grão de papel/tecido: ladrilho de 200 px com pontinhos fixos (custo quase zero por quadro)
const PONTOS = Array.from({ length: 220 }, (_, i) => `<circle cx="${f1(rnd(i) * 200)}" cy="${f1(rnd(i + 300) * 200)}" r="${f1(0.6 + rnd(i + 700) * 1.1)}"/>`).join("");
const grao = (corGrao, op) => { const id = novoId("qg");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${PONTOS}</g></pattern><rect width="1080" height="1920" fill="url(#${id})" opacity="${op}"/>`; };

// Tecido da capa: cor chapada, trama fina em duas direções, desgaste nas bordas e grão
export function tecido(cor) {
  const t = novoId("qt"), v = novoId("qv");
  return `<pattern id="${t}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0,0.5 H6 M0.5,0 V6" stroke="${cor.capa2}" stroke-width="1" opacity="0.55"/></pattern>
    <radialGradient id="${v}" cx="0.5" cy="0.48" r="0.72"><stop offset="0.5" stop-color="${cor.capa}"/><stop offset="1" stop-color="${cor.capa2}"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${v})"/><rect width="1080" height="1920" fill="url(#${t})"/>${grao(cor.capa2, 0.35)}`;
}

// Página amarelada: sombra no tecido, papel com borda queimada, manchas de umidade, pintinhas de mofo e número da página
const MANCHAS = [[0.82, 0.12, 170], [0.14, 0.7, 130], [0.7, 0.88, 110], [0.3, 0.3, 80]];
const PINTAS = Array.from({ length: 26 }, (_, i) => [rnd(i + 11), rnd(i + 61), 1.5 + rnd(i + 91) * 3.5]);
export function pagina(cor, num) {
  const { x, y, w, h } = PG, g = novoId("qp"), m = novoId("qm");
  const manchas = MANCHAS.map(([a, b, r]) => `<circle cx="${f1(x + a * w)}" cy="${f1(y + b * h)}" r="${r}" fill="url(#${m})"/>`).join("");
  const pintas = PINTAS.map(([a, b, r]) => `<circle cx="${f1(x + a * w)}" cy="${f1(y + b * h)}" r="${f1(r)}" fill="${cor.mancha}" opacity="0.35"/>`).join("");
  return `<radialGradient id="${g}" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="${cor.papel}"/><stop offset="1" stop-color="${cor.papel2}"/></radialGradient>
    <radialGradient id="${m}"><stop offset="0" stop-color="${cor.mancha}" stop-opacity="0.16"/><stop offset="0.8" stop-color="${cor.mancha}" stop-opacity="0.07"/><stop offset="1" stop-color="${cor.mancha}" stop-opacity="0"/></radialGradient>
    <rect x="${x + 14}" y="${y + 18}" width="${w}" height="${h}" fill="#000" opacity="0.35"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${g})"/>${manchas}${pintas}
    <rect x="${x}" y="${y}" width="22" height="${h}" fill="${cor.mancha}" opacity="0.12"/>
    ${moldura(x + 34, y + 34, w - 68, h - 68, cor.tinta, 0.75)}
    ${num ? serif(x + w / 2, y + h - 52, `· ${num} ·`, 30, cor.tinta, { op: 0.7 }) : ""}`;
}

// Moldura vitoriana fina: filete duplo e um floreio (pétala + ponto) em cada canto
export function moldura(x, y, w, h, tinta, op = 1, s = 1) {
  const canto = (cx, cy, sx, sy) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${sx * s} ${sy * s})">
    <path d="M0,0 C18,2 30,14 32,32 C14,30 2,18 0,0 Z M8,8 L22,22" fill="none" stroke="${tinta}" stroke-width="1.6"/><circle cx="38" cy="38" r="3" fill="${tinta}"/></g>`;
  return `<g opacity="${op}" fill="none" stroke="${tinta}"><rect x="${x}" y="${y}" width="${w}" height="${h}" stroke-width="2.4"/>
    <rect x="${x + 10 * s}" y="${y + 10 * s}" width="${w - 20 * s}" height="${h - 20 * s}" stroke-width="1"/></g>
    <g opacity="${op}">${canto(x + 12 * s, y + 12 * s, 1, 1)}${canto(x + w - 12 * s, y + 12 * s, -1, 1)}${canto(x + 12 * s, y + h - 12 * s, 1, -1)}${canto(x + w - 12 * s, y + h - 12 * s, -1, -1)}</g>`;
}

// Filete ornamental: duas linhas que afinam até um losango central com pontinhos
export const filete = (cx, y, w, tinta, op = 1) => `<g opacity="${op}" fill="${tinta}">
  <path d="M${f1(cx - w / 2)},${y} L${f1(cx - 26)},${y - 2.2} L${f1(cx - 26)},${y + 2.2} Z M${f1(cx + w / 2)},${y} L${f1(cx + 26)},${y - 2.2} L${f1(cx + 26)},${y + 2.2} Z"/>
  <path d="M${cx},${y - 11} L${cx + 13},${y} L${cx},${y + 11} L${cx - 13},${y} Z"/><circle cx="${cx - 20}" cy="${y}" r="2.6"/><circle cx="${cx + 20}" cy="${y}" r="2.6"/></g>`;

// Cantoneira de foto (triângulo de papel escuro) no canto (x, y), virada pra dentro (sx, sy = ±1)
export const cantoneira = (x, y, sx, sy, cor, t = 64) => `<path d="M${x},${y} L${x + sx * t},${y} L${x},${y + sy * t} Z" fill="${cor.canto}"/>
  <path d="M${x + sx * t},${y} L${x},${y + sy * t}" stroke="${cor.papel}" stroke-width="1.5" opacity="0.35"/>`;

// Folha virando (da direita pra esquerda, pivô na lombada): cobre a página nova no começo da cena
export function viraFolha(T, at, cor) {
  const k = p(T, at, 0.55, enter);
  if (k >= 1) return "";
  const { x, y, w, h } = PG, borda = x + w * Math.cos(Math.PI * k), frente = borda >= x;
  const a = Math.min(x, borda), largura = Math.abs(borda - x), sombra = novoId("qs");
  return `<linearGradient id="${sombra}" x1="${frente ? 1 : 0}" x2="${frente ? 0 : 1}"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/></linearGradient>
    <rect x="${f1(a)}" y="${y}" width="${f1(largura)}" height="${h}" fill="${frente ? cor.papel : cor.papel2}"/>
    <rect x="${f1(a)}" y="${y}" width="${f1(largura)}" height="${h}" fill="url(#${sombra})"/>
    <rect x="${x}" y="${y}" width="${f1(Math.max(0, w * (1 - k)))}" height="${h}" fill="#000" opacity="${(0.12 * (1 - k)).toFixed(3)}"/>`;
}

// Troca de cena da abertura: o tecido sobe e cobre o clipe
export const varre = (T, at, cor) => {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  return y < 1920 ? `<g transform="translate(0 ${f1(y)})">${tecido(cor)}</g>` : "";
};

// Algarismos romanos pros capítulos (1 a 20 basta)
export const romano = (n) => ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n);
