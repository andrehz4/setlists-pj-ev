// Layout M, cenas 3 (cartaz do mapa do estado, 5.5 a 9), 4 (tiras com os shows de hoje coladas por cima, 9 a 12.5)
// e 5 (cartaz de compartilhar, 12.5 a 15).
import { p, pop } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { muro, cartazLogo } from "./cenas-capa.mjs";
import { cartaz, faixa, cabeAnton, cabeInter, esc, F_ANTON, F_INTER_XB } from "./pecas.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}H${b && b !== "00" ? b : ""}`) : "HOJE");

export function cartazMapa(T, story, cor, at = 5.6) {
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase();
  const cidades = [...new Set(story.shows.map((s) => s.cidade))].join(", ");
  return cartaz(T, { x: 70, y: 330, w: 940, h: 1230, rot: -1, at, cor, papel: cor.papel, seed: 13, miolo: (x, y, w) => {
    const R = { x: x + 50, y: y + 390, w: w - 100, h: 620 };
    const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
    const cam = enquadra(caixaDe(pts), R, 2, 40), id = "mmp";
    const est = Object.entries(ufs()).map(([uf, polys]) => {
      const meu = ufsShow.includes(uf);
      return `<path d="${caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))))}" fill="${cor.tinta}" fill-opacity="${meu ? 1 : 0.14}" stroke="${cor.papel}" stroke-width="4"/>`;
    }).join("");
    const pinos = story.shows.map((s, i) => {
      const [a, b] = tela(cam, mundo(s.lonlat)), k = p(T, at + 0.9 + i * 0.3, 0.35, pop);
      return k > 0 ? `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${(26 * k).toFixed(1)}" fill="${cor.tinta2}" stroke="${cor.papel}" stroke-width="7"/>` : "";
    }).join("");
    return faixa(x + 40, y + 50, w - 80, 120, cor.tinta, cor.papel, "O SHOW É EM", 100) +
      `<text x="${x + w / 2}" y="${y + 340}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton(estado, w - 100, 140).toFixed(1)}" fill="${cor.tinta}">${esc(estado)}</text>
      <clipPath id="${id}"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}"/></clipPath><g clip-path="url(#${id})">${est}${pinos}</g>
      <text x="${x + w / 2}" y="${y + 1110}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(cidades, w - 100, 56).toFixed(1)}" fill="${cor.tinta2}">${esc(cidades)}</text>`;
  } });
}

export function cenaMapa(T, story, cor, logoUri) {
  if (T < 5.5 || T >= 9) return "";
  return muro(cor) + `<g transform="translate(-40 30) rotate(-4 540 900)">${cartazLogo(99, story, cor, logoUri)}</g>` + cartazMapa(T, story, cor);
}

// tiras: cabeçalho "SHOWS DE HOJE" e uma tira por show, coladas em sequência a partir de `at`
export function tiras(T, story, cor, at = 9.05) {
  const N = story.shows.length, alto = Math.min(270, 1000 / N), y0 = 560;
  let s = cartaz(T, { x: 60, y: 380, w: 960, h: 150, rot: -2, at, cor, papel: cor.tinta, seed: 41, escorre: 2,
    miolo: (x, y, w, h) => `<text x="${x + w / 2}" y="${y + h / 2 + 36}" text-anchor="middle" font-family="${F_ANTON}" font-size="100" fill="${cor.papel}">SHOWS DE HOJE</text>` });
  story.shows.forEach((sh, i) => {
    const y = y0 + i * (alto + 24), h = alto, e = h / 270, casa = sh.casa || "horário no perfil da banda";
    s += cartaz(T, { x: 70, y, w: 940, h, rot: i % 2 ? 1.5 : -1, at: at + 0.35 + i * 0.3, cor, papel: i % 2 ? cor.papel2 : cor.papel, seed: 50 + i, escorre: 2,
      miolo: (x, yy, w) => `<rect x="${x + 24}" y="${yy + 24}" width="${300 * e}" height="${h - 48}" fill="${cor.tinta}"/>
        <text x="${x + 24 + 150 * e}" y="${(yy + h / 2 + 50 * e).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton(hora(sh.hora), 260 * e, 140 * e).toFixed(1)}" fill="${cor.papel}">${esc(hora(sh.hora))}</text>
        <text x="${x + 60 + 300 * e}" y="${(yy + h * 0.52).toFixed(1)}" font-family="${F_ANTON}" font-size="${cabeAnton(sh.cidade.toUpperCase(), w - 110 - 300 * e, 120 * e).toFixed(1)}" fill="${cor.tinta}">${esc(sh.cidade.toUpperCase())}</text>
        <text x="${x + 60 + 300 * e}" y="${(yy + h * 0.52 + 70 * e).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(casa, w - 110 - 300 * e, 46 * e).toFixed(1)}" fill="${cor.tinta2}">${esc(casa)}</text>` });
  });
  return s;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  // cartaz liso colado por cima do mapa: a lista nao disputa espaco com o texto da cena anterior
  const N = story.shows.length, hLiso = 260 + N * (Math.min(270, 1000 / N) + 24);
  const liso = cartaz(T, { x: 50, y: 340, w: 980, h: hLiso, rot: 0.8, at: 9.0, cor, papel: cor.papel2, seed: 33, escorre: 2, miolo: () => "" });
  return muro(cor) + cartazMapa(99, story, cor) + liso + tiras(T, story, cor);
}

export function cenaFinal(T, story, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda";
  return muro(cor) + `<g opacity="0.95">${tiras(99, story, cor)}</g>` +
    cartaz(T, { x: 60, y: 330, w: 960, h: 1090, rot: 1.5, at: 12.55, cor, papel: cor.papel, seed: 71, miolo: (x, y, w) => {
      const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];
      const f = Math.min(...l.map((t) => cabeAnton(t, w - 100, 230)));
      const k = p(T, 13.3, 0.35, pop), cy = y + 830;
      return l.map((t, i) => `<text x="${x + w / 2}" y="${(y + 60 + (i + 1) * f * 1.02).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f.toFixed(1)}" fill="${i === 0 ? cor.tinta : cor.tinta2}">${t}</text>`).join("") +
        (k > 0 ? `<g transform="translate(${x + w / 2} ${cy}) rotate(-4) scale(${k.toFixed(3)}) translate(${-(x + w / 2)} ${-cy})">${faixa(x + 60, cy - 80, w - 120, 160, cor.tinta, cor.papel, "SIGA @SMUFDPJ", 120)}</g>` : "") +
        `<rect x="${x + 50}" y="${y + 950}" width="${w - 100}" height="6" fill="${cor.tinta}"/>
        <text x="${x + w / 2}" y="${y + 1030}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(site, w - 100, 50).toFixed(1)}" fill="${cor.tinta}">${esc(site)}</text>`;
    } });
}
