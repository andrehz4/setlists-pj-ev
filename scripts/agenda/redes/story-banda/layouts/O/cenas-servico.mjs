// Layout O, cenas 3 (estado recortado em compensado, 5.5 a 9), 4 (uma placa de madeira por show, levantada pela
// multidão, 9 a 12.5) e 5 (mãos erguidas e o pedido de compartilhar, 12.5 a 15).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { placa, fundo, multidao, pintado, cabeMarker, cabeAnton, cabeInter, esc, F_ANTON, F_INTER_XB } from "./pecas.mjs";
import { bonecos } from "./bonecos.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}H${b && b !== "00" ? b : ""}`) : "HOJE");
const titulo = (y, t, cor) => `<text x="540" y="${y}" text-anchor="middle" font-family="${F_ANTON}" font-size="96" letter-spacing="4" fill="${cor.sobreBg}">${esc(t)}</text>`;

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase();
  const cidades = [...new Set(story.shows.map((s) => s.cidade))].join(", ");
  const R = { x: 90, y: 620, w: 900, h: 760 };
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 40);
  const k = p(T, 5.6, 0.5, enter), dy = lerp(500, 0, k);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="${cor.sobreBg}" fill-opacity="0.1" stroke="${cor.sobreBg}" stroke-opacity="0.25" stroke-width="3"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" transform="translate(14 20)" fill="#000" opacity="0.25"/><path d="${forma(uf)}" transform="translate(8 11)" fill="${cor.borda}"/><path d="${forma(uf)}" fill="${cor.placa}"/>`).join("");
  const pinos = story.shows.map((s, i) => {
    const [a, b] = tela(cam, mundo(s.lonlat)), kp = p(T, 6.5 + i * 0.3, 0.35, pop);
    return kp > 0 ? `<g transform="translate(${a.toFixed(1)} ${b.toFixed(1)}) scale(${kp.toFixed(3)})"><circle r="30" cx="5" cy="7" fill="${cor.borda}"/><circle r="30" fill="${cor.tinta2}"/><circle r="10" fill="${cor.placa}"/></g>` : "";
  }).join("");
  // máscara com bordas em degradê: os estados vizinhos somem suaves em cima e embaixo, sem linha de corte
  const clip = `<linearGradient id="omg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.12" stop-color="#fff"/><stop offset="0.88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="omp" maskUnits="userSpaceOnUse" x="0" y="${R.y - 60}" width="1080" height="${R.h + 120}"><rect x="0" y="${R.y - 60}" width="1080" height="${R.h + 120}" fill="url(#omg)"/></mask>`;
  return fundo(cor) + titulo(400, "O SHOW É EM", cor) +
    pintado(540, 550, estado, cabeMarker(estado, 900, 140), cor.sobreBg, -1.5) +
    `${clip}<g mask="url(#omp)"><g opacity="${Math.min(1, k * 2).toFixed(3)}" transform="translate(0 ${dy.toFixed(1)})">${vizinhos}${meus}${pinos}</g></g>` +
    `<text x="540" y="1480" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(cidades, 900, 52).toFixed(1)}" fill="${cor.sobreBg}" opacity="${p(T, 6.2, 0.3).toFixed(3)}">${esc(cidades)}</text>` +
    multidao(T, { at: 6.0, cor, n: 7, s: 0.8, yBase: 2060 });
}

// cidade pintada: nome longo quebra em 2 linhas (acima da linha de base `y`) pra não ficar miúdo
function nomeCidade(cidade, cx, y, larg, e, cor) {
  const t = cidade.toUpperCase(), f1 = cabeMarker(t, larg, 90 * e), pal = t.split(" ");
  if (f1 >= 62 * e || pal.length < 2) return pintado(cx, y, t, f1, cor.tinta);
  const meio = Math.ceil(pal.length / 2), l = [pal.slice(0, meio).join(" "), pal.slice(meio).join(" ")];
  const f = Math.min(64 * e, ...l.map((x) => cabeMarker(x, larg, 90 * e)));
  return pintado(cx, y - f * 0.95, l[0], f, cor.tinta) + pintado(cx, y, l[1], f, cor.tinta);
}

// placas dos shows: cabeçalho e uma placa por show, que sobem em sequência a partir de `at`
export function placasShows(T, story, cor, at = 9.05) {
  const N = story.shows.length, alto = Math.min(280, 880 / N), y0 = 520;
  let s = placa(T, { x: 110, y: 330, w: 860, h: 150, rot: -1, at, cor, face: cor.tinta2, seed: 41, miolo: (x, y, w, h) =>
    `<text x="${x + w / 2}" y="${y + h / 2 + 34}" text-anchor="middle" font-family="${F_ANTON}" font-size="96" letter-spacing="4" fill="${cor.placa}">SHOWS DE HOJE</text>` });
  story.shows.forEach((sh, i) => {
    const y = y0 + i * (alto + 24), e = alto / 250, casa = sh.casa || "horário no perfil da banda", hh = hora(sh.hora);
    s += placa(T, { x: 70, y, w: 940, h: alto, rot: i % 2 ? 1.2 : -1.2, at: at + 0.3 + i * 0.3, cor, seed: 50 + i, miolo: (x, yy, w, h) =>
      `<text x="${x + 40 + 140 * e}" y="${(yy + h / 2 + 46 * e).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton(hh, 250 * e, 130 * e).toFixed(1)}" fill="${cor.tinta2}">${esc(hh)}</text>
      <rect x="${x + 60 + 280 * e}" y="${yy + 30 * e}" width="5" height="${h - 60 * e}" fill="${cor.borda}" opacity="0.7"/>
      ${nomeCidade(sh.cidade, x + 90 + 280 * e + (w - 130 - 280 * e) / 2, yy + h * 0.5, w - 140 - 280 * e, e, cor)}
      <text x="${x + 90 + 280 * e + (w - 130 - 280 * e) / 2}" y="${(yy + h * 0.5 + 66 * e).toFixed(1)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(casa, w - 140 - 280 * e, 42 * e).toFixed(1)}" fill="${cor.tinta}" opacity="0.8">${esc(casa)}</text>` });
  });
  return s;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  return fundo(cor) + multidao(T, { at: 9.0, cor, n: 8, s: 0.85, yBase: 2080 }) + placasShows(T, story, cor);
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda";
  const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], f = Math.min(...l.map((t) => cabeMarker(t, 920, 150)));
  const linhas = l.map((t, i) => {
    const k = p(T, 12.55 + i * 0.12, 0.4, pop);
    return k > 0 ? `<g opacity="${Math.min(1, k * 2).toFixed(3)}" transform="translate(0 ${((1 - k) * 60).toFixed(1)})">${pintado(540, 470 + i * f * 1.15, t, f, cor.sobreBg, i % 2 ? 1.5 : -1.5)}</g>` : "";
  }).join("");
  const siga = placa(T, { x: 130, y: 900, w: 820, h: 170, rot: -2, at: 13.2, cor, seed: 71, miolo: (x, y, w, h) =>
    `<text x="${x + w / 2}" y="${y + h / 2 + 36}" text-anchor="middle" font-family="${F_ANTON}" font-size="${cabeAnton("SIGA @SMUFDPJ", w - 80, 104).toFixed(1)}" fill="${cor.tinta}">SIGA @SMUFDPJ</text>` });
  return fundo(cor) + linhas + siga +
    `<text x="540" y="1200" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeInter(site, 880, 46).toFixed(1)}" fill="${cor.sobreBg}" opacity="${p(T, 13.5, 0.3).toFixed(3)}">${esc(site)}</text>` +
    bonecos(T, { cx: 540, chao: 1940, H: 470, at: 12.7, cor });
}
