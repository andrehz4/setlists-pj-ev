// Layout U, cenas 3 (mapa do estado em papel quadriculado preso com clipe, pinos circulados à caneta, 5.5 a 9),
// 4 (relação datilografada, uma linha por show e um carimbo CONFIRMADO ou VER PERFIL em cada, 9 a 12.5) e 5 (carimbo
// grande com o pedido de compartilhar, siga, link e assinatura rabiscada, 12.5 a 15).
import { p } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { maquina, rotulo, folha, cabecalho, cabeMaq, batidas, grao, novoId, f1, FL, MX, MW } from "./pecas.mjs";
import { fundo } from "./fundo.mjs";
import { carimbo, carimboRedondo, alturaCarimbo, clipe, circuloCaneta, assinatura } from "./objetos.mjs";
import { caneta } from "./cenas-capa.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}H${b || "00"}`) : "");
const AUTO = "AGENDA DE SHOWS";

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase(), fe = cabeMaq(estado, MW, 84);
  const N = story.shows.length, M = { x: 180, y: FL.y + 440, w: 720, h: 760 - (N - 1) * 40 }, R = { x: M.x + 30, y: M.y + 30, w: M.w - 60, h: M.h - 60 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 60);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const km = p(T, 6.0, 0.45), kd = p(T, 6.2, 1.0), hac = novoId("uh"), cl = novoId("ui"), qd = novoId("uq");
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.tinta}" stroke-width="1.2" stroke-dasharray="4 6" opacity="0.4"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="url(#${hac})" opacity="${(0.8 * kd).toFixed(3)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.tinta}" stroke-width="2.4" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - kd)}"/>`).join("");
  const xy = story.shows.map((s) => tela(cam, mundo(s.lonlat))), cx = xy.reduce((t, q) => t + q[0], 0) / xy.length, cy = xy.reduce((t, q) => t + q[1], 0) / xy.length;
  const pinos = story.shows.map((s, i) => {
    const [a, b] = tela(cam, mundo(s.lonlat)), k = p(T, 6.9 + i * 0.35, 0.4);
    // número fora do aglomerado: na direção oposta ao centro dos pinos
    const dx = a - cx, dy = b - cy, d = Math.hypot(dx, dy), ux = d > 4 ? dx / d : [-0.7, 0.7, 0][i % 3], uy = d > 4 ? dy / d : [-0.7, -0.7, 1][i % 3];
    return circuloCaneta(a, b, 22, k, cor, 3 + i * 5) + (k > 0.6 ? caneta(a + ux * 52, b + uy * 52 + 18, String(i + 1), 50, cor, 1, "middle") : "");
  }).join("");
  // folha quadriculada do mapa: entra por cima da ficha e leva o clipe
  const mapa = km > 0 ? `<g transform="translate(0 ${f1((1 - km) * 900)}) rotate(-1.4 540 ${M.y + M.h / 2})">
    <pattern id="${qd}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24,0 V24 H0" fill="none" stroke="${cor.quadro}" stroke-width="1" opacity="0.55"/></pattern>
    <pattern id="${hac}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0,0 V8" stroke="${cor.tinta}" stroke-width="1.1" opacity="0.5"/></pattern>
    <clipPath id="${cl}"><rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h}"/></clipPath>
    <rect x="${M.x + 8}" y="${M.y + 14}" width="${M.w}" height="${M.h}" fill="#000" opacity="0.25"/><rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h}" fill="${cor.foto}"/>
    <rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h}" fill="url(#${qd})"/>${grao(cor.mancha, 0.15, M)}
    <g clip-path="url(#${cl})">${vizinhos}${meus}${pinos}</g>${clipe(M.x + M.w - 130, M.y + 40, 4, cor)}</g>` : "";
  const ylist = M.y + M.h + 90, fl = Math.min(...story.shows.map((s, i) => cabeMaq(`${i + 1}. ${s.cidade}/${s.uf}`, MW, 38)));
  const lista = story.shows.map((s, i) => maquina(MX, ylist + i * fl * 1.45, `${i + 1}. ${s.cidade.toUpperCase()}/${s.uf}`, fl, cor, { n: batidas(T, 7.0 + i * 0.35, 0.02), seed: 80 + i })).join("");
  const miolo = () => cabecalho(cor, "LOCAL DA OCORRÊNCIA", AUTO) + maquina(MX, FL.y + 190, "O SHOW É EM", 46, cor, { n: batidas(T, 5.8, 0.03), seed: 31 }) +
    maquina(MX, FL.y + 200 + fe * 1.15, estado, fe, cor, { n: batidas(T, 6.1, 0.03), seed: 33 }) + mapa + lista;
  return fundo(T, cor) + folha(T, { rot: 0.7, at: 5.5, cor, seed: 12, miolo });
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, e = 3 - Math.min(3, N), y0 = FL.y + 330, alto = Math.min(380 + e * 40, (FL.h - 390) / N);
  // corpo das linhas de hora e local igual em todos os shows (o menor que cabe na largura)
  const F2 = Math.min(...story.shows.flatMap((sh) => [`HORA: ${hora(sh.hora) || "A CONFIRMAR"}`, `LOCAL: ${sh.casa || "NO PERFIL DA BANDA"}`].map((t) => cabeMaq(t, MW, 38 + e * 5))));
  const itens = story.shows.map((sh, i) => {
    const y = y0 + i * alto, at = 9.5 + i * 0.6, hh = hora(sh.hora), cid = `${String(i + 1).padStart(2, "0")}. ${sh.cidade.toUpperCase()}`;
    const fc = cabeMaq(cid, MW, 54 + e * 12), l2 = `HORA: ${hh || "A CONFIRMAR"}`, l3 = `LOCAL: ${sh.casa || "NO PERFIL DA BANDA"}`;
    const f2 = F2, sel = hh ? ["CONFIRMADO"] : ["VER PERFIL"], cw = 250 + e * 30, ch = alturaCarimbo(sel, cw, 48);
    return maquina(MX, y + fc, cid, fc, cor, { n: batidas(T, at, 0.018), seed: 90 + i }) +
      maquina(MX, y + fc + 30 + f2 * 1.2, l2, f2, cor, { n: batidas(T, at + 0.2, 0.015), seed: 95 + i }) +
      maquina(MX, y + fc + 30 + f2 * 2.7, l3, f2, cor, { n: batidas(T, at + 0.3, 0.012), seed: 99 + i }) +
      // carimbo embaixo da linha do local, encostado à direita (não cobre texto)
      carimbo(T, { cx: MX + MW - cw / 2 - 14, cy: y + fc + 52 + f2 * 2.7 + ch / 2, w: cw, linhas: sel, at: at + 0.45, rot: i % 2 ? 4 : -5, cor, fMax: 48, seed: 30 + i }) +
      (i < N - 1 ? `<path d="M${MX},${f1(y + alto - 34)} H${MX + MW}" stroke="${cor.tinta}" stroke-width="2" stroke-dasharray="10 9" opacity="0.4"/>` : "");
  }).join("");
  // com sobra de folha (1 ou 2 shows), recado à caneta embaixo
  const yn = y0 + N * alto + 40, kn = p(T, 11.2, 0.5);
  const nota = yn + 60 < FL.y + FL.h - 80 ? caneta(MX + 20, yn + 40, "não perca!", 72, cor, kn) +
    `<path d="M${MX + 20},${yn + 62} q140,14 ${f1(330 * kn)},-6" fill="none" stroke="${cor.caneta}" stroke-width="2.8" stroke-linecap="round"/>` : "";
  const miolo = () => cabecalho(cor, "RELAÇÃO DE SHOWS", AUTO) + rotulo(MX, FL.y + 200, "ASSUNTO", 21, cor.tinta) +
    maquina(MX, FL.y + 262, "SHOWS DE HOJE", 66, cor, { n: batidas(T, 9.2, 0.03), seed: 41 }) + itens + nota;
  return fundo(T, cor) + folha(T, { rot: -0.6, at: 9.0, cor, seed: 15, miolo });
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda", l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];
  const h = alturaCarimbo(l, 700, 120, 5), cy = FL.y + 190 + h / 2, ys = cy + h / 2 + 230, fsite = cabeMaq(site, MW, 40);
  const miolo = () => cabecalho(cor, "DESPACHO", AUTO) + carimbo(T, { cx: 540, cy, w: 700, linhas: l, at: 12.6, rot: -4, cor, fMax: 120, ls: 5, seed: 9, op: 0.92 }) +
    rotulo(MX, ys - 80, "ENCAMINHE-SE", 21, cor.tinta) + maquina(MX, ys, "SIGA @SMUFDPJ", cabeMaq("SIGA @SMUFDPJ", MW, 70), cor, { n: batidas(T, 13.0, 0.03), seed: 51 }) +
    maquina(MX, ys + 90, site, fsite, cor, { n: batidas(T, 13.25, 0.012), seed: 53 }) +
    assinatura(MX + 30, ys + 390, 1.05, p(T, 13.6, 0.8), cor) +
    `<path d="M${MX},${ys + 500} H${MX + 500}" stroke="${cor.tinta}" stroke-width="1.4" opacity="0.7"/>` + rotulo(MX, ys + 536, "O RESPONSÁVEL", 20, cor.tinta) +
    carimboRedondo(T, { cx: MX + MW - 100, cy: ys + 235, r: 100, cima: "AGENDA", meio: "SMUFDPJ", at: 14.1, cor });
  return fundo(T, cor) + folha(T, { rot: 0.5, at: 12.5, cor, seed: 18, miolo });
}
