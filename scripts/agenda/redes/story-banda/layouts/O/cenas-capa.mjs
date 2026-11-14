// Layout O, cenas 1 (placa "HOJE TEM" subindo por cima do clipe, 0 a 3) e 2 (logo numa placa de madeira com mãos
// erguidas ao redor, 3 a 5.5).
import { p, enter } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { placa, fundo, multidao, pintado, varre, cabeMarker, cabeInter, esc, F_ANTON, F_INTER_XB } from "./pecas.mjs";
import { bonecos } from "./bonecos.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataPlaca = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 11), f = Math.min(...linhas.map((l) => cabeMarker(l, 800, 170)));
  const N = story.shows.length, h = 230 + linhas.length * f * 1.1 + 150;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.35 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  const card = placa(T, { x: 70, y: 380, w: 940, h, rot: -2, at: 0.2, cor, seed: 3, miolo: (x, y, w) =>
    `<text x="${x + w / 2}" y="${y + 150}" text-anchor="middle" font-family="${F_ANTON}" font-size="120" fill="${cor.tinta2}" letter-spacing="6">HOJE TEM</text>` +
    linhas.map((l, i) => pintado(x + w / 2, y + 200 + (i + 1) * f * 1.05, l, f, cor.tinta, i % 2 ? 1.5 : -1.5)).join("") +
    `<text x="${x + w / 2}" y="${(y + h - 60).toFixed(1)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="54" fill="${cor.tinta2}">${esc(dataPlaca(story.dia))}${N > 1 ? ` · ${N} SHOWS` : ""}</text>` });
  return veu + bonecos(T, { cx: 540, chao: 1900, H: 440, at: 0.6, cor }) + card + varre(T, 2.5, cor);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const linha2 = story.desde ? `NA ESTRADA DESDE ${story.desde}` : story.cidadeBase ? `BASE: ${story.cidadeBase.toUpperCase()}` : "TOCA HOJE";
  const lado = 640;
  const card = placa(T, { x: 150, y: 330, w: 780, h: 1000, rot: 1.5, at: 3.05, cor, face: cor.placa2, seed: 7, miolo: (x, y, w) => {
    const ix = x + (w - lado) / 2, iy = y + 60;
    const img = logoUri
      ? `<clipPath id="olg"><rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10"/></clipPath><image href="${logoUri}" x="${ix}" y="${iy}" width="${lado}" height="${lado}" clip-path="url(#olg)" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10" fill="${cor.tinta2}"/>${pintado(x + w / 2, iy + lado / 2 + 50, story.banda.toUpperCase(), cabeMarker(story.banda, lado - 80, 150), cor.placa2)}`;
    const yt = iy + lado;
    return img + `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10" fill="none" stroke="${cor.borda}" stroke-width="8"/>` +
      pintado(x + w / 2, yt + 125, story.conta, cabeMarker(story.conta, w - 100, 80), cor.tinta3, -1) +
      `<text x="${x + w / 2}" y="${yt + 210}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(linha2, w - 100, 44).toFixed(1)}" fill="${cor.tinta2}">${esc(linha2)}</text>`;
  } });
  return fundo(cor) + multidao(T, { at: 3.3, cor, n: 7, s: 1.05 }) + card;
}
