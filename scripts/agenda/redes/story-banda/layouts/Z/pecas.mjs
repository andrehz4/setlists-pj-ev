// Layout Z (homenagem ao clima do álbum de 2024: pintura com luz em longa exposição, sem a capa nem a composição
// dela): peças comuns. Fundo preto com poeira iluminada, trilhas de luz (halo largo + halo fino + núcleo nítido),
// cabeça da lanterna com faíscas, texto nítido com brilho só em volta e escrita revelada pela lanterna.
import { p, enter } from "../../tempo.mjs";
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";
import { largura, cabe } from "./medida.mjs";

export { esc, largura, cabe };
export const F = { anton: F_ANTON, marker: "'Permanent Marker','Inter ExtraBold',sans-serif", inter: "'Inter',system-ui,sans-serif",
  interB: "'Inter Bold','Inter',system-ui,sans-serif", interXB: F_INTER_XB };
const PESO = { anton: 400, marker: 400, inter: 400, interB: 700, interXB: 800 };
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
export const op3 = (v) => Math.max(0, Math.min(1, v)).toFixed(3);
// mistura com branco (núcleo da luz é quase branco)
export const claro = (hex, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + 255 * t).toString(16).padStart(2, "0")).join("");

// Texto nítido. fonte: chave de F.
export const txt = (x, y, t, f, fill, { fonte = "anton", anchor = "middle", ls = 0, op = 1, extra = "" } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F[fonte]}" font-weight="${PESO[fonte]}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op3(op)}" ${extra}>${esc(t)}</text>`;

// Filtros de brilho (ids fixos, um conjunto por quadro). Região = tela inteira, pra linha reta não perder o halo.
export const DEFS = `<defs><filter id="zbL" filterUnits="userSpaceOnUse" x="-60" y="-60" width="1200" height="2040"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="zbF" filterUnits="userSpaceOnUse" x="-60" y="-60" width="1200" height="2040"><feGaussianBlur stdDeviation="4.5"/></filter></defs>`;

// Camada de luz: { largo, fino, nitido } -> halos borrados embaixo, traço/texto nítido por cima
export const novaCamada = () => ({ largo: "", fino: "", nitido: "" });
export const pinta = (c) => `<g filter="url(#zbL)">${c.largo}</g><g filter="url(#zbF)">${c.fino}</g>${c.nitido}`;

// Trilha: polilinha densa com comprimento acumulado; em(k) devolve o ponto na fração k do caminho
export function trilha(pts) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc.at(-1) || 1, d = "M" + pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join("L");
  const em = (k) => { const alvo = Math.max(0, Math.min(1, k)) * L; let i = acc.findIndex((a) => a >= alvo); if (i <= 0) return pts[Math.max(0, i)];
    const u = (alvo - acc[i - 1]) / (acc[i] - acc[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; };
  return { d, em, L, pts, fracao: (i) => acc[i] / L };
}

// Traço de luz revelado até k (pathLength), com halo largo e fino na cor e núcleo quase branco
export function luz(c, tr, cor, k = 1, { w = 1, op = 1, cabeca = true, semente = 1 } = {}) {
  if (k <= 0) return;
  const dash = `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - Math.min(1, k)).toFixed(4)}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  c.largo += `<path d="${tr.d}" stroke="${cor}" stroke-width="${f1(18 * w)}" opacity="${op3(0.5 * op)}" ${dash}/>`;
  c.fino += `<path d="${tr.d}" stroke="${cor}" stroke-width="${f1(6.5 * w)}" opacity="${op3(0.95 * op)}" ${dash}/>`;
  c.nitido += `<path d="${tr.d}" stroke="${claro(cor, 0.75)}" stroke-width="${f1(2.2 * w)}" opacity="${op3(op)}" ${dash}/>`;
  if (cabeca && k < 1) c.nitido += lanterna(...tr.em(k), cor, semente);
}

// Cabeça da lanterna: clarão em degradê, estrela fina de 4 pontas e faíscas que ficam pra trás
export function lanterna(x, y, cor, semente = 1, s = 1) {
  const g = novoId("zg"), faiscas = Array.from({ length: 7 }, (_, i) => {
    const a = rnd(semente * 31 + i) * 6.283, r = (14 + rnd(semente * 17 + i) * 40) * s;
    return `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(0.8 + rnd(i + semente) * 1.6)}" fill="${claro(cor, 0.6)}" opacity="${op3(0.4 + rnd(i * 3 + semente) * 0.5)}"/>`;
  }).join("");
  return `<radialGradient id="${g}"><stop offset="0" stop-color="#fff"/><stop offset="0.18" stop-color="${claro(cor, 0.5)}" stop-opacity="0.9"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></radialGradient>
    <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(54 * s)}" fill="url(#${g})"/>
    <path d="M${f1(x - 46 * s)},${f1(y)} H${f1(x + 46 * s)} M${f1(x)},${f1(y - 46 * s)} V${f1(y + 46 * s)}" stroke="#fff" stroke-width="1.2" opacity="0.7"/>${faiscas}`;
}

// Texto nítido com brilho em volta (o halo é uma cópia engrossada e borrada; a letra fica limpa)
export function brilhante(c, x, y, t, f, fill, halo, o = {}) {
  const ext = (o.extra || "");
  c.largo += txt(x, y, t, f, halo, { ...o, op: 0.55 * (o.op ?? 1), extra: `stroke="${halo}" stroke-width="${f1(f * 0.06)}" ${ext}` });
  c.fino += txt(x, y, t, f, halo, { ...o, op: 0.5 * (o.op ?? 1), extra: ext });
  c.nitido += txt(x, y, t, f, fill, o);
}

// Escrita de luz: a lanterna corre da esquerda pra direita e o texto aparece atrás dela (recorte que avança).
export function escreve(c, T, at, dur, x, y, t, f, fill, halo, o = {}) {
  const k = p(T, at, dur, (u) => u), w = largura(t, f, o.fonte || "anton", o.ls || 0);
  if (k <= 0) return;
  const x0 = (o.anchor || "middle") === "middle" ? x - w / 2 : x, cl = novoId("zc"), xr = x0 - 20 + (w + 40) * k;
  c.nitido += `<clipPath id="${cl}"><rect x="${f1(x0 - 40)}" y="${f1(y - f * 1.3)}" width="${f1(xr - x0 + 40)}" height="${f1(f * 1.8)}"/></clipPath>`;
  brilhante(c, x, y, t, f, fill, halo, { ...o, extra: `clip-path="url(#${cl})"` });
  if (k < 1) c.nitido += lanterna(xr, y - f * 0.36 + f * 0.3 * Math.sin(k * w / 16), halo, Math.floor(k * 40), 0.8);
}

// Fundo: preto com vinheta, poeira iluminada que deriva devagar e alguns bokeh desfocados (degradê, sem filtro)
const POEIRA = Array.from({ length: 110 }, (_, i) => [rnd(i + 1) * 1080, rnd(i + 401) * 1920, 0.5 + rnd(i + 801) ** 3 * 2.4, rnd(i + 1201)]);
const BOKEH = Array.from({ length: 9 }, (_, i) => [rnd(i + 51) * 1080, rnd(i + 91) * 1920, 26 + rnd(i + 131) * 60, i % 4]);
export function fundo(T, cor) {
  const v = novoId("zv"), b = novoId("zk");
  const poeira = POEIRA.map(([x, y, r, s]) => { const yy = (y - T * (8 + 14 * s) + 1920) % 1920, xx = x + Math.sin(T * 0.7 + s * 9) * 10;
    return `<circle cx="${f1(xx)}" cy="${f1(yy)}" r="${f1(r)}" fill="${s > 0.7 ? cor.luzes[1] : "#fff"}" opacity="${op3(0.12 + 0.45 * s * (0.6 + 0.4 * Math.sin(T * 3 + s * 20)))}"/>`; }).join("");
  const bokeh = BOKEH.map(([x, y, r, i]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#${b}${i})" opacity="0.32"/>`).join("");
  const gr = cor.luzes.map((l, i) => `<radialGradient id="${b}${i}"><stop offset="0" stop-color="${l}" stop-opacity="0.35"/><stop offset="0.7" stop-color="${l}" stop-opacity="0.12"/><stop offset="1" stop-color="${l}" stop-opacity="0"/></radialGradient>`).join("");
  return `<radialGradient id="${v}" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="${cor.bg2}"/><stop offset="1" stop-color="${cor.bg}"/></radialGradient>${gr}
    <rect width="1080" height="1920" fill="url(#${v})"/>${bokeh}${poeira}`;
}

// Troca de cena: um feixe horizontal desce e deixa o preto atrás dele
export function feixe(T, at, cor, dur = 0.45) {
  const k = p(T, at, dur, enter);
  if (k <= 0) return "";
  const y = k * 2000 - 40, g = novoId("zf");
  return `<rect width="1080" height="${f1(Math.max(0, y))}" fill="${cor.bg}"/>${k < 1 ? `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.luzes[0]}" stop-opacity="0"/><stop offset="0.5" stop-color="${claro(cor.luzes[0], 0.7)}"/><stop offset="1" stop-color="${cor.luzes[0]}" stop-opacity="0"/></linearGradient>
    <rect y="${f1(y - 60)}" width="1080" height="120" fill="url(#${g})"/><rect y="${f1(y - 1.5)}" width="1080" height="3" fill="#fff"/>` : ""}`;
}
