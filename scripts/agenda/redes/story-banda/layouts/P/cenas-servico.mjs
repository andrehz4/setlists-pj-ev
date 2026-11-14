// Layout P, cenas 3 (estado recortado em papel xerox atrás da malha, 5.5 a 9), 4 (uma etiqueta por show presa no
// arame, 9 a 12.5) e 5 (pedido de compartilhar e a ovelha amassando a cara na cerca de novo, 12.5 a 15).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { cerca, etiqueta, fundo, anton, inter, cabeAnton, cabeInter } from "./pecas.mjs";
import { ovelha, focinhoEm } from "./ovelha.mjs";
import { empurrao } from "./cenas-capa.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}H${b && b !== "00" ? b : ""}`) : "HOJE");

// faixa escura de título presa no arame (Anton claro sobre tinta)
const faixa = (T, { y, t, at, cor, rot = -1.2, seed = 21, f = 96 }) => etiqueta(T, { x: 90, y, w: 900, h: 150, rot, at, cor, face: cor.tinta, seed,
  miolo: (x, yy, w, h) => anton(x + w / 2, yy + h / 2 + f * 0.36, t, cabeAnton(t, w - 120, f), cor.papel, "middle", 5) });

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase();
  const cidades = [...new Set(story.shows.map((s) => s.cidade))].join(", ");
  const R = { x: 100, y: 640, w: 880, h: 760 };
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 40);
  const k = p(T, 5.6, 0.5, enter), esc = lerp(0.85, 1, k);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.sobreBg}" stroke-opacity="0.22" stroke-width="3" stroke-dasharray="10 8"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" transform="translate(12 18)" fill="#000" opacity="0.35"/><path d="${forma(uf)}" fill="${cor.papel}" stroke="${cor.contorno}" stroke-width="5"/>`).join("");
  const pinos = story.shows.map((s, i) => {
    const [a, b] = tela(cam, mundo(s.lonlat)), kp = p(T, 6.5 + i * 0.3, 0.35, pop);
    return kp > 0 ? `<g transform="translate(${a.toFixed(1)} ${b.toFixed(1)}) scale(${kp.toFixed(3)})"><path d="M-34,-34 L34,34 M34,-34 L-34,34" stroke="${cor.tinta}" stroke-width="24" stroke-linecap="round"/>
      <path d="M-34,-34 L34,34 M34,-34 L-34,34" stroke="${cor.acentoMapa}" stroke-width="13" stroke-linecap="round"/></g>` : "";
  }).join("");
  const mapa = `<g opacity="${Math.min(1, k * 2).toFixed(3)}" transform="translate(540 1020) scale(${esc.toFixed(4)}) translate(-540 -1020)">${vizinhos}${meus}${pinos}</g>`;
  const u = 300, x = 200, y = lerp(2200, 1720, p(T, 6.0, 0.6, enter)), b = empurrao(T, 6.9), foc = focinhoEm(x, y, u);
  const tag = etiqueta(T, { x: 140, y: 1500, w: 800, h: 120, rot: 1.5, at: 6.3, cor, seed: 31, miolo: (px, py, w, h) =>
    inter(px + w / 2, py + h / 2 + 18, cidades, cabeInter(cidades, w - 80, 50), cor.tinta) });
  return fundo(cor) + mapa + ovelha(T, { x, y, u, cor, empurra: b, rot: 14 }) + cerca(cor, { bojo: { x: foc.x, y: foc.y, r: 240, b: b * 0.8 } }) +
    faixa(T, { y: 300, t: "O SHOW É EM", at: 5.55, cor, f: 84 }) +
    etiqueta(T, { x: 120, y: 470, w: 840, h: 150, rot: 1, at: 5.8, cor, face: cor.acento, seed: 23, miolo: (px, py, w, h) =>
      anton(px + w / 2, py + h / 2 + 40, estado, cabeAnton(estado, w - 80, 112), cor.sobreAcento, "middle", 3) }) + tag;
}

// etiquetas dos shows: hora em bloco de acento, cidade em Anton, casa em Inter
export function etiquetasShows(T, story, cor, at = 9.05) {
  const N = story.shows.length, alto = Math.min(270, 900 / N), y0 = 500;
  let s = faixa(T, { y: 310, t: "SHOWS DE HOJE", at, cor });
  story.shows.forEach((sh, i) => {
    const y = y0 + i * (alto + 30), e = alto / 250, casa = sh.casa || "horário no perfil da banda", hh = hora(sh.hora), cid = sh.cidade.toUpperCase();
    s += etiqueta(T, { x: 80, y, w: 920, h: alto, rot: i % 2 ? 1.4 : -1.4, at: at + 0.3 + i * 0.3, cor, seed: 50 + i, miolo: (x, yy, w, h) => {
      const bw = 250 * e, tx = x + 40 + bw + 36, larg = w - (tx - x) - 40;
      return `<rect x="${x + 30}" y="${(yy + 50 * e).toFixed(1)}" width="${bw.toFixed(1)}" height="${(h - 80 * e).toFixed(1)}" fill="${cor.acento}" stroke="${cor.contorno}" stroke-width="3"/>` +
        anton(x + 30 + bw / 2, yy + 50 * e + (h - 80 * e) / 2 + 40 * e, hh, cabeAnton(hh, bw - 30, 112 * e), cor.sobreAcento, "middle", 1) +
        anton(tx, yy + h * 0.56, cid, cabeAnton(cid, larg, 104 * e), cor.tinta, "start", 1) +
        inter(tx, yy + h * 0.56 + 58 * e, casa, cabeInter(casa, larg, 40 * e), cor.tinta, "start", 0.75);
    } });
  });
  return s;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const u = 290, x = 880, y = lerp(2200, 1730, p(T, 10.2, 0.6, enter)), b = empurrao(T, 11.0), foc = focinhoEm(x, y, u);
  return fundo(cor) + ovelha(T, { x, y, u, cor, empurra: b, rot: -12 }) + cerca(cor, { bojo: { x: foc.x, y: foc.y, r: 230, b: b * 0.8 } }) + etiquetasShows(T, story, cor);
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda";
  const u = 470, x = 540, y = lerp(2500, 1500, p(T, 12.6, 0.55, enter)), b = empurrao(T, 13.25), foc = focinhoEm(x, y, u);
  const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], f = Math.min(...l.map((t) => cabeAnton(t, 800, 150)));
  const pedido = etiqueta(T, { x: 90, y: 290, w: 900, h: 110 + l.length * f * 1.02, rot: -1.5, at: 12.55, cor, seed: 61, miolo: (px, py, w) =>
    l.map((t, i) => anton(px + w / 2, py + 50 + (i + 1) * f * 1.0, t, f, i === 0 ? cor.acentoTexto : cor.tinta, "middle", 3)).join("") });
  const yPed = 290 + 110 + l.length * f * 1.02;
  const siga = etiqueta(T, { x: 170, y: yPed + 40, w: 740, h: 130, rot: 2, at: 13.1, cor, face: cor.tinta, seed: 71, miolo: (px, py, w, h) =>
    anton(px + w / 2, py + h / 2 + 34, "SIGA @SMUFDPJ", cabeAnton("SIGA @SMUFDPJ", w - 80, 92), cor.papel, "middle", 3) });
  const link = etiqueta(T, { x: 150, y: yPed + 210, w: 780, h: 84, rot: -1, at: 13.4, cor, seed: 81, miolo: (px, py, w, h) =>
    inter(px + w / 2, py + h / 2 + 14, site, cabeInter(site, w - 70, 40), cor.tinta) });
  return fundo(cor) + ovelha(T, { x, y, u, cor, empurra: b }) + cerca(cor, { bojo: { x: foc.x, y: foc.y, r: 400, b } }) + pedido + siga + link;
}
