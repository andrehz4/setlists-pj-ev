// Layout F, peças base: pastilha split-flap (embaralha e para letra por letra), texto digitado com cursor, rótulo e
// separador pontilhado. Tudo em JetBrains Mono 800 e função pura de T (MOTION-SPEC-banda-F, "Pastilha").
import { esc } from "../../pecas.mjs";
import { largura } from "../comum/medida.mjs";
import { p } from "../../tempo.mjs";

// curvas do spec F: out = easeOutQuart, io = easeInOutQuart, lin = linear; pr(T, t0, d, curva) = progresso 0..1
export const out = (x) => 1 - Math.pow(1 - x, 4);
export const io = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
export const lin = (x) => x;
export const pr = p;

export const MONO = "'JetBrains Mono',monospace";
const ARQ = "JetBrainsMono-ExtraBold.ttf";
const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const FLIPS = 15; // trocas de caractere por segundo durante o embaralhamento
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// largura real do texto na fonte do layout (monoespaçada: 0.6 do corpo por caractere)
export const larg = (t, f) => largura(t, f, ARQ);
// corpo que faz o texto caber em w, sem passar de max
export const caber = (t, w, max) => Math.min(max, w / Math.max(0.01, larg(t, 1)));

// tamanho de pastilha pra n caracteres em L px (spec: tileFit)
export const tileFit = (n, L, max, gapK = 0.08) => {
  const tw = Math.min(max, Math.floor(L / (Math.max(1, n) * (1 + gapK))));
  return { tw, gap: Math.max(3, Math.round(tw * gapK)) };
};
// largura ocupada por uma fileira de n pastilhas
export const larguraFileira = (n, tw, gap) => n * tw + Math.max(0, n - 1) * gap;

// Fileira de pastilhas. settle(c) = instante em que a pastilha c para no caractere final; antes, desde start, embaralha.
export function pastilhas(T, { id, txt, cols, x, y, tw, gap, start, settle, cor, letra }) {
  const ch = [...txt], n = cols ?? ch.length, h = Math.round(tw * 1.4), fs = tw * 1.22, rx = f1(tw * 0.08);
  let out = "";
  for (let c = 0; c < n; c++) {
    const final = ch[c] || " ", X = x + c * (tw + gap);
    let s = " ", sq = 1;
    if (final !== " " && T >= start) {
      if (T < settle(c)) {
        const k = (T - start) * FLIPS;
        s = ALPH[(Math.floor(k) + c * 7 + id.length * 3) % ALPH.length];
        sq = 0.45 + 0.55 * Math.abs(Math.cos((k % 1) * Math.PI));
      } else s = final;
    }
    out += `<rect x="${f1(X)}" y="${f1(y)}" width="${f1(tw)}" height="${h}" rx="${rx}" fill="${cor.tile}"/>`;
    if (s !== " ") {
      out += `<text x="0" y="${f1(fs * 0.36)}" transform="translate(${f1(X + tw / 2)} ${f1(y + h / 2)}) ` +
        `scale(1 ${sq.toFixed(3)})" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="${f1(fs)}" ` +
        `fill="${letra || cor.ch}">${esc(s)}</text>`;
    }
    out += `<rect x="${f1(X)}" y="${f1(y + h / 2 - 1.5)}" width="${f1(tw)}" height="3" fill="${cor.bg}"/>`;
  }
  return out;
}

// texto digitado: n = floor((T - t0) * cps) caracteres visíveis
export function digitado(T, t0, txt, cps) {
  const t = [...txt], n = Math.max(0, Math.min(t.length, Math.floor((T - t0) * cps)));
  return { s: t.slice(0, n).join(""), n, pronto: n >= t.length };
}

// cursor em bloco 4 px depois do texto, aceso quando floor(3T) é par
export const cursor = (T, x, y, F, cor, liga = true) => liga && Math.floor(T * 3) % 2 === 0
  ? `<rect x="${f1(x + 4)}" y="${f1(y - F * 0.78)}" width="${f1(F * 0.55)}" height="${f1(F * 0.92)}" fill="${cor.ch}"/>` : "";

// texto solto na fonte do layout
export const texto = (t, x, y, F, fill, { op = 1, ancora = "start" } = {}) => !t || op <= 0 ? "" :
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${ancora}" font-family="${MONO}" font-weight="800" ` +
  `font-size="${f1(F)}" fill="${fill}"` +
  `${op < 1 ? ` opacity="${op.toFixed(3)}"` : ""}>${esc(t)}</text>`;

// texto digitado + cursor que segue o último caractere
export function linhaDigitada(T, { t0, txt, cps, x, y, F, cor, cursorLigado }) {
  const d = digitado(T, t0, txt, cps);
  return texto(d.s, x, y, F, cor.ch) + cursor(T, x + larg(d.s, F), y, F, cor, cursorLigado(d));
}

// separador pontilhado (traço 4 px, pontos a cada 14 px) que cresce da esquerda; k = progresso 0..1
export const separador = (y, k, cor, x = 60, w = 960, passo = 14) => k <= 0 ? "" :
  `<line x1="${x}" y1="${y}" x2="${f1(x + w * k)}" y2="${y}" stroke="${cor.dim}" stroke-width="4" stroke-linecap="round" ` +
  `stroke-dasharray="0 ${passo}"/>`;
