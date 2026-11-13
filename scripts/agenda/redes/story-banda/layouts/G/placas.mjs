// Layout G (painel de embarque): plaquinhas split-flap. Cada letra gira por caracteres antes de parar, com a aba de
// cima dobrando a cada troca. Tudo determinístico (o giro sai de um hash do índice), função pura de T.
import { esc, F_INTER_XB } from "../../pecas.mjs";

const GIRO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PASSO = 0.05; // s por troca de letra no giro
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };

// Letra no instante T: vazia antes de começar, girando até parar (para em `para`), fixa depois.
export function letraEm(T, ch, comeca, para, semente) {
  if (T < comeca) return { ch: "", dobra: 0 };
  if (T >= para || ch === " ") return { ch, dobra: 0 };
  const k = Math.floor((T - comeca) / PASSO);
  return { ch: GIRO[hash(semente, k) % GIRO.length], dobra: 1 - ((T - comeca) % PASSO) / PASSO };
}

// Uma plaquinha w x h em (x, y). cor: { placa, letra, bg }. f = corpo da letra.
export function placa(T, { x, y, w, h, ch, comeca, para, semente, cor, corLetra, f = h * 0.72 }) {
  const { ch: c, dobra } = letraEm(T, ch, comeca, para, semente);
  if (T < comeca - 0.25) return "";
  const meio = y + h / 2, r = Math.min(8, w * 0.1);
  const aba = dobra > 0 ? `<rect x="${x}" y="${(meio - (h / 2) * dobra).toFixed(1)}" width="${w}" height="${((h / 2) * dobra).toFixed(1)}" rx="${r}" fill="${cor.placaClara}"/>` : "";
  const letra = c && c !== " " ? `<text x="${(x + w / 2).toFixed(1)}" y="${(meio + f * 0.36).toFixed(1)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${f.toFixed(1)}" fill="${corLetra || cor.letra}">${esc(c)}</text>` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${cor.placa}"/>${letra}${aba}
  <rect x="${x}" y="${(meio - 1.5).toFixed(1)}" width="${w}" height="3" fill="${cor.bg}"/>`;
}

// Fileira de plaquinhas com o texto; a letra i para em t0 + i·passo (+ giro). alinhar: "esq" | "centro".
export function fileira(T, texto, { x, y, w, h, gap = 6, t0, passo = 0.035, giro = 0.35, cor, corLetra, semente = 0, alinhar = "esq", colunas, f }) {
  const letras = [...String(texto).toUpperCase()];
  const n = Math.max(colunas || 0, letras.length);
  const largura = n * w + (n - 1) * gap;
  const x0 = alinhar === "centro" ? x - largura / 2 : x;
  return letras.concat(Array(n - letras.length).fill(" ")).map((ch, i) => placa(T, { x: x0 + i * (w + gap), y, w, h, ch,
    comeca: t0 + i * passo * 0.4, para: t0 + giro + i * passo, semente: semente * 97 + i, cor, corLetra, f })).join("");
}

// Maior plaquinha (largura) que cabe: n letras em `largura`, sem passar de `max`.
export const larguraPlaca = (n, largura, max, gap = 6) => Math.min(max, (largura - (n - 1) * gap) / n);

// Quebra o nome em linhas de até `max` letras (por palavra), no máximo 4 linhas.
export function linhasDoNome(nome, max = 10) {
  const linhas = [];
  for (const p of String(nome).toUpperCase().split(/\s+/)) {
    const ult = linhas.at(-1);
    if (ult && ult.length + 1 + p.length <= max) linhas[linhas.length - 1] = `${ult} ${p}`;
    else linhas.push(p);
  }
  return linhas.slice(0, 4);
}

// Persiana que fecha (cobre a tela) entre t0 e t0 + d, lâmina a lâmina de cima pra baixo.
export function persiana(T, t0, d, fill, n = 12) {
  const h = 1920 / n;
  return Array.from({ length: n }, (_, i) => {
    const k = Math.min(1, Math.max(0, (T - t0 - i * 0.012) / d));
    return k > 0 ? `<rect x="0" y="${(i * h).toFixed(1)}" width="1080" height="${(h * k + 1).toFixed(1)}" fill="${fill}"/>` : "";
  }).join("");
}

export const rotulo = (texto, x, y, cor, { f = 28, ancora = "start", op = 1 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${ancora}" font-family="${F_INTER_XB}" font-weight="800" font-size="${f}" letter-spacing="${(f * 0.18).toFixed(1)}" fill="${cor}" opacity="${op}">${esc(texto)}</text>`;
