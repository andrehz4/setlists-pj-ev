// Layout M, cenas 1 (cartaz "HOJE TEM" colado por cima do clipe, 0 a 3) e 2 (cartaz do logo na parede, 3 a 5.5).
// Cada cartaz exporta a versão "já colada" pra ficar por baixo do cartaz da cena seguinte.
import { linhasDoNome } from "../G/placas.mjs";
import { cartaz, parede, resto, faixa, desce, cabeAnton, cabeInter, esc, F_ANTON, F_INTER_XB } from "./pecas.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataCartaz = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

// fundo de parede com restos de cartaz velho (sempre os mesmos)
export const muro = (cor) => parede(cor) + resto(cor, -60, 220, 420, 520, -6, 11) + resto(cor, 700, 1380, 460, 400, 5, 23) + resto(cor, 640, 160, 380, 300, 3, 31);

export function cartazHoje(T, story, cor, at = 0.2) {
  const linhas = linhasDoNome(story.banda, 11), f = Math.min(...linhas.map((l) => cabeAnton(l, 820, 230)));
  const N = story.shows.length, h = 300 + linhas.length * f * 1.02 + 190;
  return cartaz(T, { x: 70, y: 330, w: 940, h, rot: -1.5, at, cor, papel: cor.papel, seed: 3, miolo: (x, y, w) =>
    faixa(x + 40, y + 50, w - 80, 210, cor.tinta, cor.papel, "HOJE TEM", 190) +
    linhas.map((l, i) => `<text x="${x + w / 2}" y="${(y + 290 + (i + 1) * f * 1.0).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f.toFixed(1)}" fill="${cor.tinta}">${esc(l)}</text>`).join("") +
    `<rect x="${x + 40}" y="${(y + h - 160).toFixed(1)}" width="${w - 80}" height="6" fill="${cor.tinta2}"/>
    <text x="${x + w / 2}" y="${(y + h - 70).toFixed(1)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="62" fill="${cor.tinta2}">${esc(dataCartaz(story.dia))}${N > 1 ? ` · ${N} SHOWS` : ""}</text>` });
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const y = desce(T, 2.55, 0.45);
  const muroDesce = y > -1920 ? `<g transform="translate(0 ${y.toFixed(1)})">${muro(cor)}</g>` : "";
  return cartazHoje(T, story, cor) + muroDesce;
}

export function cartazLogo(T, story, cor, logoUri, at = 3.05) {
  const linha2 = story.desde ? `NA ESTRADA DESDE ${story.desde}` : story.cidadeBase ? `BASE: ${story.cidadeBase.toUpperCase()}` : "TOCA HOJE";
  return cartaz(T, { x: 110, y: 360, w: 860, h: 1160, rot: 2, at, cor, papel: cor.papel2, seed: 7, miolo: (x, y, w) => {
    const img = logoUri
      ? `<clipPath id="mlg"><rect x="${x + 50}" y="${y + 50}" width="${w - 100}" height="${w - 100}"/></clipPath><image href="${logoUri}" x="${x + 50}" y="${y + 50}" width="${w - 100}" height="${w - 100}" clip-path="url(#mlg)" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${x + 50}" y="${y + 50}" width="${w - 100}" height="${w - 100}" fill="${cor.tinta}"/><text x="${x + w / 2}" y="${y + w / 2 + 60}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton(story.banda, w - 160, 200).toFixed(1)}" fill="${cor.papel2}">${esc(story.banda.toUpperCase())}</text>`;
    const yt = y + w + 10;
    return img + `<text x="${x + w / 2}" y="${yt + 110}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton(story.conta, w - 100, 120).toFixed(1)}" fill="${cor.tinta}">${esc(story.conta)}</text>
      <text x="${x + w / 2}" y="${yt + 190}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(linha2, w - 100, 48).toFixed(1)}" fill="${cor.tinta2}">${esc(linha2)}</text>`;
  } });
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  return muro(cor) + `<g transform="rotate(-3 540 900) translate(-30 -20)">${cartazHoje(99, story, cor)}</g>` + cartazLogo(T, story, cor, logoUri);
}
