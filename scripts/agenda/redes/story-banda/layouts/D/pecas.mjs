// Layout D ("Grade", cartaz tipográfico do Claude Design): peças comuns. Texto que sobe por máscara, filete de 3 px,
// fontes (Archivo Black e Inter 600/800), larguras reais medidas no .ttf e a data do dia. Sem rotação, sem overshoot.
import { esc } from "../../pecas.mjs";
import { clamp } from "../../tempo.mjs";
import { largura, cabe as cabeTtf } from "../comum/medida.mjs";

export { esc, clamp };
export const F_AB = "'Archivo Black','Inter ExtraBold',sans-serif";
export const F_XB = "'Inter ExtraBold','Inter',sans-serif";
export const F_SB = "'Inter SemiBold','Inter',sans-serif";
const ARQ = { ab: "ArchivoBlack-Regular.ttf", xb: "Inter-ExtraBold.ttf", sb: "Inter-SemiBold.ttf" };
const FAM = { ab: `font-family="${F_AB}"`, xb: `font-family="${F_XB}" font-weight="800"`,
  sb: `font-family="${F_SB}" font-weight="600"` };

// largura real e corpo que cabe (fonte: "ab", "xb" ou "sb")
export const larg = (t, f, fonte = "ab") => largura(t, f, ARQ[fonte]);
export const cabe = (t, w, max, fonte = "ab") => cabeTtf(t, w, max, ARQ[fonte]);

// easings do spec D: out = easeOutQuart, io = easeInOutQuart, lin = linear
export const out = (x) => 1 - Math.pow(1 - x, 4);
export const io = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
export const lin = (x) => x;
export const pr = (T, t0, d, e = out) => e(clamp((T - t0) / d));
export const f1 = (v) => Number(v).toFixed(1);

let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;

// texto simples (sem máscara)
export const texto = (x, y, t, f, fill, fonte = "ab", anchor = "start") =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" ${FAM[fonte]} font-size="${f1(f)}" fill="${fill}">${esc(t)}</text>`;

// Máscara: baseline y, corpo F, recorte [y - F, y + 0.25F]. p 0..1 entra de baixo (+1.3F), q 0..1 sai por cima.
export function mask(t, { x = 60, y, F, fill, p, q = 0, fonte = "ab", anchor = "start" }) {
  if (p <= 0 || q >= 1 || !t) return "";
  const id = novoId("dm"), dy = F * 1.3 * (1 - p) - F * 1.3 * q;
  return `<clipPath id="${id}"><rect x="0" y="${f1(y - F)}" width="1080" height="${f1(F * 1.25)}"/></clipPath>` +
    `<g clip-path="url(#${id})">${texto(x, y + dy, t, F, fill, fonte, anchor)}</g>`;
}

// Filete: 3 px de altura, largura 960·p, cresce da esquerda
export const filete = (y, p, fill, x = 60, w = 960) =>
  (p > 0 ? `<rect x="${x}" y="${f1(y)}" width="${f1(w * Math.min(1, p))}" height="3" fill="${fill}"/>` : "");

// "SÁBADO 14/11" a partir de AAAA-MM-DD
const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataCurta = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

// "17:30" -> "17H30", "20:00" -> "20H"
export const horaD = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/,
  (_, a, b) => `${Number(a)}H${b && b !== "00" ? b : ""}`) : "");

// Quebra por palavras no maior F (max..min, passo 2) em que até maxL linhas cabem em maxW (Archivo Black real).
// Nome comprido demais pra min: segue descendo até 40 antes de desistir.
export function quebra(txt, maxW, maxL, max, min) {
  const pal = String(txt).split(/\s+/).filter(Boolean);
  for (let F = max; F >= Math.min(min, 40); F -= 2) {
    const l = [];
    for (const w of pal) {
      const t = l.length ? `${l.at(-1)} ${w}` : w;
      if (l.length && larg(t, F) <= maxW) l[l.length - 1] = t; else l.push(w);
    }
    if (l.length <= maxL && l.every((x) => larg(x, F) <= maxW)) return { F, linhas: l };
  }
  // palavra longa demais: junta o excedente na última linha e reduz até caber
  const l = pal.length > maxL ? [...pal.slice(0, maxL - 1), pal.slice(maxL - 1).join(" ")] : pal;
  return { F: Math.min(min, ...l.map((x) => cabe(x, maxW, min))), linhas: l };
}
