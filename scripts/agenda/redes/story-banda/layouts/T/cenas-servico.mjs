// Layout T, cenas 3 (o estado como carta celeste circular, as cidades como estrelas numeradas ligadas por linha, 5.5
// a 9) e 4 (catálogo: um objeto catalogado por show, com galáxia desenhada, coordenada fictícia, cidade, hora e
// @casa, 9 a 12.5). Funciona com 1, 2 e 3 shows.
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { ceu, estrelas, estrela, txt, cabecalho, coordenada, novoId, f1, semente } from "./ceu.mjs";
import { galaxia, colchetes } from "./desenhos.mjs";
import { cabe, largura } from "./medida.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
// posição do show em graus; sem coordenada, o centro do estado
const ponto = (s) => s.lonlat ? mundo(s.lonlat) : (([a, b, c, d]) => [(a + c) / 2, (b + d) / 2])(caixaDe((ufs()[s.uf] || [[[-47, -15]]]).flat().map(mundo)));

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const cx = 540, cy = 990, R = 370, Q = { x: cx - 270, y: cy - 270, w: 540, h: 540 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), Q, 2, 10);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const cl = novoId("tm"), k = p(T, 5.7, 1.2, enter), kg = p(T, 5.5, 0.6, enter);
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.linha}" stroke-width="1" stroke-dasharray="2 6" opacity="0.4"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="${cor.linha}" opacity="${(0.1 * k).toFixed(3)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.linha}" stroke-width="2.2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - k).toFixed(3)}"/>`).join("");
  const grade = [R / 3, (2 * R) / 3].map((r) => `<circle cx="${cx}" cy="${cy}" r="${f1(r)}" fill="none" stroke="${cor.linha}" stroke-width="1" stroke-dasharray="3 6" opacity="0.4"/>`).join("") +
    `<path d="${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `M${cx},${cy} L${f1(cx + Math.cos(a) * R)},${f1(cy + Math.sin(a) * R)}`; }).join("")}" stroke="${cor.linha}" stroke-width="0.8" opacity="0.25"/>`;
  const marcas = Array.from({ length: 120 }, (_, i) => { const a = (i * Math.PI) / 60, l = i % 10 ? 7 : 18, c = Math.cos(a), s = Math.sin(a);
    return `M${f1(cx + c * R)},${f1(cy + s * R)} L${f1(cx + c * (R + l))},${f1(cy + s * (R + l))}`; }).join("");
  const pts = story.shows.map((s) => tela(cam, ponto(s))), kl = p(T, 6.9, 0.6 + 0.3 * pts.length, enter);
  const ligacao = pts.length > 1 ? `<path d="${pts.map(([a, b], i) => `${i ? "L" : "M"}${f1(a)},${f1(b)}`).join("")}" fill="none" stroke="${cor.acento}" stroke-width="2" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - kl).toFixed(3)}" opacity="0.9"/>` : "";
  const astros = pts.map(([a, b], i) => { const kp = p(T, 6.7 + i * 0.3, 0.4, pop), g = ((-165 + i * 75) * Math.PI) / 180, lx = a + Math.cos(g) * 66, ly = b + Math.sin(g) * 66;
    // rótulo em leque (cada número numa direção) com fio fino até a estrela: cidades vizinhas não se sobrepõem
    return kp <= 0 ? "" : estrela(a, b, 5 * kp, cor.estrela) + `<g opacity="${Math.min(1, kp).toFixed(3)}"><path d="M${f1(a + Math.cos(g) * 9)},${f1(b + Math.sin(g) * 9)} L${f1(lx - Math.cos(g) * 19)},${f1(ly - Math.sin(g) * 19)}" stroke="${cor.acento}" stroke-width="1.2"/>
      <circle cx="${f1(lx)}" cy="${f1(ly)}" r="19" fill="${cor.bg2}" stroke="${cor.acento}" stroke-width="2"/>${txt(lx, ly + 8, String(i + 1), 22, cor.acento)}</g>`; }).join("");
  const carta = `<g opacity="${kg.toFixed(3)}"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${cor.bg2}" opacity="0.6"/>
    <clipPath id="${cl}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><g clip-path="url(#${cl})">${estrelas(T, cor, { op: 0.45, raio: { x: cx, y: cy, r: R } })}${grade}${vizinhos}${meus}${ligacao}${astros}</g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${cor.linha}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R + 26}" fill="none" stroke="${cor.linha}" stroke-width="1" opacity="0.6"/>
    <path d="${marcas}" stroke="${cor.linha}" stroke-width="1.2" opacity="0.8"/>
    ${["N", "L", "S", "O"].map((l, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 2; return txt(cx + Math.cos(a) * (R + 52), cy + Math.sin(a) * (R + 52) + 10, l, 26, cor.texto2, { fonte: "sb" }); }).join("")}</g>`;
  const lista = story.shows.map((s, i) => { const kk = p(T, 7.0 + i * 0.25, 0.4, enter), f = cabe(s.cidade, 720, 44, "sb"), w = largura(s.cidade, f, "sb") + 58, x0 = cx - w / 2, y = 1500 + i * 66;
    return `<g opacity="${kk.toFixed(3)}"><circle cx="${f1(x0 + 19)}" cy="${y - 15}" r="19" fill="none" stroke="${cor.acento}" stroke-width="2"/>${txt(x0 + 19, y - 7, String(i + 1), 22, cor.acento)}
      ${txt(x0 + 58, y, s.cidade, f, cor.texto, { anchor: "start", fonte: "sb" })}</g>`; }).join("");
  const ke = p(T, 5.6, 0.5, enter);
  return ceu(T, cor) + cabecalho(250, "CARTA CELESTE Nº 02", cor) + `<g opacity="${ke.toFixed(3)}">${txt(cx, 356, "O show é em", 38, cor.texto2, { fonte: "sb" })}
    ${txt(cx, 474, estado.toUpperCase(), cabe(estado.toUpperCase(), 880, 92, "anton", 3), cor.texto, { fonte: "anton", ls: 3 })}</g>` + carta + lista;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, gap = 34, h = Math.min(330, (1110 - gap * (N - 1)) / N), y0 = 530 + (1110 - (N * h + gap * (N - 1))) / 2;
  const cards = story.shows.map((sh, i) => {
    const k = p(T, 9.3 + i * 0.35, 0.5, enter);
    if (k <= 0) return "";
    const y = y0 + i * (h + gap), e = h / 330, gx = 90 + 140 * e, s = semente(`${sh.cidade}${i}`), { ar, dec } = coordenada(sh.cidade + story.dia);
    const rot = `OBJ. SMF ${story.dia.slice(5).replace("-", "")}.${i + 1}   AR ${ar}   DEC ${dec}`, xt = 90 + 290 * e, wt = 950 - xt;
    const cid = sh.cidade.toUpperCase(), fc = cabe(cid, wt, 84 * e, "anton", 1), hh = hora(sh.hora) || "ver perfil", fh = (sh.hora ? 60 : 44) * e;
    const wh = largura(hh, fh, "xb"), casa = sh.casa || "local no perfil da banda", fca = cabe(casa, wt - wh - 36, 38 * e, "sb");
    return `<g opacity="${k.toFixed(3)}" transform="translate(${f1((1 - k) * 60)} 0)">
      <rect x="90" y="${f1(y)}" width="900" height="${f1(h)}" rx="22" fill="${cor.bg2}" opacity="0.62"/><rect x="90" y="${f1(y)}" width="900" height="${f1(h)}" rx="22" fill="none" stroke="${cor.linha}" stroke-width="1.2" opacity="0.6"/>
      ${colchetes(104, y + 14, 872, h - 28, cor.acento, 30 * e, 2)}${galaxia(gx, y + h / 2, 105 * e, cor, s, T * 6, 0.95)}
      ${txt(xt, y + h * 0.27, rot, cabe(rot, wt, 22 * e, "sb", 1.5), cor.texto2, { anchor: "start", fonte: "sb", ls: 1.5 })}
      ${txt(xt, y + h * 0.27 + 22 * e + fc * 0.95, cid, fc, cor.texto, { anchor: "start", fonte: "anton", ls: 1 })}
      ${txt(xt, y + h * 0.84, hh, fh, cor.acento, { anchor: "start" })}${txt(950, y + h * 0.84, casa, fca, sh.casa ? cor.texto : cor.texto2, { anchor: "end", fonte: "sb" })}</g>`;
  }).join("");
  const ke = p(T, 9.05, 0.4, enter);
  return ceu(T, cor) + cabecalho(250, "CATÁLOGO DE OBJETOS", cor) +
    `<g opacity="${ke.toFixed(3)}">${txt(540, 420, N > 1 ? "OS SHOWS DE HOJE" : "O SHOW DE HOJE", cabe("OS SHOWS DE HOJE", 860, 96, "anton", 3), cor.texto, { fonte: "anton", ls: 3 })}</g>` + cards;
}
