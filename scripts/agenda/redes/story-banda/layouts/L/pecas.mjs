// Layout L ("Fita cassete"): peças comuns. Fita desenhada num quadro local de 1000x630 (escala por transform), com
// etiqueta escrita à mão, carretéis girando e a fita passando de um lado pro outro; botões de tape deck e contador.
// Tudo função pura de T.
import { p, enter } from "../../tempo.mjs";
import { esc, F_INTER_XB } from "../../pecas.mjs";
import { F_INTER } from "../../../../../publish/fontconfig-boot.mjs";

export { esc, F_INTER_XB, F_INTER };
export const F_MARKER = "'Permanent Marker','Inter ExtraBold',sans-serif";
export const largM = (t, f) => String(t).length * 0.62 * f;
export const largI = (t, f) => String(t).length * 0.56 * f;
export const cabeI = (t, largura, max) => Math.min(max, largura / (String(t).length * 0.56));
export const fundo = (cor) => `<rect width="1080" height="1920" fill="${cor.bg}"/>`;
export const entra = (T, t) => p(T, t, 0.3, enter);

let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const dataCurta = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;
export const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}:${b || "00"}`) : null);

// quebra por palavra em linhas de até `largura` px (estimativa do marcador)
export function quebra(texto, f, largura) {
  const linhas = [];
  for (const w of String(texto).split(/\s+/)) {
    const ult = linhas.at(-1);
    if (ult && largM(`${ult} ${w}`, f) <= largura) linhas[linhas.length - 1] = `${ult} ${w}`;
    else linhas.push(w);
  }
  return linhas;
}

// maior corpo que faz o texto caber na caixa (largura x altura), quebrando por palavra
export function escreve(texto, largura, altura, fMax, fMin = 28) {
  for (let f = fMax; f >= fMin; f -= 2) {
    const linhas = quebra(texto, f, largura);
    if (linhas.length * f * 1.12 <= altura && linhas.every((l) => largM(l, f) <= largura)) return { linhas, f };
  }
  return { linhas: quebra(texto, fMin, largura), f: fMin };
}

// Texto de caneta: cada linha aparece da esquerda pra direita (máscara que cresce), uma depois da outra.
export function escrito(T, t0, porLinha, linhas, { x, y, f, fill, ancora = "middle", passo = 1.12 }) {
  return linhas.map((l, i) => {
    const k = p(T, t0 + i * porLinha, porLinha, (v) => v);
    if (k <= 0) return "";
    const yy = y + i * f * passo, w = largM(l, f), x0 = ancora === "middle" ? x - w / 2 : ancora === "end" ? x - w : x;
    const txt = `<text x="${x}" y="${yy.toFixed(1)}" text-anchor="${ancora}" font-family="${F_MARKER}" font-size="${f.toFixed(1)}" fill="${fill}">${esc(l)}</text>`;
    if (k >= 1) return txt;
    const id = novoId("le");
    return `<clipPath id="${id}"><rect x="${(x0 - 30).toFixed(1)}" y="${(yy - f * 1.2).toFixed(1)}" width="${((w + 60) * k).toFixed(1)}" height="${(f * 1.6).toFixed(1)}"/></clipPath><g clip-path="url(#${id})">${txt}</g>`;
  }).join("");
}

// Carretel: miolo branco com 6 dentes girando (ang em graus).
function carretel(cx, cy, ang, cor) {
  const dentes = [0, 60, 120, 180, 240, 300].map((a) => `<rect x="${cx - 6}" y="${cy - 40}" width="12" height="18" rx="3" fill="${cor.borda}" transform="rotate(${(a + ang).toFixed(2)} ${cx} ${cy})"/>`).join("");
  return `<circle cx="${cx}" cy="${cy}" r="46" fill="#f4f1ea"/><circle cx="${cx}" cy="${cy}" r="24" fill="${cor.borda}"/>${dentes}`;
}

// Fita cassete. (x, y) canto de cima, w largura em px (altura = 0.63 w). fluxo 0..1 = quanto já passou pro carretel da
// direita. topo(area) e base(area) escrevem na etiqueta, em coordenadas locais (1000x630).
export function fita({ x, y, w, cor, ang = 0, fluxo = 0, topo, base, op = 1 }) {
  const s = w / 1000, id = novoId("lj");
  const rE = 150 - 88 * fluxo, rD = 62 + 88 * fluxo;
  const parafusos = [[36, 36], [964, 36], [36, 594], [964, 594]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="12" fill="${cor.borda}"/>`).join("");
  return `<g opacity="${op.toFixed(3)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})">
    <rect x="0" y="0" width="1000" height="630" rx="40" fill="${cor.corpo}" stroke="${cor.borda}" stroke-width="8"/>${parafusos}
    <rect x="60" y="40" width="880" height="400" rx="20" fill="${cor.etiqueta}"/>
    <rect x="60" y="238" width="880" height="150" fill="${cor.faixa}"/>
    <clipPath id="${id}"><rect x="230" y="255" width="540" height="116" rx="58"/></clipPath>
    <rect x="230" y="255" width="540" height="116" rx="58" fill="${cor.janela}"/>
    <g clip-path="url(#${id})"><circle cx="330" cy="313" r="${rE.toFixed(1)}" fill="${cor.fita}"/><circle cx="670" cy="313" r="${rD.toFixed(1)}" fill="${cor.fita}"/>
      <rect x="230" y="255" width="540" height="40" fill="#ffffff" opacity="0.08"/></g>
    ${carretel(330, 313, ang, cor)}${carretel(670, 313, ang, cor)}
    <path d="M200,630 L250,482 L750,482 L800,630 Z" fill="${cor.borda}" opacity="0.8"/>
    <circle cx="330" cy="560" r="18" fill="${cor.corpo}"/><circle cx="670" cy="560" r="18" fill="${cor.corpo}"/>
    <rect x="440" y="545" width="26" height="26" fill="${cor.corpo}"/><rect x="534" y="545" width="26" height="26" fill="${cor.corpo}"/>
    ${topo ? topo({ x: 100, y: 58, w: 800, h: 172 }) : ""}${base ? base({ x: 100, y: 392, w: 800, h: 46 }) : ""}</g>`;
}

// Botões do tape deck (REW, PLAY, FF, STOP). apertado = o que está pra baixo, com a cor de acento.
export function botoes({ cx, y, w, cor, apertado }) {
  const bw = (w - 60) / 4, h = 120, x0 = cx - w / 2;
  const icones = {
    rew: (a, b) => `M${a - 4},${b - 22} L${a - 40},${b} L${a - 4},${b + 22}Z M${a + 36},${b - 22} L${a},${b} L${a + 36},${b + 22}Z`,
    play: (a, b) => `M${a - 18},${b - 26} L${a + 26},${b} L${a - 18},${b + 26}Z`,
    ff: (a, b) => `M${a + 4},${b - 22} L${a + 40},${b} L${a + 4},${b + 22}Z M${a - 36},${b - 22} L${a},${b} L${a - 36},${b + 22}Z`,
    stop: (a, b) => `M${a - 20},${b - 20} h40 v40 h-40 Z`,
  };
  return `<rect x="${x0 - 20}" y="${y - 20}" width="${w + 40}" height="${h + 50}" rx="26" fill="${cor.borda}"/>` +
    Object.entries(icones).map(([nome, ic], i) => {
      const baixo = nome === apertado, bx = x0 + i * (bw + 20), dy = baixo ? 12 : 0;
      return `<rect x="${bx}" y="${y + 18}" width="${bw}" height="${h - 8}" rx="14" fill="#000" opacity="0.35"/>
        <rect x="${bx}" y="${y + dy}" width="${bw}" height="${h - 8}" rx="14" fill="${baixo ? cor.acento : cor.corpo}"/>
        <path d="${ic(bx + bw / 2, y + dy + (h - 8) / 2)}" fill="${baixo ? cor.sobreAcento : cor.etiqueta}"/>`;
    }).join("");
}

// Contador de fita de 3 dígitos
export function contador(cx, y, n, cor) {
  const dig = String(Math.max(0, Math.floor(n)) % 1000).padStart(3, "0");
  return `<rect x="${cx - 150}" y="${y}" width="300" height="96" rx="14" fill="#111111" stroke="${cor.borda}" stroke-width="4"/>` +
    [...dig].map((d, i) => `<rect x="${cx - 132 + i * 92}" y="${y + 12}" width="80" height="72" rx="6" fill="#262626"/>
      <text x="${cx - 92 + i * 92}" y="${y + 70}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="58" fill="#f2f2f2">${d}</text>`).join("");
}
