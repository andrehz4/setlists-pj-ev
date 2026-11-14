// Layout E ("Bilhete"): peças comuns. Fontes, curvas, texto que surge (fade com espaçamento fechando), rótulo em
// caixa alta, ornamento de losango, moldura dupla dourada, rosa dos ventos, medidas reais e a data por extenso.
import { esc, F_PLAYFAIR } from "../../pecas.mjs";
import { F_INTER_SB } from "../../../../../publish/fontconfig-boot.mjs";
import { clamp, lerp } from "../../tempo.mjs";
import { largura, cabe } from "../comum/medida.mjs";

export { esc, largura, cabe, lerp };
export const out = (x) => 1 - Math.pow(1 - x, 4);
export const io = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
export const back = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const pr = (T, t0, d, e) => e(clamp((T - t0) / d));
export const f1 = (v) => (Math.round(v * 10) / 10).toString();

// família, peso e arquivo .ttf (pra medir) de cada fonte do desenho
export const FONTE = {
  is: { fam: "'Instrument Serif',Georgia,serif", peso: 400, it: true, ttf: "InstrumentSerif-Italic.ttf" },
  pf5: { fam: "'Playfair Display Medium','Playfair Display',Georgia,serif", peso: 500, it: true,
    ttf: "PlayfairDisplay-MediumItalic.ttf" },
  pf7: { fam: "'Playfair Display',Georgia,serif", peso: 700, it: true, ttf: "PlayfairDisplay-BoldItalic.ttf" },
  pf9: { fam: F_PLAYFAIR, peso: 900, it: true, ttf: "PlayfairDisplay-BlackItalic.ttf" },
  in: { fam: F_INTER_SB, peso: 600, it: false, ttf: "Inter-SemiBold.ttf" },
};
export const mede = (t, f, fonte = "is", ls = 0) => largura(t, f, FONTE[fonte].ttf, ls);
export const caber = (t, w, max, fonte = "is", ls = 0) => cabe(t, w, max, FONTE[fonte].ttf, ls);

// texto parado
export function txt(x, y, t, f, fill, { fonte = "is", anchor = "middle", ls = 0, op = 1 } = {}) {
  const F = FONTE[fonte];
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F.fam}" font-weight="${F.peso}"` +
    `${F.it ? ' font-style="italic"' : ""} font-size="${f1(f)}" letter-spacing="${f1(ls)}" fill="${fill}"` +
    `${op < 1 ? ` opacity="${op.toFixed(3)}"` : ""}>${esc(t)}</text>`;
}

// Fade: opacidade p, sobe 26 px e o espaçamento fecha de ls0 (em) até ls (em)
export function fade(x, y, t, f, fill, p, { fonte = "is", anchor = "middle", ls0 = 0.12, ls = 0, sobe = 26 } = {}) {
  if (p <= 0 || !t) return "";
  return txt(x, y + sobe * (1 - p), t, f, fill, { fonte, anchor, ls: f * (lerp(ls0, 0, p) + ls), op: Math.min(1, p) });
}
// Rótulo: Inter 600 caixa alta, espaçamento 0.30em (+0.20em na entrada), sem subida
export const rotulo = (x, y, t, p, fill, f = 28) => fade(x, y, t, f, fill, p, { fonte: "in", ls: 0.3, ls0: 0.2, sobe: 0 });

// Ornamento: losango r 9 no centro + dois filetes de 2 px crescendo pra fora até w/2 - 22
export function orn(cx, y, w, p, cor) {
  if (p <= 0) return "";
  const L = (w / 2 - 22) * p, r = 9 * p;
  return `<rect x="${f1(cx - 22 - L)}" y="${y - 1}" width="${f1(L)}" height="2" fill="${cor}"/>` +
    `<rect x="${cx + 22}" y="${y - 1}" width="${f1(L)}" height="2" fill="${cor}"/>` +
    `<path d="M${cx} ${f1(y - r)}L${f1(cx + r)} ${y}L${cx} ${f1(y + r)}L${f1(cx - r)} ${y}Z" fill="${cor}"/>`;
}

// Moldura dupla (inset 40 com 2 px e inset 52 com 1 px a 70%), desenhada por traço
export function moldura(p, cor) {
  if (p <= 0) return "";
  const r = (i, sw, op) => {
    const w = 1080 - 2 * i, h = 1920 - 2 * i, P = 2 * (w + h);
    const traco = p < 1 ? ` stroke-dasharray="${P}" stroke-dashoffset="${f1(P * (1 - p))}"` : "";
    return `<rect x="${i}" y="${i}" width="${w}" height="${h}" fill="none" stroke="${cor}" stroke-width="${sw}"
      stroke-opacity="${op}"${traco}/>`;
  };
  return r(40, 2, 1) + r(52, 1, 0.7);
}

// Rosa dos ventos de 8 pontas (16 vértices): R nas cardeais, 0.55R nas colaterais, 0.22R nos vales
export function estrela(R) {
  const q = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 - Math.PI / 2, r = k % 4 === 0 ? R : k % 2 === 0 ? R * 0.55 : R * 0.22;
    q.push(`${f1(r * Math.cos(a))} ${f1(r * Math.sin(a))}`);
  }
  return `M${q.join("L")}Z`;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
  "novembro", "dezembro"];
// "2026-11-14" -> { dia: "sábado", d: 14, mes: "novembro" }
export function dataDe(dia) {
  const dt = new Date(`${dia}T12:00:00Z`);
  return { dia: DIAS[dt.getUTCDay()], d: dt.getUTCDate(), mes: MESES[dt.getUTCMonth()] };
}
// "20:00" -> "20h", "17:30" -> "17h30"
export const fmtHora = (h) => (h ? String(h).replace(/^(\d{1,2})[:h]?(\d{2})?.*$/,
  (_, a, b) => `${+a}h${b && b !== "00" ? b : ""}`) : "");
export const ROMANO = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// Quebra por palavras no maior corpo (fmax..fmin, passo 2) em que até maxL linhas cabem em maxW
export function quebra(t, maxW, maxL, fmax, fmin, fonte = "is") {
  const pal = String(t).split(/\s+/).filter(Boolean);
  for (let F = fmax; F >= fmin; F -= 2) {
    const ls = [];
    for (const w of pal) {
      const k = ls.length ? `${ls.at(-1)} ${w}` : w;
      if (ls.length && mede(k, F, fonte) <= maxW) ls[ls.length - 1] = k; else ls.push(w);
    }
    if (ls.length <= maxL && ls.every((l) => mede(l, F, fonte) <= maxW)) return { F, linhas: ls };
  }
  const linhas = pal.length <= maxL ? pal : [...pal.slice(0, maxL - 1), pal.slice(maxL - 1).join(" ")];
  return { F: Math.min(fmin, ...linhas.map((l) => caber(l, maxW, fmin, fonte))), linhas };
}
