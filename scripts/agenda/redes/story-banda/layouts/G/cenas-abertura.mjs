// Layout G, cenas 1 (abertura sobre o clipe, 0 a 3) e 2 (logo, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { esc, F_INTER_XB } from "../../pecas.mjs";
import { fileira, larguraPlaca, linhasDoNome, persiana, rotulo } from "./placas.mjs";

const SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const dataCurta = (dia) => `${SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8)}/${dia.slice(5, 7)}`;
export const fundo = (cor) => `<rect width="1080" height="1920" fill="${cor.bg}"/>`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda);
  const max = Math.max(...linhas.map((l) => l.length));
  const w = larguraPlaca(max, 960, 150), h = w * 1.32, gap = 14;
  const alto = 96 + 40 + linhas.length * (h + gap) + 30 + 70;
  let y = 960 - alto / 2;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.38 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  let s = fileira(T, "HOJE TEM", { x: 540, y, w: 70, h: 96, t0: 0.15, cor, corLetra: cor.acento, alinhar: "centro", semente: 1 });
  y += 96 + 40;
  linhas.forEach((l, i) => {
    s += fileira(T, l, { x: 540, y, w, h, t0: 0.45 + i * 0.15, giro: 0.4, cor, alinhar: "centro", semente: 10 + i });
    y += h + gap;
  });
  y += 30;
  const N = story.shows.length, data = `${dataCurta(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`;
  const op = p(T, 1.3, 0.3, enter);
  s += `<g opacity="${op.toFixed(3)}"><rect x="60" y="${y}" width="960" height="70" rx="8" fill="${cor.placa}"/>
    ${rotulo(data, 540, y + 47, cor.letra, { f: 34, ancora: "middle" })}</g>`;
  return veu + s + persiana(T, 2.55, 0.3, cor.bg);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const k = p(T, 3.05, 0.45, pop), sy = Math.max(0.001, k);
  const quadro = `<g transform="translate(540 630) scale(1 ${sy.toFixed(4)}) translate(-540 -630)">
    <rect x="270" y="360" width="540" height="540" rx="24" fill="${cor.placa}"/>
    ${logoUri ? `<clipPath id="gl"><rect x="300" y="390" width="480" height="480" rx="14"/></clipPath>
    <image href="${logoUri}" x="300" y="390" width="480" height="480" clip-path="url(#gl)" preserveAspectRatio="xMidYMid slice"/>`
    : fileira(T, story.banda.split(/\s+/).map((x) => x[0]).join("").slice(0, 3), { x: 540, y: 560, w: 120, h: 160, t0: 3.1, cor, alinhar: "centro", semente: 30 })}
    <rect x="270" y="628" width="540" height="4" fill="${cor.bg}" opacity="0.5"/></g>`;
  const opConta = p(T, 3.4, 0.35, enter);
  const base = (story.cidadeBase || "").toUpperCase();
  const wb = larguraPlaca(Math.max(base.length, 1), 960, 64);
  return fundo(cor) + rotulo("PRÓXIMA ATRAÇÃO", 540, 300, cor.acento, { f: 30, ancora: "middle" }) + quadro +
    rotulo("BANDA", 60, 990, cor.apoio, { f: 26, op: opConta }) +
    `<text x="60" y="${lerp(1070, 1050, opConta).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="56" fill="${cor.letra}" opacity="${opConta.toFixed(3)}">${esc(story.conta)}</text>` +
    (story.desde ? rotulo("DESDE", 60, 1140, cor.apoio, { f: 26, op: p(T, 3.55, 0.2, enter) }) +
      fileira(T, String(story.desde), { x: 60, y: 1160, w: 92, h: 124, t0: 3.6, cor, corLetra: cor.acento, semente: 40 }) : "") +
    (base ? rotulo("SAINDO DE", 60, 1345, cor.apoio, { f: 26, op: p(T, 3.8, 0.2, enter) }) +
      fileira(T, base, { x: 60, y: 1365, w: wb, h: wb * 1.3, t0: 3.85, passo: 0.025, cor, semente: 50 }) : "");
}
