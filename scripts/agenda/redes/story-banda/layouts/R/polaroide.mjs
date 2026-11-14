// Layout R: a foto instantânea. Moldura branca com a faixa de baixo mais larga (proporção de filme instantâneo),
// sombra suave que cresce quando a foto está no ar, acabamento de filme na imagem (cor desbotada, vinheta, vazamento
// de luz, granulação) e a revelação: a imagem sai de um cinza esverdeado, passa pelo sépia e chega na cor.
import { grao, sombra, fita, tachinha, novoId, f1, rnd } from "./pecas.mjs";

// medidas em função da largura w: margem lateral/topo, lado da imagem quadrada e altura total
export const medidas = (w) => { const m = w * 0.055, s = w - 2 * m, H = w * 1.22; return { m, s, H, faixa: H - m - s }; };

// Acabamento de filme instantâneo por cima do desenho (x, y, s = quadrado da imagem)
function filme(x, y, s, cor, sd) {
  const v = novoId("rf"), l = novoId("rl"), canto = Math.floor(rnd(sd) * 4), [lx, ly] = [[0, 0], [1, 0], [1, 1], [0, 1]][canto];
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.luz}" opacity="0.13"/>
    <radialGradient id="${v}" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></radialGradient>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="url(#${v})"/>
    <linearGradient id="${l}" x1="${lx}" y1="${ly}" x2="${1 - lx}" y2="${1 - ly}"><stop offset="0" stop-color="${cor.filme.quente}" stop-opacity="0.34"/><stop offset="0.45" stop-color="${cor.filme.quente}" stop-opacity="0"/></linearGradient>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="url(#${l})"/>
    ${grao("#000", 0.16, [x, y, s, s])}${grao("#fff", 0.08, [x, y, s, s], true)}`;
}

// revelação: r = 0 (cinza esverdeado chapado) .. 1 (pronta). O sépia aparece no meio do caminho.
const revelacao = (x, y, s, r, cor) => {
  if (r >= 1) return "";
  const cinza = Math.pow(1 - r, 1.3), sepia = 0.45 * Math.sin(Math.PI * Math.min(1, r * 1.15));
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.sepia}" opacity="${sepia.toFixed(3)}"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.vela}" opacity="${cinza.toFixed(3)}"/>`;
};

// Polaroide centrada em (cx, cy). foto(x, y, s) desenha a imagem; legenda(x, y, w, h) escreve na faixa de baixo.
// alto (0..1) = no ar (sombra maior, mais longe, foto um pouco maior); preso = "fita" | "tacha" | null.
export function polaroide({ cx, cy, w, rot = 0, foto = () => "", legenda = () => "", revela = 1, alto = 0, op = 1, cor, sd = 1, preso = null }) {
  if (op <= 0) return "";
  const { m, s, H, faixa } = medidas(w), x0 = -w / 2, y0 = -H / 2, ix = x0 + m, iy = y0 + m;
  const sl = sombra(5 + 16 * alto), sc = sombra(1.6), mol = novoId("rm"), cl = novoId("rk"), esc = 1 + 0.1 * alto;
  const dx = 5 + 26 * alto, dy = 9 + 40 * alto;
  const fundoSombra = `<g transform="translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot}) scale(${esc.toFixed(3)})">${sl.def}
    <rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(H)}" fill="#000" opacity="${(0.34 - 0.12 * alto).toFixed(3)}" filter="url(#${sl.id})"/></g>`;
  const contato = alto < 0.3 ? `<g transform="translate(${f1(cx + 1)} ${f1(cy + 2)}) rotate(${rot})">${sc.def}<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(H)}" fill="#000" opacity="${(0.28 * (1 - alto / 0.3)).toFixed(3)}" filter="url(#${sc.id})"/></g>` : "";
  const preso_ = preso === "fita" ? fita(0, y0 + 4, w * 0.34, w * 0.1, -4 + 8 * rnd(sd + 5), cor, sd)
    : preso === "tacha" ? tachinha(0, y0 + m * 0.9, Math.max(12, w * 0.04), cor) : "";
  return `<g opacity="${Math.min(1, op).toFixed(3)}">${fundoSombra}${contato}
    <g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${esc.toFixed(3)})">
    <linearGradient id="${mol}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor.moldura}"/><stop offset="1" stop-color="${cor.moldura2}"/></linearGradient>
    <rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(H)}" fill="url(#${mol})"/>${grao("#000", 0.05, [x0, y0, w, H])}
    <rect x="${f1(x0 + 0.5)}" y="${f1(y0 + 0.5)}" width="${f1(w - 1)}" height="${f1(H - 1)}" fill="none" stroke="#000" stroke-opacity="0.1" stroke-width="1"/>
    <clipPath id="${cl}"><rect x="${f1(ix)}" y="${f1(iy)}" width="${f1(s)}" height="${f1(s)}"/></clipPath>
    <g clip-path="url(#${cl})"><rect x="${f1(ix)}" y="${f1(iy)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.ceu2}"/>${foto(ix, iy, s)}${filme(ix, iy, s, cor, sd)}${revelacao(ix, iy, s, revela, cor)}</g>
    <rect x="${f1(ix)}" y="${f1(iy)}" width="${f1(s)}" height="${f1(s)}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="1.4"/>
    <path d="M${f1(ix)},${f1(iy + s + 1.5)} H${f1(ix + s)}" stroke="#fff" stroke-opacity="0.7" stroke-width="1.5"/>
    ${legenda(x0, iy + s, w, faixa)}${preso_}</g></g>`;
}
