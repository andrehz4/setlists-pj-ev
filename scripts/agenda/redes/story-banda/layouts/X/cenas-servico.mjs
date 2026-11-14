// Layout X, cenas 3 (o estado com uma linha de alta tensão: uma torre por show, fio em catenária ligando os pinos e
// a faísca correndo no fio, 5.5 a 9) e 4 (quadro de força: um disjuntor por show que liga com estalo e acende a
// plaqueta com cidade, hora e @casa, 9 a 12.5).
import { p, pop, enter } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { fundo, neon, ligado, molduraDeco, rotulo, txt, cabe, largura, halo, novoId, f1, op3 } from "./pecas.mjs";
import { torre, fio, disjuntor } from "./eletrica.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");

// pino numerado (círculo com o número em neon) na base da torre
const pino = (x, y, n, cor, k) => k > 0 ? `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})"><circle r="25" fill="${cor.bg}" stroke="${cor.ouro}" stroke-width="2.4"/>
  <circle r="19" fill="none" stroke="${cor.ouro}" stroke-width="0.9"/>${txt(0, 11, String(n), 30, cor.nucleo, { fonte: "anton" })}</g>` : "";

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const F = { x: 90, y: 590, w: 900, h: 880 }, R = { x: F.x + 60, y: F.y + 150, w: F.w - 120, h: F.h - 190 };
  const pontos = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo)), caixa = caixaDe(pontos);
  const cam = enquadra(caixa, R, 2, 30), centro = [(caixa[0] + caixa[2]) / 2, (caixa[1] + caixa[3]) / 2];
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const hac = novoId("xa"), cl = novoId("xm"), hl = halo(8), k = p(T, 5.7, 1.0, enter);
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.linha}" stroke-width="1" stroke-dasharray="2 6" opacity="0.4"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="url(#${hac})" opacity="${op3(k)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.neon}" stroke-width="7" opacity="${op3(0.6 * k)}" filter="url(#${hl.id})"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.nucleo}" stroke-width="2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"/>`).join("");
  const reais = story.shows.map((s) => tela(cam, s.lonlat ? mundo(s.lonlat) : centro));
  const pos = afastar(reais, 70, R).map(([dx, dy], i) => [reais[i][0] + dx, reais[i][1] + dy]);
  const torres = pos.map(([x, y], i) => ({ ...torre(x, y, 140, cor, p(T, 6.5 + i * 0.25, 0.4)), x, y }));
  // fio que chega de fora do quadro (pela lateral mais perto) até a 1a torre e depois liga uma torre na outra
  const [t0] = torres, lado = t0.x < F.x + F.w / 2 ? F.x - 20 : F.x + F.w + 20;
  const entra = [[lado, t0.fio[0][1] - 70], [lado, t0.fio[1][1] - 60]];
  const fios = [0, 1].map((j) => fio(T, 6.9, entra[j], t0.fio[j], cor, { sag: 40, fase: j * 0.5 })).join("") +
    torres.slice(1).map((tb, i) => [0, 1].map((j) => fio(T, 7.2 + i * 0.3, torres[i].fio[j], tb.fio[j], cor, { sag: 50, fase: j * 0.5 })).join("")).join("");
  const pinos = torres.map((t, i) => pino(t.x, t.y, i + 1, cor, p(T, 6.7 + i * 0.25, 0.35, pop))).join("");
  const mapa = `<pattern id="${hac}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0 V10" stroke="${cor.linha}" stroke-width="1.1" opacity="0.6"/></pattern>
    ${hl.def}<clipPath id="${cl}"><rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}"/></clipPath>
    <rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="#000" opacity="0.3"/>
    <g clip-path="url(#${cl})">${vizinhos}${meus}${torres.map((t) => t.desenho).join("")}${fios}${pinos}</g>${molduraDeco(F.x, F.y, F.w, F.h, cor.ouro, { s: 30 })}`;
  const kl = p(T, 7.0, 0.5, enter), fe = cabe(estado, 860, 110, "anton");
  const lista = story.shows.map((s, i) => { const y = F.y + F.h + 80 + i * 62, fcid = cabe(s.cidade, 700, 46, "xb");
    const x0 = 540 - (largura(s.cidade, fcid, "xb") + 64) / 2;
    return `${pino(x0 + 22, y - 16, i + 1, cor, 0.8)}${txt(x0 + 64, y, s.cidade, fcid, cor.texto, { fonte: "xb", anchor: "start" })}`; }).join("");
  return fundo(cor) + rotulo(300, "LINHA DE ALTA TENSÃO", cor) + txt(540, 420, "O show é em", 44, cor.texto, { fonte: "sb", op: 0.9 }) +
    neon(540, 420 + fe * 1.05, estado, fe, cor, ligado(T, 5.65)) + mapa + `<g opacity="${op3(kl)}">${lista}</g>`;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(400, 1000 / N), y0 = 590, px = 80, pw = 920, ph = N * alto + 70;
  const kp = p(T, 9.05, 0.4, enter), g = novoId("xq");
  const parafuso = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="${cor.metal2}" stroke="${cor.ouro}" stroke-width="1"/><path d="M${x - 6},${y} h12" stroke="${cor.ouro}" stroke-width="1.6"/>`;
  const placa = `<linearGradient id="${g}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${cor.metal}"/><stop offset="1" stop-color="${cor.metal2}"/></linearGradient>
    <rect x="${px + 10}" y="${y0 + 16}" width="${pw}" height="${ph}" rx="10" fill="#000" opacity="0.45"/><rect x="${px}" y="${y0}" width="${pw}" height="${ph}" rx="10" fill="url(#${g})"/>
    ${molduraDeco(px + 16, y0 + 16, pw - 32, ph - 32, cor.ouro, { s: 22, sw: 1.6, op: 0.85 })}
    ${parafuso(px + 34, y0 + 34)}${parafuso(px + pw - 34, y0 + 34)}${parafuso(px + 34, y0 + ph - 34)}${parafuso(px + pw - 34, y0 + ph - 34)}
    <path d="M${px + 62},${y0 + 60} V${y0 + ph - 60}" stroke="${cor.ouro}" stroke-width="5" opacity="0.55"/>`;
  const itens = story.shows.map((sh, i) => {
    const t0 = 9.5 + i * 0.45, y = y0 + 35 + i * alto, dh = Math.min(280, alto - 60), e = dh / 220, yc = y + (alto - dh) / 2;
    const hh = hora(sh.hora) || "ver perfil", fh = cabe(hh, 260, 76 * e), wh = largura(hh, fh), luz = ligado(T, t0 + 0.08);
    const xc = 300, cid = sh.cidade.toUpperCase(), fc = cabe(cid, 920 - xc - wh - 40, 74 * e), casa = sh.casa || "local no perfil da banda";
    return `<path d="M${px + 62},${f1(yc + dh * 0.4)} H118" stroke="${cor.ouro}" stroke-width="3" opacity="0.55"/>${disjuntor(T, t0, 118, yc, dh * 0.9, cor)}
      <rect x="${xc - 20}" y="${f1(yc)}" width="${930 - xc + 20}" height="${f1(dh * 0.9)}" rx="6" fill="${cor.bg}" stroke="${cor.ouro}" stroke-width="1.2" opacity="0.92"/>
      <circle cx="${xc - 6}" cy="${f1(yc + 14)}" r="3.5" fill="${cor.ouro}"/><circle cx="${930 - 14}" cy="${f1(yc + 14)}" r="3.5" fill="${cor.ouro}"/>
      ${txt(xc + 8, yc + dh * 0.42, cid, fc, cor.texto, { anchor: "start", op: 0.45 + 0.55 * luz })}
      ${neon(910, yc + dh * 0.42, hh, fh, cor, luz, { anchor: "end" })}
      ${txt(xc + 8, yc + dh * 0.74, casa, cabe(casa, 600, 40 * e, "sb"), cor.ouro, { fonte: "sb", anchor: "start", op: 0.4 + 0.6 * luz })}`;
  }).join("");
  const ft = cabe("SHOWS DE HOJE", 860, 100, "anton", 3);
  return fundo(cor) + rotulo(300, "QUADRO DE FORÇA", cor) + neon(540, 400 + ft * 0.9, "SHOWS DE HOJE", ft, cor, ligado(T, 9.1), { ls: 3 }) +
    `<g opacity="${op3(kp)}" transform="translate(0 ${f1((1 - kp) * 40)})">${placa}${itens}</g>`;
}
