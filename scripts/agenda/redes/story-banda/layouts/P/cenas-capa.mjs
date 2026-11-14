// Layout P, cenas 1 (ovelha sobe e empurra o alambrado, placa "HOJE TEM" presa no arame, por cima do clipe, 0 a 3) e
// 2 (logo em foto P&B presa na cerca, ovelha espiando do canto, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { cerca, etiqueta, fundo, varre, anton, inter, cabeAnton, cabeInter, novoId } from "./pecas.mjs";
import { ovelha, focinhoEm } from "./ovelha.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataPlaca = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

// força do empurrão: bate forte (pop) e relaxa um pouco, como quem encosta e fica
export const empurrao = (T, at) => p(T, at, 0.35, pop) * (1 - 0.35 * p(T, at + 0.5, 0.6, enter));

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 12), f = Math.min(...linhas.map((l) => cabeAnton(l, 800, 190)));
  const N = story.shows.length, h = 200 + linhas.length * f * 1.02 + 110;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.4 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  const u = 520, x = 540, y = lerp(2500, 1420, p(T, 0.15, 0.55, enter)), b = empurrao(T, 0.75);
  const foc = focinhoEm(x, y, u);
  const placa = etiqueta(T, { x: 90, y: 300, w: 900, h, rot: -1.5, at: 0.35, cor, seed: 3, miolo: (px, py, w) =>
    `<rect x="${px}" y="${py + 40}" width="${w}" height="130" fill="${cor.tinta}"/>` + anton(px + w / 2, py + 145, "HOJE TEM", 110, cor.papel, "middle", 8) +
    linhas.map((l, i) => anton(px + w / 2, py + 180 + (i + 1) * f * 1.0, l, f, cor.tinta)).join("") +
    `<rect x="${px + w / 2 - 310}" y="${(py + h - 96).toFixed(1)}" width="620" height="72" fill="${cor.acento}" stroke="${cor.contorno}" stroke-width="3"/>` +
    inter(px + w / 2, py + h - 46, `${dataPlaca(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`, cabeInter(`${dataPlaca(story.dia)} · 3 SHOWS`, 580, 44), cor.sobreAcento) });
  return veu + ovelha(T, { x, y, u, cor, empurra: b }) + cerca(cor, { bojo: { x: foc.x, y: foc.y, r: 420, b } }) + placa + varre(T, 2.5, cor);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const linha2 = story.desde ? `NA ESTRADA DESDE ${story.desde}` : story.cidadeBase ? `BASE: ${story.cidadeBase.toUpperCase()}` : "TOCA HOJE";
  const lado = 660, conta = story.conta || story.banda;
  // ovelha espia do canto de baixo, sobe devagar e encosta
  const u = 330, x = 850, y = lerp(2200, 1700, p(T, 3.4, 0.6, enter)), b = empurrao(T, 4.2), foc = focinhoEm(x, y, u);
  const card = etiqueta(T, { x: 150, y: 300, w: 780, h: 1020, rot: 1.8, at: 3.05, cor, seed: 7, miolo: (px, py, w) => {
    const ix = px + (w - lado) / 2, iy = py + 60, cl = novoId("pc"), pb = novoId("pb");
    const img = logoUri
      ? `<filter id="${pb}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.35" intercept="-0.15"/><feFuncG type="linear" slope="1.35" intercept="-0.15"/><feFuncB type="linear" slope="1.35" intercept="-0.15"/></feComponentTransfer></filter>
        <clipPath id="${cl}"><rect x="${ix}" y="${iy}" width="${lado}" height="${lado}"/></clipPath><image href="${logoUri}" x="${ix}" y="${iy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice" filter="url(#${pb})"/>`
      : `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" fill="${cor.tinta}"/>${anton(px + w / 2, iy + lado / 2 + 50, story.banda.toUpperCase(), cabeAnton(story.banda, lado - 80, 160), cor.papel)}`;
    const yt = iy + lado;
    return img + `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" fill="none" stroke="${cor.tinta}" stroke-width="6"/>` +
      anton(px + w / 2, yt + 125, conta, cabeAnton(conta, w - 90, 92), cor.tinta, "middle", 1) +
      inter(px + w / 2, yt + 205, linha2, cabeInter(linha2, w - 100, 42), cor.tinta, "middle", 0.8);
  } });
  return fundo(cor) + ovelha(T, { x, y, u, cor, empurra: b, rot: -14 }) + cerca(cor, { bojo: { x: foc.x, y: foc.y, r: 260, b: b * 0.8 } }) + card;
}
