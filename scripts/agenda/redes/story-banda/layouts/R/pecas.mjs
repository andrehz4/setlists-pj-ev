// Layout R (mural de fotos instantâneas, homenagem ao clima do álbum de 1996, sem a capa, sem foto real e sem o
// arranjo dela): peças comuns. Fundo do mural por tema (parede lisa, cortiça, noite, gelo) com granulação, textos à
// mão (Permanent Marker) e de apoio (Inter Bold) com largura MEDIDA, fita crepe, tachinha e rótulo de fita escrito.
import { p, enter, lerp } from "../../tempo.mjs";
import { esc } from "../../pecas.mjs";
import { largura, cabe } from "./medida.mjs";

export { esc, largura, cabe };
export const F_MAO = "'Permanent Marker',cursive";
export const F_SANS = "'Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);

// Letra à mão (caneta marcadora). rot gira em volta do ponto de ancoragem.
export const mao = (x, y, t, f, fill, { anchor = "middle", rot = 0, op = 1 } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_MAO}" font-size="${f1(f)}" fill="${fill}" opacity="${op}"${rot ? ` transform="rotate(${rot} ${f1(x)} ${f1(y)})"` : ""}>${esc(t)}</text>`;
export const sans = (x, y, t, f, fill, { anchor = "middle", ls = 0, op = 1 } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_SANS}" font-weight="700" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;

// granulação: ladrilho de 160 px com pontinhos fixos (calculado uma vez)
const pontos = (n, sd, t) => Array.from({ length: n }, (_, i) => `<circle cx="${f1(rnd(i + sd) * t)}" cy="${f1(rnd(i + sd + 400) * t)}" r="${f1(0.5 + rnd(i + sd + 800) * 1.1)}"/>`).join("");
const PONTOS = pontos(240, 0, 160), CLAROS = pontos(120, 1500, 160);
export function grao(corGrao, op, area = [0, 0, 1080, 1920], claro = false) {
  const id = novoId("rg");
  return `<pattern id="${id}" width="160" height="160" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${claro ? CLAROS : PONTOS}</g></pattern>
    <rect x="${area[0]}" y="${area[1]}" width="${area[2]}" height="${area[3]}" fill="url(#${id})" opacity="${op}"/>`;
}

// cortiça: grânulos de 2 tons (mais escuros e mais claros) em ladrilho de 120 px
const GRANULOS = Array.from({ length: 170 }, (_, i) => [rnd(i + 31) * 120, rnd(i + 77) * 120, 1 + rnd(i + 99) * 2.6, i % 3]);
const cortica = (cor) => { const id = novoId("rc");
  const g = GRANULOS.map(([x, y, r, k]) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.7)}" fill="${k ? cor.granulo : cor.granulo2}" transform="rotate(${Math.round(x * 3)} ${f1(x)} ${f1(y)})"/>`).join("");
  return `<pattern id="${id}" width="120" height="120" patternUnits="userSpaceOnUse">${g}</pattern><rect width="1080" height="1920" fill="url(#${id})" opacity="0.55"/>`; };

// Fundo do mural: cor com vinheta, textura do tema e granulação
export function fundo(cor) {
  const v = novoId("rv");
  return `<radialGradient id="${v}" cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stop-color="${cor.bg}"/><stop offset="1" stop-color="${cor.bg2}"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${v})"/>${cor.textura === "cortica" ? cortica(cor) : grao(cor.grao, cor.graoOp)}`;
}

// Troca de cena da abertura: o mural sobe e cobre o clipe
export const varre = (T, at, cor) => {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  return y < 1920 ? `<g transform="translate(0 ${f1(y)})">${fundo(cor)}</g>` : "";
};

// sombra suave (desfoque gaussiano). d = desvio do desfoque
export const sombra = (d) => { const id = novoId("rs");
  return { id, def: `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${d}"/></filter>` }; };

// borda rasgada da fita: zigue-zague fino nas pontas (x0 e x1), altura h, a partir de y0
const rasgo = (x, y0, h, lado, sd) => Array.from({ length: 7 }, (_, i) => `${f1(x + lado * (i % 2 ? 3 + 3 * rnd(sd + i) : 0))},${f1(y0 + (h * i) / 6)}`);

// Fita crepe semitransparente centrada em (cx, cy), largura w, altura h, girada rot
export function fita(cx, cy, w, h, rot, cor, sd = 1) {
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, s = sombra(2.5);
  const contorno = [...rasgo(x0, y0, h, 1, sd), ...rasgo(x1, y0, h, -1, sd + 9).reverse()].join(" ");
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot})">${s.def}
    <polygon points="${contorno}" fill="#000" opacity="0.18" transform="translate(2 3)" filter="url(#${s.id})"/>
    <polygon points="${contorno}" fill="${cor.fita}" opacity="0.86"/>
    <path d="M${f1(x0 + 6)},${f1(y0 + h * 0.3)} H${f1(x1 - 6)} M${f1(x0 + 6)},${f1(y0 + h * 0.72)} H${f1(x1 - 6)}" stroke="#fff" stroke-width="1" opacity="0.18"/></g>`;
}

// Tachinha vista de cima: sombra caída pra baixo e à direita, cabeça com degradê e brilho
export function tachinha(cx, cy, r, cor) {
  const g = novoId("rt"), s = sombra(r * 0.28);
  return `${s.def}<radialGradient id="${g}" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="0.25" stop-color="${cor.tacha}"/><stop offset="1" stop-color="${cor.tacha2}"/></radialGradient>
    <ellipse cx="${f1(cx + r * 0.55)}" cy="${f1(cy + r * 0.8)}" rx="${f1(r * 0.95)}" ry="${f1(r * 0.8)}" fill="#000" opacity="0.35" filter="url(#${s.id})"/>
    <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="url(#${g})"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.62)}" fill="none" stroke="${cor.tacha2}" stroke-width="${f1(r * 0.08)}" opacity="0.5"/>
    <ellipse cx="${f1(cx - r * 0.32)}" cy="${f1(cy - r * 0.36)}" rx="${f1(r * 0.22)}" ry="${f1(r * 0.13)}" fill="#fff" opacity="0.7" transform="rotate(-35 ${f1(cx - r * 0.32)} ${f1(cy - r * 0.36)})"/>`;
}

// Rótulo: tira de fita crepe com texto à mão (ou Inter, fonte = "sans"), largura medida pelo texto. (cx, cy) = centro. Devolve { svg, w, h }.
export function rotulo(cx, cy, t, f, cor, { rot = 0, sd = 1, op = 1, tinta = cor.tinta, fonte = "mao" } = {}) {
  const w = largura(t, f, fonte) + f * 0.9, h = f * 1.42, txt = fonte === "mao" ? mao(cx, cy + f * 0.36, t, f, tinta) : sans(cx, cy + f * 0.36, t, f, tinta);
  const svg = `<g opacity="${op.toFixed(3)}">${fita(cx, cy, w, h, rot, { fita: cor.rotulo }, sd)}
    <g transform="rotate(${rot} ${f1(cx)} ${f1(cy)})">${txt}</g></g>`;
  return { svg, w, h };
}

// dia curto escrito à mão: "sáb 14/11"
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const diaCurto = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8)}/${dia.slice(5, 7)}`;
export const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
