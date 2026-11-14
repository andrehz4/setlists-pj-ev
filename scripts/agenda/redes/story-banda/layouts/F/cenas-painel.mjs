// Layout F, cenas 3 (mapa de LEDs com as cidades em pastilhas, 5.5 a 9), 4 (quadro de partidas que sobe por cima do
// mapa: hora, casa digitada e cidade, 9 a 12.5) e 5 (final: COMPARTILHA em pastilhas, URL digitada, SIGA @SMUFDPJ).
import { lerp } from "../../tempo.mjs";
import { pastilhas, texto, linhaDigitada, separador, tileFit, pr, io, lin } from "./pastilhas.mjs";
import { modelo } from "./modelo.mjs";
import { desenharLeds, G } from "./leds.mjs";

const URL = "somaisumfadepearljam.com.br/agenda";

function etiquetas(T, M, cor) {
  return M.pts.map((c) => {
    if (T < c.t) return "";
    const abaixo = c.ly > c.a[1], h = Math.round(c.lt * 1.4);
    const y1 = c.a[1] + (abaixo ? 2 : -2) * G, y2 = abaixo ? c.ly - 8 : c.ly + h + 8;
    return `<line x1="${c.a[0]}" y1="${y1}" x2="${c.a[0]}" y2="${y2.toFixed(1)}" stroke="${cor.acc}" stroke-width="4" ` +
      `stroke-linecap="round" stroke-dasharray="0 10"/>` +
      `<rect x="${c.lx - 8}" y="${(c.ly - 8).toFixed(1)}" width="${c.lw + 16}" height="${h + 16}" fill="${cor.bg}"/>` +
      pastilhas(T, { id: `f3c${c.i + 1}`, txt: c.lab, x: c.lx, y: c.ly, tw: c.lt, gap: 4, start: c.t,
        settle: (k) => c.t + 0.08 + k * 0.02, cor });
  }).join("");
}

function linhasPartida(T, story, M, cor) {
  const P = M.p4;
  return P.linhas.map((c, i) => {
    if (T < c.on - 0.05) return "";
    const mid = c.ry + P.hh / 2;
    return (i > 0 ? separador(c.ry - Math.round(P.rgap / 2), pr(T, c.on - 0.05, 0.3, io), cor) : "") +
      pastilhas(T, { id: `f4h${i + 1}`, txt: c.hora, cols: 5, x: 60, y: c.ry, tw: P.ht.tw, gap: P.ht.gap, start: c.on,
        settle: (k) => c.on + 0.1 + k * 0.03, cor }) +
      (c.sub ? linhaDigitada(T, { t0: c.on + 0.3, txt: c.sub, cps: 40, x: 464, y: mid + c.sf * 0.36, F: c.sf, cor,
        cursorLigado: () => false }) : "") +
      pastilhas(T, { id: `f4c${i + 1}`, txt: c.cidade, cols: P.cityCols, x: 60, y: c.ry + P.hh + P.dy, tw: P.tc.tw, gap: P.tc.gap,
        start: c.on + 0.05, settle: (k) => c.on + 0.2 + k * 0.025, cor });
  }).join("");
}

export function cenaMapaShows(T, story, cor) {
  if (T < 5.5 || T >= 12.5) return "";
  const M = modelo(story), painel = pr(T, 9.0, 0.35, io), py = lerp(1920, 360, painel);
  // o mapa só é desenhado enquanto o quadro de partidas não cobriu tudo
  const mapa = painel < 1 ? desenharLeds(T, story, cor, M.pts.map((c) => c.t)) + etiquetas(T, M, cor) : "";
  const quadro = painel > 0
    ? `<rect x="0" y="${py.toFixed(1)}" width="1080" height="${(1920 - py).toFixed(1)}" fill="${cor.bg}"/>` +
    `<rect x="60" y="${py.toFixed(1)}" width="960" height="3" fill="${cor.ch}"/>` : "";
  const antes = T < 9;
  const topo = `<rect x="0" y="230" width="1080" height="140" fill="${cor.bg}"/>` +
    pastilhas(T, { id: antes ? "f3h" : "f4h", txt: antes ? M.head3 : M.head4, cols: M.hc, x: 60, y: 250,
      tw: M.t3.tw, gap: M.t3.gap,
      start: antes ? 5.5 : 9.0, settle: antes ? (c) => 5.6 + c * 0.03 : (c) => 9.04 + c * 0.008, cor });
  const opCol = pr(T, 9.2, 0.15, lin);
  const colunas = T >= 9.2
    ? texto("HORA", 60, 430, 26, cor.ch, { op: opCol }) + texto("LOCAL", 464, 430, 26, cor.ch, { op: opCol }) : "";
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>${mapa}${quadro}${topo}${colunas}` +
    (T >= 9 ? linhasPartida(T, story, M, cor) : "");
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const L = ["COMPARTILHA", "COM QUEM", "VAI COM", "VOCÊ"], tw = 81, gap = 6, h = Math.round(tw * 1.4);
  const siga = "SIGA @SMUFDPJ", ts = tileFit([...siga].length, 966, 999);
  const frase = L.map((l, r) => pastilhas(T, { id: `f5l${r}`, txt: l, cols: 11, x: 60, y: 300 + r * (h + 14), tw, gap,
    start: 12.5,
    settle: (c) => 12.5 + r * 0.06 + c * 0.012, cor })).join("");
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>${frase}` +
    texto("AGENDA ›", 60, 920, 26, cor.ch, { op: pr(T, 12.85, 0.1, lin) }) +
    linhaDigitada(T, { t0: 12.9, txt: URL, cps: 60, x: 60, y: 980, F: 36, cor, cursorLigado: () => T >= 12.9 && T < 13.6 }) +
    separador(1080, pr(T, 13.1, 0.3, io), cor) +
    pastilhas(T, { id: "f5s", txt: siga, x: 60, y: 1160, tw: ts.tw, gap: ts.gap, start: 13.2, settle: (c) => 13.3 + c * 0.02, cor,
      letra: cor.acc }) +
    texto("SÓ MAIS UM FÃ DE PEARL JAM", 60, 1500, 28, cor.ch, { op: pr(T, 13.5, 0.15, lin) });
}

