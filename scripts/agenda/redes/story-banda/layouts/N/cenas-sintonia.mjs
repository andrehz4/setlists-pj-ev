// Layout N, cenas 1 (rádio sintoniza sobre o clipe, 0 a 3) e 2 (logo no alto-falante, 3 a 5.5).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { gabinete, placa, visor, dial, vu, botao, grade, noAr, sintoniza, label, luz, procura, freqDe, fmt, cabe, largAnton,
  esc, F_ANTON, F_INTER, F_INTER_XB } from "./pecas.mjs";

const SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataRadio = (dia) => `${SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8)}/${dia.slice(5, 7)}`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const fq = freqDe(story.banda), linhas = linhasDoNome(story.banda, 12);
  const f = Math.min(150, ...linhas.map((l) => 820 / largAnton(l, 1)));
  const hVisor = 70 + linhas.length * f * 1.02 + 90, alto = 40 + 74 + 30 + hVisor + 30 + 150 + 40 + 120 + 40;
  const k = p(T, 0.1, 0.5, pop), y0 = lerp(1920, 960 - alto / 2, k);
  let s = placa(40, y0, 1000, alto, cor) + noAr(T, 90, y0 + 40, 1.25, cor);
  const fAgora = procura(T, 88, fq, 0.25, 1.0);
  s += visor(560, y0 + 34, 430, 86, cor) + luz(`<text x="970" y="${y0 + 104}" text-anchor="end" font-family="${F_ANTON}" font-size="72" fill="${cor.luz}">FM ${fmt(fAgora)}</text>`);
  const yv = y0 + 144;
  s += visor(80, yv, 920, hVisor, cor);
  const nome = linhas.map((l, i) => `<text x="540" y="${(yv + 40 + (i + 1) * f * 0.98).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f.toFixed(1)}" fill="${cor.luz}">${esc(sintoniza(T, l, 0.7 + i * 0.12, 0.5))}</text>`).join("");
  const N = story.shows.length, data = `${dataRadio(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`;
  s += luz(nome) + label(data, 540, yv + hVisor - 36, cor, { f: 40, anc: "middle", fill: cor.luz, op: p(T, 1.4, 0.3, enter) });
  const yd = yv + hVisor + 30;
  s += dial(T, { x: 80, y: yd, w: 920, h: 150, freq: fAgora, cor });
  const yb = yd + 150 + 40 + 60;
  s += botao(200, yb, 56, (fAgora - 88) * 14, cor) + label("SINTONIA", 290, yb + 10, cor, { f: 26 }) +
    botao(880, yb, 56, 120 + 30 * Math.sin(T * 2), cor) + label("VOLUME", 790, yb + 10, cor, { f: 26, anc: "end" });
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.4 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + s + `<rect x="0" y="${lerp(1920, 0, p(T, 2.5, 0.45, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const k = p(T, 3.05, 0.5, pop), sc = Math.max(0.001, k);
  const pulso = 1 + 0.015 * Math.sin(T * 30) * p(T, 3.5, 0.2, enter);
  const miolo = logoUri
    ? `<clipPath id="nlg"><circle cx="540" cy="760" r="290"/></clipPath><image href="${logoUri}" x="250" y="470" width="580" height="580" clip-path="url(#nlg)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="540" cy="760" r="290" fill="${cor.acento}"/><text x="540" y="810" text-anchor="middle" font-family="${F_ANTON}" font-size="160" fill="${cor.painel}">${esc(story.banda.split(/\s+/).map((x) => x[0]).join("").slice(0, 3).toUpperCase())}</text>`;
  const alto = `<g transform="translate(540 760) scale(${(sc * pulso).toFixed(4)}) translate(-540 -760)">${grade(540, 760, 400, cor)}
    <circle cx="540" cy="760" r="306" fill="${cor.visor}"/>${miolo}<circle cx="540" cy="760" r="296" fill="none" stroke="${cor.luz}" stroke-width="6" opacity="0.7"/></g>`;
  const op = p(T, 3.4, 0.3, enter), op2 = p(T, 3.6, 0.3, enter), op3 = p(T, 3.8, 0.3, enter);
  const conta = story.conta || story.banda, so = !story.desde && !story.cidadeBase, fc = cabe(conta, 800, so ? 96 : 72);
  let txt = `<text x="120" y="${so ? 1395 : 1310}" font-family="${F_INTER_XB}" font-weight="800" font-size="${fc.toFixed(1)}" fill="${cor.luz}" opacity="${op.toFixed(3)}">${esc(conta)}</text>`;
  if (story.desde) txt += `<text x="120" y="1380" font-family="${F_INTER}" font-size="44" fill="${cor.luz}" opacity="${(op2 * 0.85).toFixed(3)}">no ar desde ${esc(story.desde)}</text>`;
  if (story.cidadeBase) { const t = `base: ${story.cidadeBase}`;
    txt += `<text x="120" y="${story.desde ? 1440 : 1380}" font-family="${F_INTER}" font-size="${cabe(t, 800, 44).toFixed(1)}" fill="${cor.luz}" opacity="${(op3 * 0.85).toFixed(3)}">${esc(t)}</text>`; }
  return gabinete(cor) + label("ESTAÇÃO DE HOJE", 540, 300, cor, { f: 34, anc: "middle", fill: cor.rotulo }) + alto +
    placa(60, 1200, 960, 520, cor) + visor(90, 1230, 900, 260, cor) + luz(txt) +
    vu(T, { cx: 260, cy: 1650, r: 78, cor, semente: 1, rotulo: "L" }) + vu(T, { cx: 540, cy: 1650, r: 78, cor, semente: 4, rotulo: "R" }) +
    botao(830, 1605, 60, 40 + (T - 3) * 90, cor);
}
