// Layout Y, cenas 3 (o estado como carta náutica polar: linhas de profundidade em volta, sondagens, rosa dos ventos e
// boias numeradas nas cidades, 5.5 a 9) e 4 (uma placa de gelo flutuante por show, derivando devagar, 9 a 12.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { txt, cabe, largura, paisagem, grao, novoId, f1, f3, rnd } from "./pecas.mjs";
import { placa } from "./gelo.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");

// Boia: casco arredondado na cor de acento com faixa clara, mastro e luz; número no casco
export const boia = (x, y, n, cor, s = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f3(s)})">
  <ellipse cx="0" cy="4" rx="30" ry="8" fill="none" stroke="${cor.cartaLinha}" stroke-width="1.4" opacity="0.7"/>
  <path d="M-3,-44 L3,-44 L2,-24 L-2,-24 Z" fill="${cor.sobreCeu}"/><circle cx="0" cy="-48" r="5" fill="${cor.acento}" stroke="${cor.sobreCeu}" stroke-width="1.5"/>
  <path d="M-22,-24 H22 Q26,-2 16,4 H-16 Q-26,-2 -22,-24 Z" fill="${cor.acento}" stroke="${cor.carta}" stroke-width="2"/>
  <rect x="-23" y="-17" width="46" height="5" fill="${cor.sobreAcento}" opacity="0.85"/>
  ${txt(0, 1, String(n), 19, cor.sobreAcento, { fonte: "xb" })}</g>`;

function rosa(x, y, r, c) {
  const ticks = Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2, l = i % 8 === 0 ? 14 : i % 2 ? 5 : 9;
    return `M${f1(x + Math.sin(a) * r)},${f1(y - Math.cos(a) * r)} L${f1(x + Math.sin(a) * (r - l))},${f1(y - Math.cos(a) * (r - l))}`; }).join(" ");
  return `<g fill="none" stroke="${c}" opacity="0.8"><circle cx="${x}" cy="${y}" r="${r}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r - 18}" stroke-width="0.8"/><path d="${ticks}" stroke-width="1"/>
    <path d="M${x},${y - r + 4} L${x + 9},${y} L${x},${y + r - 22} L${x - 9},${y} Z" fill="${c}" stroke-width="0.8" opacity="0.85"/></g>${txt(x, y - r - 12, "N", 24, c, { fonte: "xb" })}`;
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const F = { x: 90, y: 560, w: 900, h: 780 }, R = { x: F.x + 110, y: F.y + 100, w: F.w - 220, h: F.h - 200 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 50);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const meus = ufsShow.map(forma).join(" "), cl = novoId("yn"), k = p(T, 5.7, 1.0, enter);
  // linhas de profundidade: traço largo na cor da linha coberto por um mais fino na cor do mar = contorno fino a distância
  const iso = [230, 180, 136, 96, 60, 28].map((w, i) => { const o = f3(p(T, 5.9 + (5 - i) * 0.12, 0.4, enter) * (0.35 + i * 0.1));
    return `<path d="${meus}" fill="none" stroke="${cor.cartaLinha}" stroke-width="${w + 2.6}" stroke-linejoin="round" opacity="${o}"/><path d="${meus}" fill="none" stroke="${cor.carta}" stroke-width="${w}" stroke-linejoin="round"/>`; }).join("");
  const sond = Array.from({ length: 34 }, (_, i) => txt(F.x + 30 + rnd(i + 801) * (F.w - 60), F.y + 40 + rnd(i + 851) * (F.h - 60), String(Math.round(20 + rnd(i + 901) * 380)), 17, cor.sobreCeu, { fonte: "sb", op: 0.35 })).join("");
  const grade = Array.from({ length: 7 }, (_, i) => `M${f1(F.x + ((i + 1) * F.w) / 8)},${F.y} V${F.y + F.h} M${F.x},${f1(F.y + ((i + 1) * F.h) / 8)} H${F.x + F.w}`).join(" ");
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="${cor.terra}" fill-opacity="0.1" stroke="${cor.cartaLinha}" stroke-width="1" stroke-dasharray="2 5" opacity="0.6"/>`).join("");
  const terra = `<path d="${meus}" fill="${cor.terra}" opacity="${f3(0.15 + 0.85 * k)}"/><path d="${meus}" fill="none" stroke="${cor.gelo3}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${meus}" fill="none" stroke="${cor.sobreCeu}" stroke-width="1" transform="translate(3 4)" opacity="0.35"/>`;
  const pinos = story.shows.map((s, i) => { const [a, b] = tela(cam, mundo(s.lonlat)), kp = p(T, 6.7 + i * 0.3, 0.4, pop);
    return kp > 0 ? boia(a, b + Math.sin(T * 3 + i * 2) * 3, i + 1, cor, kp) : ""; }).join("");
  const carta = `<clipPath id="${cl}"><rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}"/></clipPath>
    <g clip-path="url(#${cl})"><path d="${grade}" stroke="${cor.cartaLinha}" stroke-width="0.8" stroke-dasharray="1 6" opacity="0.6"/>${sond}${iso}${vizinhos}${terra}${pinos}</g>
    <rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="none" stroke="${cor.sobreCeu}" stroke-width="2" opacity="0.8"/>
    <rect x="${F.x - 10}" y="${F.y - 10}" width="${F.w + 20}" height="${F.h + 20}" fill="none" stroke="${cor.sobreCeu}" stroke-width="0.8" opacity="0.6"/>${rosa(F.x + F.w - 95, F.y + 115, 58, cor.sobreCeu)}`;
  const leg = story.shows.map((s, i) => {
    const kl = p(T, 7.0 + i * 0.25, 0.4, enter), y = F.y + F.h + 110 + i * 72, fc = cabe(s.cidade, 700, 54, "xb"), w = largura(s.cidade, fc, "xb");
    return `<g opacity="${f3(kl)}">${boia(540 - w / 2 - 40, y + 14, i + 1, cor, 0.85)}${txt(540 - w / 2 + 10, y, s.cidade, fc, cor.sobreCeu, { anchor: "start", fonte: "xb" })}</g>`;
  }).join("");
  const fe = cabe(estado.toUpperCase(), 880, 120);
  return `<rect width="1080" height="1920" fill="${cor.carta}"/>${grao(cor.graoCor, cor.graoOp)}` +
    txt(540, 300, "CARTA DE NAVEGAÇÃO · HOJE", 30, cor.sobreCeu, { fonte: "xb", ls: 7, op: 0.75 }) + txt(540, 370, "o show é em", 44, cor.sobreCeu, { fonte: "sb", op: 0.85 }) +
    txt(540, 385 + fe * 0.95, estado.toUpperCase(), fe, cor.sobreCeu) + carta + leg;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, slot = Math.min(330, 980 / N), e = Math.min(1, slot / 300), y0 = 700 + (980 - N * slot) / 2;
  const itens = story.shows.map((sh, i) => {
    const k = p(T, 9.2 + i * 0.3, 0.7, enter), lado = i % 2 ? 1 : -1;
    if (k <= 0) return "";
    const w = 880 - (i % 2) * 40, h = slot * 0.8, cx = 540 + lado * (1 - k) * 700 + Math.sin(T * 0.9 + i * 1.7) * 12, cy = y0 + i * slot + h / 2 + Math.sin(T * 1.6 + i) * 4;
    const hh = hora(sh.hora) || "ver perfil", fh = (hora(sh.hora) ? 92 : 58) * e, wh = largura(hh, fh), inner = w - 150;
    const fc = cabe(sh.cidade.toUpperCase(), inner - wh - 40, 76 * e), casa = sh.casa || "local no perfil da banda", fs = cabe(casa, inner, 38 * e, "sb");
    const xl = cx - inner / 2, xr = cx + inner / 2, yb = cy - (fc + 22 * e + fs) / 2 + fc * 0.86 - 4;
    return `<g transform="rotate(${f1(lado * 0.8 * Math.sin(T * 0.7 + i))} ${f1(cx)} ${f1(cy)})">${placa(cx, cy, w, h, 200 + i * 17, cor)}
      ${txt(xl, yb, sh.cidade.toUpperCase(), fc, cor.entalhe, { anchor: "start" })}${txt(xr, yb, hh, fh, cor.hora, { anchor: "end" })}
      ${txt(xl, yb + 22 * e + fs, casa, fs, cor.entalhe, { anchor: "start", fonte: "sb", op: 0.8 })}</g>`;
  }).join("");
  const kt = p(T, 9.0, 0.5, enter), mercurio = lerp(0, 1, p(T, 9.3, 1.2, enter));
  const termo = `<g transform="translate(905 320)"><rect x="-11" y="-120" width="22" height="130" rx="11" fill="none" stroke="${cor.sobreCeu}" stroke-width="2"/>
    <circle cx="0" cy="22" r="20" fill="${cor.acento}" stroke="${cor.sobreCeu}" stroke-width="2"/><rect x="-5" y="${f1(10 - 120 * mercurio)}" width="10" height="${f1(120 * mercurio)}" fill="${cor.acento}"/>
    ${[0, 1, 2, 3, 4].map((j) => `<path d="M14,${-100 + j * 24} h10" stroke="${cor.sobreCeu}" stroke-width="1.5"/>`).join("")}</g>`;
  return paisagem(T, cor, { horizonte: 600 }) + `<g opacity="${f3(kt)}">${txt(120, 340, "SHOWS DE HOJE", 112, cor.sobreCeu, { anchor: "start" })}
    ${txt(122, 410, "a geleira toda vai derreter", 36, cor.sobreCeu, { anchor: "start", fonte: "sb", op: 0.85 })}${termo}</g>` + itens;
}
