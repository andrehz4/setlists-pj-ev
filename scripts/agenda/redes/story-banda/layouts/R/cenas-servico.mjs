// Layout R, cenas 3 (o estado dentro de uma foto instantânea, pinos numerados, legenda com as cidades, 5.5 a 9),
// 4 (uma foto por show, presa com fita ou tachinha: cidade e casa à mão, hora num rótulo de fita, 9 a 12.5) e
// 5 (o mural se monta com o pedido de compartilhar, o "Siga @smufdpj" e o link da agenda, 12.5 a 15).
import { p, pop, enter } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { fundo, rotulo, mao, sans, cabe, hora, sombra, f1 } from "./pecas.mjs";
import { polaroide } from "./polaroide.mjs";
import { desenho, NOMES } from "./desenhos.mjs";
import { queda, miuda } from "./cenas-capa.mjs";

// pino numerado com sombra suave (o número bate com a ordem da lista de shows)
const pino = (x, y, n, k, cor) => { const s = sombra(3);
  return k > 0 ? `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})">${s.def}<circle cx="3" cy="5" r="24" fill="#000" opacity="0.35" filter="url(#${s.id})"/>
    <circle r="24" fill="${cor.acento}" stroke="${cor.moldura}" stroke-width="4"/>${sans(0, 10, String(n), 28, cor.moldura)}</g>` : ""; };

// cidades vizinhas: empurra os pinos até não se encostarem (devolve [x, y, xReal, yReal]; o real ganha ponto e haste)
function afasta(pts, dist = 58) {
  const q = pts.map(([x, y]) => [x, y]);
  for (let it = 0; it < 40; it++) for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
    const dx = q[j][0] - q[i][0], dy = q[j][1] - q[i][1], d = Math.hypot(dx, dy) || 0.01, f = (dist - d) / 2;
    if (f > 0) { const ux = d > 0.01 ? dx / d : 1, uy = d > 0.01 ? dy / d : 0; q[i][0] -= ux * f; q[i][1] -= uy * f; q[j][0] += ux * f; q[j][1] += uy * f; }
  }
  return q.map(([x, y], i) => [x, y, pts[i][0], pts[i][1]]);
}

// legenda de itens: uma linha se couber com corpo bom, senão duas
function linhasLegenda(itens, w, max) {
  const uma = itens.join("  ·  "), f = cabe(uma, w, max);
  if (f >= 38 || itens.length < 2) return { linhas: [uma], f };
  const meio = Math.ceil(itens.length / 2), l = [itens.slice(0, meio).join("  ·  "), itens.slice(meio).join("  ·  ")];
  return { linhas: l, f: Math.min(...l.map((t) => cabe(t, w, max * 0.85))) };
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const foto = (x, y, s) => {
    const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), { x, y, w: s, h: s }, 2, 70);
    const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
    const viz = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="${cor.filme.meio}" fill-opacity="0.18" stroke="${cor.filme.sombra}" stroke-width="1.1" stroke-dasharray="4 5" opacity="0.6"/>`).join("");
    const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="${cor.filme.luz}" fill-opacity="0.75" stroke="${cor.filme.sombra}" stroke-width="2.2" stroke-linejoin="round"/>`).join("");
    const pinos = afasta(story.shows.map((sh) => tela(cam, mundo(sh.lonlat)))).map(([a, b, ra, rb], i) => (Math.hypot(a - ra, b - rb) > 2
      ? `<circle cx="${f1(ra)}" cy="${f1(rb)}" r="5" fill="${cor.acento}"/><path d="M${f1(ra)},${f1(rb)} L${f1(a)},${f1(b)}" stroke="${cor.acento}" stroke-width="2.5"/>` : "") +
      pino(a, b, i + 1, p(T, 6.8 + i * 0.3, 0.35, pop), cor)).join("");
    return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.ceu}"/>${viz}${meus}${pinos}`;
  };
  const leg = linhasLegenda(story.shows.map((s, i) => `${i + 1}. ${s.cidade}`), 820 - 90, 54);
  const legenda = (x, y, w, h) => leg.linhas.map((l, i) => mao(0, y + h * (leg.linhas.length > 1 ? 0.42 + i * 0.36 : 0.6), l, leg.f, cor.tinta, { rot: -1 })).join("");
  const q = queda(T, 5.6, 1.5, 31, 0.5), fe = cabe(estado, 860, 96);
  return fundo(cor) + rotulo(540, 300, "o show é em", 50, cor, { rot: -2, sd: 2, op: p(T, 5.6, 0.3, enter) }).svg +
    rotulo(540, 430, estado, fe, cor, { rot: 1.5, sd: 6, op: p(T, 5.8, 0.3, enter) }).svg +
    polaroide({ cx: 540, cy: 1070 + q.dy, w: 820, rot: q.rot, alto: q.alto, op: q.op, cor, sd: 31, preso: "fita", revela: p(T, 5.8, 1.0, (x) => x), foto, legenda });
}

// posição das fotos por quantidade de shows (3 no máximo por banda e dia)
const ARRANJO = {
  1: [{ cx: 540, cy: 1010, w: 640, rot: -2 }],
  2: [{ cx: 280, cy: 960, w: 470, rot: -4 }, { cx: 800, cy: 1080, w: 470, rot: 3 }],
  3: [{ cx: 285, cy: 770, w: 440, rot: -4 }, { cx: 795, cy: 830, w: 440, rot: 4 }, { cx: 540, cy: 1385, w: 440, rot: -2 }],
};

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const arr = ARRANJO[Math.min(3, story.shows.length)] || ARRANJO[3];
  const fotos = story.shows.slice(0, 3).map((sh, i) => {
    const a = arr[i], at = 9.25 + i * 0.3, q = queda(T, at, a.rot, 41 + i), hh = hora(sh.hora) || "ver perfil";
    const linha2 = sh.casa || "detalhes no perfil da banda";
    const legenda = (x, y, w, h) => {
      const fc = cabe(sh.cidade, w - 70, w * 0.12), f2 = cabe(linha2, w - 80, w * 0.075), fh = Math.min(w * 0.13, cabe(hh, w * 0.5, 999));
      return rotulo(w * 0.22, y - fh * 0.9, hh, fh, cor, { rot: -5, sd: 50 + i }).svg +
        mao(0, y + h * 0.5, sh.cidade, fc, cor.tinta, { rot: -1.5 }) + mao(0, y + h * 0.86, linha2, f2, cor.tinta, { rot: -1.5, op: 0.85 });
    };
    const foto = (x, y, s) => desenho(NOMES[(i * 2 + 1) % NOMES.length], cor.filme)(x, y, s) +
      `<g transform="translate(${f1(x + s * 0.13)} ${f1(y + s * 0.13)})"><circle r="${f1(s * 0.075)}" fill="${cor.acento}" stroke="${cor.moldura}" stroke-width="3"/>${sans(0, s * 0.03, String(i + 1), s * 0.085, cor.moldura)}</g>`;
    return polaroide({ ...a, cy: a.cy + q.dy, rot: q.rot, alto: q.alto, op: q.op, cor, sd: 41 + i, preso: i % 2 ? "tacha" : "fita",
      revela: p(T, at + 0.2, 0.9, (x) => x), foto, legenda });
  }).join("");
  return fundo(cor) + rotulo(540, 300, "shows de hoje", 68, cor, { rot: -2, sd: 3, op: p(T, 9.1, 0.3, enter) }).svg + fotos;
}

const TOPO = [{ cx: 195, cy: 345, rot: -7, nome: "lua" }, { cx: 540, cy: 318, rot: 2, nome: "olho" }, { cx: 882, cy: 352, rot: 6, nome: "estrada" }];
export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const l = ["Compartilha", "com quem vai", "com você"], site = "somaisumfadepearljam.com.br/agenda";
  const topo = TOPO.map((t, i) => miuda(T, { ...t, w: 260, at: 12.52 + i * 0.1, sd: 61 + i, revela: [0.25, 0.9], preso: i === 1 ? "tacha" : null }, cor)).join("");
  const foto = (x, y, s) => { const f = Math.min(...l.map((t) => cabe(t, s - 100, 112)));
    return desenho("lua", cor.filme)(x, y, s) + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.sombra}" opacity="0.66"/>` +
      l.map((t, i) => mao(x + s / 2, y + s / 2 + (i - 1) * f * 1.18 + f * 0.36, t, f, cor.filme.luz, { rot: -2 })).join(""); };
  const legenda = (x, y, w, h) => mao(0, y + h * 0.62, "Siga @smufdpj", cabe("Siga @smufdpj", w - 120, 84), cor.tinta, { rot: -1.5 });
  const q = queda(T, 12.7, -1.5, 71, 0.5), fs = cabe(site, 860, 44, "sans");
  return fundo(cor) + topo + polaroide({ cx: 540, cy: 1065 + q.dy, w: 760, rot: q.rot, alto: q.alto, op: q.op, cor, sd: 71, preso: "fita",
    revela: p(T, 12.9, 0.9, (x) => x), foto, legenda }) + rotulo(540, 1655, site, fs, cor, { rot: -1.5, sd: 8, fonte: "sans", op: p(T, 13.5, 0.4, enter) }).svg;
}
