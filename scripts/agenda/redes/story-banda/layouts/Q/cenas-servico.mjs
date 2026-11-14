// Layout Q, cenas 3 (prancha de atlas antigo com o estado em gravura, 5.5 a 9), 4 (índice: um capítulo por show, com
// pontilhado até a hora, 9 a 12.5) e 5 (verso da capa: carimbo com o pedido de compartilhar, ex-libris e link, 12.5 a 15).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { tecido, pagina, moldura, filete, viraFolha, serif, cabe, romano, novoId, f1, rnd, PG } from "./pecas.mjs";
import { mao, cabeca, rosaVentos } from "./desenhos.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
const cabecalho = (cor, t) => serif(540, PG.y + 120, t, 36, cor.tinta, { peso: "bold", ls: 9 }) + filete(540, PG.y + 156, 380, cor.tinta, 0.85);

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const F = { x: 130, y: 590, w: 820, h: 760 }, R = { x: F.x + 40, y: F.y + 40, w: F.w - 80, h: F.h - 80 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 50);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const hac = novoId("qa"), cl = novoId("qf"), k = p(T, 5.8, 1.1, enter);
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.tinta}" stroke-width="1.2" stroke-dasharray="3 5" opacity="0.45"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="url(#${hac})" opacity="${k.toFixed(3)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.tinta}" stroke-width="2.6" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"/>`).join("");
  const pinos = story.shows.map((s, i) => { const [a, b] = tela(cam, mundo(s.lonlat)), kp = p(T, 6.8 + i * 0.3, 0.35, pop);
    return kp > 0 ? `<g transform="translate(${f1(a)} ${f1(b)}) scale(${kp.toFixed(3)})"><circle r="21" fill="${cor.papel}" stroke="${cor.acento}" stroke-width="3"/>${serif(0, 9, String(i + 1), 26, cor.acento, { peso: "bold" })}</g>` : ""; }).join("");
  const ticks = Array.from({ length: 9 }, (_, i) => { const tx = F.x + (F.w * (i + 1)) / 10, ty = F.y + (F.h * (i + 1)) / 10;
    return `M${f1(tx)},${F.y} v-12 M${f1(tx)},${F.y + F.h} v12 M${F.x},${f1(ty)} h-12 M${F.x + F.w},${f1(ty)} h12`; }).join("");
  const mapa = `<pattern id="${hac}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0 V9" stroke="${cor.tinta}" stroke-width="1.3"/></pattern>
    <clipPath id="${cl}"><rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}"/></clipPath>
    <g clip-path="url(#${cl})">${vizinhos}${meus}${pinos}</g>${moldura(F.x, F.y, F.w, F.h, cor.tinta, 0.9, 0.8)}
    <path d="${ticks}" stroke="${cor.tinta}" stroke-width="1.4" opacity="0.8"/>${rosaVentos(F.x + F.w - 90, F.y + 110, 46, cor.tinta, cor.papel)}`;
  const leg = story.shows.map((s, i) => `${i + 1}. ${s.cidade}`).join("   ");
  const kl = p(T, 6.4, 0.5, enter);
  return tecido(cor) + pagina(cor, 12) + cabecalho(cor, "PRANCHA II") +
    serif(540, PG.y + 236, "O show é em", 46, cor.tinta, { op: 0.85 }) + serif(540, PG.y + 330, estado, cabe(estado, 820, 92, 0.58), cor.tinta, { peso: "black" }) + mapa +
    `<g opacity="${kl.toFixed(3)}">${serif(540, F.y + F.h + 90, "Prancha II.", 40, cor.tinta, { peso: "bold" })}${serif(540, F.y + F.h + 150, leg, cabe(leg, 800, 40, 0.48), cor.tinta, { op: 0.85 })}</g>` +
    viraFolha(T, 5.5, cor);
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(250, 760 / N), y0 = PG.y + 380;
  const itens = story.shows.map((sh, i) => {
    const k = p(T, 9.4 + i * 0.35, 0.45, enter);
    if (k <= 0) return "";
    const y = y0 + i * alto + 70, cap = `Cap. ${romano(i + 1)}.`, hh = hora(sh.hora) || "ver perfil", e = Math.min(1, alto / 200);
    const fc = cabe(sh.cidade, 450, 76 * e, 0.5), xc = 330, fimC = xc + sh.cidade.length * 0.5 * fc + 20, fh = 62 * e, iniH = 930 - hh.length * 0.5 * fh - 18;
    const casa = sh.casa ? `na casa ${sh.casa}` : "horário no perfil da banda";
    return `<g opacity="${k.toFixed(3)}" transform="translate(${f1((1 - k) * 30)} 0)">${serif(170, y, cap, 32 * e, cor.tinta, { anchor: "start", peso: "bold", op: 0.8 })}
      ${serif(xc, y, sh.cidade, fc, cor.tinta, { anchor: "start", peso: "black" })}
      ${iniH > fimC ? `<path d="M${f1(fimC)},${y - 6} H${f1(iniH)}" stroke="${cor.tinta}" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0.1 13" opacity="0.7"/>` : ""}
      ${serif(930, y, hh, fh, cor.acento, { anchor: "end", peso: "bold" })}${serif(xc, y + 64 * e, casa, cabe(casa, 600, 42 * e, 0.46), cor.tinta, { anchor: "start", op: 0.75 })}
      <path d="M122,${y - 24} l12,14 l24,-30" fill="none" stroke="${cor.acento}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="${p(T, 9.8 + i * 0.35, 0.3).toFixed(3)}"/></g>`;
  }).join("");
  const ym = y0 + N * alto + 250;
  return tecido(cor) + pagina(cor, 23) + cabecalho(cor, "ÍNDICE") + serif(540, PG.y + 280, "Shows de hoje", 84, cor.tinta, { peso: "black" }) + itens +
    (ym < PG.y + PG.h - 150 ? mao(540, ym, 0.75, cor.tinta, cor.papel, p(T, 10.4, 0.6, enter)) : "") + viraFolha(T, 9.0, cor);
}

// carimbo de tinta com falhas (pontinhos da cor do papel por cima)
const FALHAS = Array.from({ length: 40 }, (_, i) => [rnd(i + 201), rnd(i + 251), 2 + rnd(i + 301) * 5]);
export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda", l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];
  const f = Math.min(...l.map((t) => cabe(t, 660, 110, 0.66))), sx = 150, sy = PG.y + 150, sw = 780, sh = 120 + l.length * f * 1.12;
  const ks = p(T, 12.6, 0.45, pop), esc = lerp(1.5, 1, Math.min(1, ks));
  const falhas = FALHAS.map(([a, b, r]) => `<circle cx="${f1(sx + a * sw)}" cy="${f1(sy + b * sh)}" r="${f1(r)}" fill="${cor.papel}" opacity="0.8"/>`).join("");
  const carimbo = ks > 0 ? `<g opacity="${Math.min(0.92, ks * 2).toFixed(3)}" transform="translate(540 ${f1(sy + sh / 2)}) rotate(-4) scale(${esc.toFixed(3)}) translate(-540 ${f1(-(sy + sh / 2))})">
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="14" fill="none" stroke="${cor.acento}" stroke-width="7"/><rect x="${sx + 16}" y="${sy + 16}" width="${sw - 32}" height="${sh - 32}" rx="8" fill="none" stroke="${cor.acento}" stroke-width="2.5"/>
    ${l.map((t, i) => serif(540, sy + 80 + (i + 0.8) * f * 1.1, t, f, cor.acento, { peso: "black", ls: 2 })).join("")}${falhas}</g>` : "";
  const ke = p(T, 13.15, 0.45, enter), ey = sy + sh + 110, eh = 300;
  const exlibris = `<g opacity="${ke.toFixed(3)}" transform="translate(0 ${f1((1 - ke) * 50)})"><rect x="200" y="${ey}" width="680" height="${eh}" fill="${cor.papel}" stroke="${cor.tinta}" stroke-width="1.5"/>
    ${moldura(214, ey + 14, 652, eh - 28, cor.tinta, 0.9, 0.9)}${serif(540, ey + 92, "EX LIBRIS", 32, cor.tinta, { peso: "bold", ls: 12 })}${filete(540, ey + 124, 300, cor.tinta)}
    ${serif(540, ey + 220, "Siga @smufdpj", cabe("Siga @smufdpj", 560, 80, 0.55), cor.tinta, { peso: "black" })}</g>`;
  const kl = p(T, 13.5, 0.4, enter);
  return tecido(cor) + pagina(cor, null) + carimbo + exlibris +
    serif(540, ey + eh + 100, site, cabe(site, 820, 46, 0.47), cor.tinta, { peso: "bold", op: kl }) +
    cabeca(540, ey + eh + 290, 0.85, cor.tinta, cor.papel, p(T, 13.4, 1.0, enter));
}
