// Layout J ("Conversa"): peças de chat. Balão (meu à direita, do amigo à esquerda) que estoura do canto, texto com
// quebra por palavra, "digitando" com 3 pontos, cabeçalho do grupo e notificação. Tudo função pura de T.
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { esc, F_INTER_XB } from "../../pecas.mjs";
import { F_INTER } from "../../../../../publish/fontconfig-boot.mjs";

export { esc, F_INTER_XB, F_INTER };
export const larg = (t, f) => String(t).length * 0.56 * f;

// quebra por palavra em linhas de até `largura` px
export function quebra(texto, f, largura) {
  const linhas = [];
  for (const w of String(texto).split(/\s+/)) {
    const ult = linhas.at(-1);
    if (ult && larg(`${ult} ${w}`, f) <= largura) linhas[linhas.length - 1] = `${ult} ${w}`;
    else linhas.push(w);
  }
  return linhas;
}

// Balão: devolve { svg, h }. lado "eu" (direita) ou "outro" (esquerda). miolo(x, y, w) desenha dentro (opcional).
export function balao(T, { lado, y, at, cor, texto, f = 56, w: wFixo, hMiolo = 0, miolo, autor }) {
  const linhas = texto ? quebra(texto, f, (wFixo || 860) - 64) : [];
  const w = wFixo || Math.max(...linhas.map((l) => larg(l, f))) + 64;
  const hTexto = linhas.length ? linhas.length * f * 1.25 + 40 : 0, h = hMiolo + hTexto + (autor ? 46 : 0);
  const k = p(T, at, 0.35, pop);
  if (k <= 0) return { svg: "", h };
  const eu = lado === "eu", x = eu ? 1020 - w : 60, ox = eu ? x + w : x, oy = y + h;
  const fundo = eu ? cor.eu : cor.outro, tinta = eu ? cor.textoEu : cor.texto;
  const cauda = eu ? `M${x + w - 30},${y + h - 30} L${x + w + 16},${y + h} L${x + w - 50},${y + h} Z` : `M${x + 30},${y + h - 30} L${x - 16},${y + h} L${x + 50},${y + h} Z`;
  let yy = y + (autor ? 46 : 0);
  const nome = autor ? `<text x="${x + 32}" y="${y + 40}" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${cor.acento}">${esc(autor)}</text>` : "";
  const corpo = (miolo ? miolo(x, yy, w) : "") + linhas.map((l, i) => `<text x="${x + 32}" y="${(yy + hMiolo + 20 + f * 1.02 + i * f * 1.25).toFixed(1)}" font-family="${F_INTER}" font-size="${f}" fill="${tinta}">${esc(l)}</text>`).join("");
  return { h, svg: `<g opacity="${Math.min(1, k * 2).toFixed(3)}" transform="translate(${ox} ${oy}) scale(${lerp(0.6, 1, k).toFixed(4)}) translate(${-ox} ${-oy})">
    <path d="${cauda}" fill="${fundo}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${fundo}"/>${nome}${corpo}</g>` };
}

// "digitando...": 3 pontos pulando num balão pequeno, visível entre t0 e t1
export function digitando(T, t0, t1, y, cor) {
  if (T < t0 || T >= t1) return "";
  const pts = [0, 1, 2].map((i) => `<circle cx="${120 + i * 36}" cy="${(y + 50 - 10 * Math.max(0, Math.sin((T - t0) * 12 - i * 0.9))).toFixed(1)}" r="11" fill="${cor.apoio}"/>`).join("");
  return `<rect x="60" y="${y}" width="200" height="100" rx="34" fill="${cor.outro}"/>${pts}`;
}

// cabeçalho do grupo (abaixo da área segura de cima)
export const topo = (cor, sub) => `<rect x="0" y="0" width="1080" height="340" fill="${cor.topo}"/>
  <circle cx="130" cy="275" r="50" fill="${cor.acento}"/><text x="130" y="291" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="40" fill="${cor.topo}">PJ</text>
  <text x="205" y="268" font-family="${F_INTER_XB}" font-weight="800" font-size="44" fill="${cor.texto}">Galera do show</text>
  <text x="205" y="312" font-family="${F_INTER}" font-size="32" fill="${cor.apoio}">${esc(sub)}</text>`;

export const fundo = (cor) => `<rect width="1080" height="1920" fill="${cor.bg}"/>`;
export const entra = (T, t) => p(T, t, 0.3, enter);
