// Layout W, cenas 3 (o estado num quadro com retícula, pinos como balõezinhos numerados e a lista de cidades em
// recordatórios, 5.5 a 9) e 4 (tira de shows: um quadro por show, com desenho, cidade, hora e @casa, 9 a 12.5).
import { p, pop, enter } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { painel, balao, legenda, fundo, txt, reticula, f1, op3 } from "./pecas.mjs";
import { cabe, largura } from "./medida.mjs";
import { guitarra, onibus, ingresso } from "./desenhos.mjs";

export const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
const numero = (x, y, n, cor, r = 26) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${cor.vermelho}" stroke="${cor.linha}" stroke-width="4"/>` +
  txt(x, y + r * 0.4, String(n), r * 1.1, "#fff");

// posição de cada balão de pino: tenta direções em leque e fica com a primeira que não bate nos anteriores
const DIRS = [[0, -1], [-0.8, -0.7], [0.8, -0.7], [-1, 0], [1, 0], [-0.7, 0.8], [0.7, 0.8], [0, 1]];
function posicoes(pts, F) {
  const ok = [];
  for (const [a, b] of pts) {
    let melhor = null;
    for (const d of [110, 160]) for (const [dx, dy] of DIRS) {
      const c = [a + dx * d, b + dy * d];
      const dentro = c[0] > F.x + 50 && c[0] < F.x + F.w - 50 && c[1] > F.y + 50 && c[1] < F.y + F.h - 50;
      if (dentro && ok.every((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) > 100) && pts.every((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) > 64)) { melhor = c; break; }
      if (melhor) break;
    }
    ok.push(melhor || [a, b - 92]);
  }
  return ok;
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0]).toUpperCase();
  const F = { x: 70, y: 520, w: 940, h: 820 }, R = { x: F.x + 30, y: F.y + 30, w: F.w - 60, h: F.h - 60 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 90);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const k = p(T, 5.75, 0.9, enter), ret = reticula(cor.ponto, 14, 3.4, 0.5);
  const viz = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="${cor.painel2}" stroke="${cor.tracoMapa}" stroke-width="2" stroke-dasharray="2 7" opacity="0.6"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="${cor.piscina}" opacity="${op3(k)}"/><path d="${forma(uf)}" fill="${ret.url}" opacity="${op3(k)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.linha}" stroke-width="5" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"/>`).join("");
  const pts = story.shows.map((s) => tela(cam, mundo(s.lonlat))), pos = posicoes(pts, F);
  const pinos = story.shows.map((s, i) => { const kp = p(T, 6.6 + i * 0.3, 0.35, pop), [a, b] = pts[i], [c, d] = pos[i];
    return kp > 0 ? `<circle cx="${f1(a)}" cy="${f1(b)}" r="9" fill="${cor.vermelho}" stroke="${cor.linha}" stroke-width="3"/>` +
      balao(c, d, 84, 74, cor, { tx: a, ty: b, k: kp }) + (kp > 0.6 ? txt(c, d + 15, String(i + 1), 44, cor.linha) : "") : ""; }).join("");
  const kc = p(T, 5.6, 0.35, pop), fe = cabe(estado, 900, 110, "archivo", 2);
  const topo = legenda(90, 250, 520, 88, cor, cor.amarelo, txt(350, 308, "O SHOW É EM", 44, cor.linha, { ls: 2 }), -1.5) +
    (kc > 0 ? `<g opacity="${op3(kc)}">${txt(540, 455, estado, fe * Math.min(1, kc), cor.titulo, { ls: 2, contorno: [cor.linha, 11] })}</g>` : "");
  const lista = story.shows.map((s, i) => { const kl = p(T, 6.9 + i * 0.3, 0.35, enter), y = F.y + F.h + 50 + i * 84;
    const fc = cabe(s.cidade, 700, 46), w = Math.min(900, largura(s.cidade, fc) + 130);
    return kl > 0 ? `<g opacity="${op3(kl)}" transform="translate(${f1((1 - kl) * 40)} 0)">${legenda(90, y, w, 70, cor, cor.balao, txt(170, y + 35 + fc * 0.36, s.cidade, fc, cor.linha, { anchor: "start" }), 0)}${numero(126, y + 35, i + 1, cor, 22)}</g>` : ""; }).join("");
  return fundo(cor) + topo + painel(F.x, F.y, F.w, F.h, cor, { fill: cor.painel, pontos: [cor.painel2, 22, 2.4, 0.9], k: p(T, 5.5, 0.4, pop) },
    `${ret.def}${viz}${meus}${pinos}`) + lista;
}

const DESENHOS = [guitarra, onibus, ingresso];
export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, gap = 34, y0 = 540, h = Math.min(380, (1100 - (N - 1) * gap) / N), fills = [cor.amarelo, cor.piscina, cor.laranja];
  const kb = p(T, 9.0, 0.35, pop), tit = "SHOWS DE HOJE!", ft = cabe(tit, 640, 84);
  const topo = balao(540, 360, 820, 220, cor, { tx: 330, ty: 520, k: kb }) + (kb > 0.6 ? txt(540, 360 + ft * 0.36, tit, ft, cor.linha) : "");
  const tira = story.shows.map((sh, i) => {
    const k = p(T, 9.3 + i * 0.3, 0.4, pop), y = y0 + i * (h + gap), hh = hora(sh.hora) || "ver perfil", e = Math.min(1, h / 340);
    const casa = sh.casa ? `@${String(sh.casa).replace(/^@/, "")}` : "";
    const fc = cabe(sh.cidade, 580, 70 * e), fh = cabe(hh, 400, (sh.hora ? 84 : 54) * e), fk = cabe(casa, 580, 38 * e, "semi");
    const xt = 340, desenho = DESENHOS[i % 3](195, y + h / 2, Math.min(0.95, h / 300), cor, i % 3 === 1 ? 0 : undefined);
    const miolo = desenho + txt(xt, y + h * 0.33, sh.cidade, fc, cor.linha, { anchor: "start" }) +
      txt(xt, y + h * 0.33 + fc * 0.3 + fh * 1.1, hh, fh, sh.hora ? cor.vermelho : cor.linha, { anchor: "start", contorno: sh.hora ? [cor.balao, 6] : null }) +
      txt(xt, y + h - 34 * e, casa, fk, cor.linha, { anchor: "start", fonte: "semi" });
    return painel(70, y, 940, h, cor, { fill: fills[i % 3], pontos: [cor.ponto, 18, 3, 0.3], k, origem: i % 2 ? "r" : "l", rot: i % 2 ? 0.8 : -0.8 }, miolo) +
      (k >= 1 ? numero(78, y + 8, i + 1, cor, 30) : "");
  }).join("");
  return fundo(cor) + topo + tira;
}
