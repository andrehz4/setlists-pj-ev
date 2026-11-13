// Layout G, cenas 3 (mapa de LED, 5.5 a 9), 4 (partidas de hoje, 9 a 12.5) e 5 (final, 12.5 a 15).
import { p, pop, enter } from "../../tempo.mjs";
import { esc, F_INTER_XB, F_PLAYFAIR } from "../../pecas.mjs";
import { afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { fileira, larguraPlaca, persiana, rotulo, placa } from "./placas.mjs";
import { leds, posShows, RM } from "./mapa-led.mjs";
import { fundo, dataCurta } from "./cenas-abertura.mjs";

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const destino = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase();
  const wd = larguraPlaca(destino.length, 960, 72);
  const pos = posShows(story), desl = afastar(pos, 34, RM), N = story.shows.length;
  const marcas = story.shows.map((s, i) => {
    const x = pos[i][0] + desl[i][0], y = pos[i][1] + desl[i][1], pouso = 6.75 + i * 0.3;
    if (T < pouso) return "";
    const k = p(T, pouso, 0.35, pop);
    const ondas = [0, 0.6].map((d) => { const f = ((T - pouso - d) % 1.2) / 1.2; return T - pouso - d > 0
      ? `<circle cx="${x}" cy="${y}" r="${(20 + 95 * f).toFixed(1)}" fill="none" stroke="${cor.acento}" stroke-width="4" opacity="${(1 - f).toFixed(2)}"/>` : ""; }).join("");
    const nome = s.cidade.toUpperCase(), wl = nome.length * 0.62 * 30 + 32, dir = x + 40 + wl < 1020;
    const lx = dir ? x + 40 : x - 40 - wl, op = p(T, pouso + 0.15, 0.25, enter) * (N === 1 ? 1 : 0);
    return `${ondas}<circle cx="${x}" cy="${y}" r="${(20 * k).toFixed(1)}" fill="${cor.acento}"/>
      ${N > 1 ? `<text x="${x}" y="${y + 9}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="26" fill="${cor.bg}" opacity="${op.toFixed(2)}">${i + 1}</text>` : ""}
      <g opacity="${op.toFixed(3)}"><rect x="${lx}" y="${y - 27}" width="${wl}" height="54" rx="6" fill="${cor.placa}"/>
      <text x="${lx + 16}" y="${y + 11}" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${cor.letra}">${esc(nome)}</text></g>`;
  }).join("");
  const legenda = N > 1 ? story.shows.map((sh, i) => {
    const op = p(T, 6.75 + i * 0.3 + 0.15, 0.25, enter), y = 1600;
    const col = i % 2, lin = Math.floor(i / 2), x = 60 + col * 490, yy = y - (Math.ceil(N / 2) - 1 - lin) * 64;
    return `<g opacity="${op.toFixed(3)}"><circle cx="${x + 22}" cy="${yy}" r="22" fill="${cor.acento}"/>
      <text x="${x + 22}" y="${yy + 9}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="26" fill="${cor.bg}">${i + 1}</text>
      <text x="${x + 58}" y="${yy + 11}" font-family="${F_INTER_XB}" font-weight="800" font-size="${Math.min(32, 400 / (sh.cidade.length * 0.62)).toFixed(1)}" fill="${cor.letra}">${esc(sh.cidade.toUpperCase())}</text></g>`;
  }).join("") : "";
  return fundo(cor) + rotulo("DESTINO", 60, 290, cor.apoio, { f: 26 }) +
    fileira(T, destino, { x: 60, y: 310, w: wd, h: wd * 1.3, t0: 5.6, passo: 0.03, cor, semente: 60 }) +
    leds(T, story, cor) + marcas + legenda + persiana(T, 8.72, 0.26, cor.bg);
}

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}:${b || "00"}`) : "HOJE");

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(560, 1200 / N), s = Math.min(1.45, alto / 330);
  const tw = 78 * s, th = 104 * s, x1 = 60 + 5 * (tw + 6) + 28;
  let out = fundo(cor) + rotulo("PARTIDAS DE HOJE", 60, 290, cor.acento, { f: 30 }) +
    rotulo(dataCurta(story.dia), 1020, 290, cor.apoio, { f: 30, ancora: "end" }) +
    `<rect x="60" y="318" width="960" height="3" fill="${cor.apoio}" opacity="0.5"/>` +
    rotulo("HORA", 60, 370, cor.apoio, { f: 24 }) + rotulo("CASA", x1, 370, cor.apoio, { f: 24 });
  const y0 = 400 + (1220 - N * alto) / 2;
  story.shows.forEach((sh, i) => {
    const y = y0 + i * alto, t0 = 9.15 + i * 0.3, cidade = sh.cidade.toUpperCase();
    const cw = larguraPlaca(cidade.length, 960, 70 * s), op = p(T, t0 + 0.2, 0.3, enter);
    const casa = sh.casa || "detalhes no perfil", fc = Math.min((sh.casa ? 40 : 30) * s, (1020 - x1) / (casa.length * 0.6));
    out += fileira(T, hora(sh.hora), { x: 60, y, w: tw, h: th, t0, cor, corLetra: cor.acento, semente: 70 + i, colunas: 5 }) +
      `<text x="${x1}" y="${(y + th / 2 + fc * 0.36).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${fc.toFixed(1)}" fill="${cor.letra}" opacity="${op.toFixed(3)}">${esc(casa)}</text>` +
      fileira(T, cidade, { x: 60, y: y + th + 16 * s, w: cw, h: cw * 1.3, t0: t0 + 0.15, passo: 0.025, cor, semente: 80 + i }) +
      (i < N - 1 ? `<rect x="60" y="${(y + alto - 26 * s).toFixed(1)}" width="960" height="2" fill="${cor.apoio}" opacity="${(0.35 * op).toFixed(2)}"/>` : "");
  });
  return out;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const w = larguraPlaca(12, 960, 80), h = w * 1.34;
  const op = (t) => p(T, t, 0.3, enter).toFixed(3);
  const linhas = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"].map((l, r) =>
    fileira(T, l, { x: 60, y: 690 + r * (h + 14), w, h, t0: 12.55 + r * 0.12, passo: 0.022, giro: 0.3, cor, semente: 90 + r, colunas: 12 })).join("");
  const siga = fileira(T, "@SMUFDPJ", { x: 540, y: 1345, w: 96, h: 128, t0: 13.35, cor, corLetra: cor.acento, alinhar: "centro", semente: 99 });
  return fundo(cor) +
    `<text x="540" y="580" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="54" fill="${cor.acento}" opacity="${op(12.6)}">Só Mais um Fã de PEARL JAM</text>` +
    linhas + `<g opacity="${op(13.1)}"><rect x="60" y="1080" width="960" height="84" rx="8" fill="none" stroke="${cor.apoio}" stroke-width="3"/>
    <text x="540" y="1135" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="38" fill="${cor.letra}">somaisumfadepearljam.com.br/agenda</text></g>` +
    rotulo("SIGA", 540, 1320, cor.apoio, { f: 30, ancora: "middle", op: op(13.3) }) + siga;
}
export { placa };
