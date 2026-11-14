// Layout X (homenagem ao clima do álbum de 2013: eletricidade e geometria art déco, sem a capa, o símbolo dela ou a
// tipografia dela): peças comuns. Fundo déco (degradê, leque de raios finos, filetes paralelos, grão), moldura em
// degraus, leque, letreiro de neon em tubo (vidro apagado + halo com blur) e o pisca suave de quando o neon liga.
import { p, enter, lerp, clamp } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";
import { largura, cabe } from "./medida.mjs";

export { esc, F_ANTON, F_INTER_XB, largura, cabe };
export const F_INTER_SB = "'Inter SemiBold','Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
export const op3 = (v) => clamp(v).toFixed(3);

// texto simples. fonte: "anton" | "xb" (Inter ExtraBold) | "sb" (Inter SemiBold)
const FAM = { anton: [F_ANTON, 400], xb: [F_INTER_XB, 800], sb: [F_INTER_SB, 600] };
export function txt(x, y, t, f, fill, { fonte = "anton", anchor = "middle", ls = 0, op = 1, extra = "" } = {}) {
  const [fam, w] = FAM[fonte];
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op3(op)}" ${extra}>${esc(t)}</text>`;
}

// filtro de brilho (halo do neon): blur gaussiano com região larga pra não cortar o halo
export function halo(desvio) {
  const id = novoId("xh");
  return { id, def: `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${desvio}"/></filter>` };
}

// Pisca do neon ligando em t0: começa apagado (0.06), sobe em 0.7 s com duas quedas SUAVES (gaussianas largas,
// nunca a zero) e assenta em 1 com um zumbido levíssimo. Nada de estroboscópio.
export function ligado(T, t0) {
  const dt = T - t0;
  if (dt <= 0) return 0.06;
  const queda = (c, a) => a * Math.exp(-(((dt - c) / 0.06) ** 2));
  return clamp(lerp(0.06, 1, p(T, t0, 0.7, enter)) - queda(0.18, 0.4) - queda(0.42, 0.3)) * (1 - 0.03 * Math.sin(T * 23));
}

// Letreiro de neon em tubo: texto grande (corpo >= 100) em contorno, o próprio contorno vira tubo; texto menor vem
// cheio (miolo claro), senão o contorno embola. Camadas: vidro apagado (sempre), halo largo com blur, halo médio,
// tubo colorido e núcleo quase branco. `k` = brilho 0..1 (use ligado()).
export function neon(x, y, t, f, cor, k, { anchor = "middle", ls = 0, tubo = cor.neon, nucleo = cor.nucleo } = {}) {
  const a = halo(f * 0.16), b = halo(f * 0.045), w = Math.max(2.2, f * 0.035), cheio = f < 100;
  const camada = (stroke, sw, o, filtro, fill = "none") => txt(x, y, t, f, fill, { anchor, ls, op: o,
    extra: `stroke="${stroke}" stroke-width="${f1(sw)}" stroke-linejoin="round"${filtro ? ` filter="url(#${filtro})"` : ""}` });
  const vidro = cheio ? camada(tubo, 0, 0.2, null, tubo) : camada(tubo, w * 1.3, 0.22);
  const miolo = cheio ? camada(tubo, w * 0.9, k, null, nucleo) : `${camada(tubo, w * 1.4, k)}${camada(nucleo, w * 0.55, 0.92 * k)}`;
  return `${a.def}${b.def}${vidro}${camada(tubo, w * 3.4, 0.55 * k, a.id, cheio ? tubo : "none")}${camada(tubo, w * 2, 0.8 * k, b.id)}${miolo}`;
}

// grão: ladrilho de 200 px com pontinhos fixos
const PONTOS = Array.from({ length: 200 }, (_, i) => `<circle cx="${f1(rnd(i) * 200)}" cy="${f1(rnd(i + 400) * 200)}" r="${f1(0.5 + rnd(i + 800))}"/>`).join("");
export const grao = (corGrao, op) => { const id = novoId("xg");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${PONTOS}</g></pattern><rect width="1080" height="1920" fill="url(#${id})" opacity="${op}"/>`; };

// Leque déco: raios finos saindo de (cx, cy) entre os ângulos a0 e a1 (graus, 0 = direita, sentido horário),
// com arcos concêntricos. Serve de nascer do sol no fundo e de enfeite de moldura.
export function leque(cx, cy, r, a0, a1, n, cor, { op = 1, w = 1.2, arcos = [0.35, 0.62] } = {}) {
  const rad = (g) => (g * Math.PI) / 180, pt = (g, rr) => `${f1(cx + Math.cos(rad(g)) * rr)},${f1(cy + Math.sin(rad(g)) * rr)}`;
  const raios = Array.from({ length: n + 1 }, (_, i) => `M${pt(a0 + ((a1 - a0) * i) / n, r * 0.12)} L${pt(a0 + ((a1 - a0) * i) / n, r)}`).join("");
  const arco = (rr) => `M${pt(a0, rr)} A${f1(rr)},${f1(rr)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${pt(a1, rr)}`;
  return `<g fill="none" stroke="${cor}" stroke-width="${w}" opacity="${op3(op)}"><path d="${raios}"/><path d="${[0.12, ...arcos, 1].map(arco).join("")}"/></g>`;
}

// Moldura déco em degraus: contorno com cantos recortados em 2 degraus e um filete interno
export function molduraDeco(x, y, w, h, cor, { s = 26, op = 1, sw = 2.4 } = {}) {
  const d = (o) => { const X = x + o, Y = y + o, W = w - 2 * o, H = h - 2 * o, q = s, m = s / 2;
    return `M${X + q},${Y} H${X + W - q} V${Y + m} H${X + W - m} V${Y + q} H${X + W} V${Y + H - q} H${X + W - m} V${Y + H - m} H${X + W - q} V${Y + H}
      H${X + q} V${Y + H - m} H${X + m} V${Y + H - q} H${X} V${Y + q} H${X + m} V${Y + m} H${X + q} Z`; };
  return `<g fill="none" stroke="${cor}" opacity="${op3(op)}"><path d="${d(0)}" stroke-width="${sw}"/><path d="${d(12)}" stroke-width="${f1(sw * 0.45)}"/></g>`;
}

// Fundo déco: degradê vertical, nascer do sol de raios finos embaixo, três filetes paralelos de cada lado
// (com degrau no alto), vinheta e grão. Nada de foto.
export function fundo(cor) {
  const g = novoId("xf"), v = novoId("xv");
  const filetes = [0, 1, 2].map((i) => { const a = 44 + i * 12, b = 1080 - a, t = 150 + i * 12;
    return `M${a},1920 V${t + 60} L${a + 30},${t} H${b - 30} L${b},${t + 60} V1920`; }).join("");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.bg2}"/><stop offset="0.55" stop-color="${cor.bg}"/><stop offset="1" stop-color="${cor.bg}"/></linearGradient>
    <radialGradient id="${v}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${g})"/>${leque(540, 2010, 980, 180, 360, 36, cor.linha, { op: 0.16, w: 1.1, arcos: [0.3, 0.5, 0.7, 0.86] })}
    <path d="${filetes}" fill="none" stroke="${cor.linha}" stroke-width="1.3" opacity="0.32"/>
    <rect width="1080" height="1920" fill="url(#${v})"/>${grao(cor.grao, 0.07)}`;
}

// Troca de cena: o fundo déco sobe como uma porta de elevador art déco (com o friso brilhando na borda)
export function varre(T, at, cor) {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  if (y >= 1920) return "";
  const h = halo(6);
  return `<g transform="translate(0 ${f1(y)})">${fundo(cor)}</g>${h.def}
    <rect x="0" y="${f1(y - 3)}" width="1080" height="6" fill="${cor.neon}" filter="url(#${h.id})"/><rect x="0" y="${f1(y - 1)}" width="1080" height="2" fill="${cor.nucleo}"/>`;
}

// faixa de título do topo das cenas: "rótulo" pequeno em Inter entre dois losangos déco
export function rotulo(y, t, cor) {
  const w = largura(t, 30, "xb", 8) / 2 + 40;
  const losango = (x) => `<path d="M${x},${y - 20} l9,9 l-9,9 l-9,-9 Z" fill="${cor.ouro}"/>`;
  return `${txt(540, y, t, 30, cor.ouro, { fonte: "xb", ls: 8 })}${losango(540 - w)}${losango(540 + w)}
    <path d="M${f1(540 - w - 20)},${y - 11} H${f1(540 - w - 170)} M${f1(540 + w + 20)},${y - 11} H${f1(540 + w + 170)}" stroke="${cor.ouro}" stroke-width="1.4" opacity="0.8"/>`;
}
