// Layout L, cenas 3 (encarte desdobra com o mapa do estado: 5.5 a 9), 4 (LADO A, os shows como faixas, com o contador
// rodando: 9 a 12.5) e 5 (rebobina e pede pra compartilhar: 12.5 a 15).
import { p, pop, move, lerp, clamp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { fita, botoes, contador, escreve, escrito, fundo, entra, hora, esc, cabeI, novoId, F_MARKER, F_INTER, F_INTER_XB } from "./pecas.mjs";

export function cenaEstado(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], X = 90, Y = 330, W = 900, H = 1240;
  const abre = p(T, 5.55, 0.7, move), w = lerp(W / 3, W, abre);
  const R = { x: X + 50, y: Y + 60, w: W - 100, h: 820 };
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 40), id = novoId("lm"), idR = novoId("lr");
  const est = Object.entries(ufs()).map(([uf, polys]) => { const dela = ufsShow.includes(uf);
    return `<path d="${caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))))}" fill="${dela ? cor.faixa : cor.tinta}" fill-opacity="${dela ? 0.9 : 0.12}" stroke="${cor.papel}" stroke-width="3"/>`; }).join("");
  const pinos = story.shows.map((s, i) => { const [a, b] = tela(cam, mundo(s.lonlat)), k = p(T, 6.5 + i * 0.3, 0.35, pop);
    return k > 0 ? `<g transform="translate(${a.toFixed(1)} ${b.toFixed(1)}) scale(${k.toFixed(3)})"><path d="M-30,-30 L30,30 M30,-30 L-30,30" stroke="${cor.acento}" stroke-width="16" stroke-linecap="round"/></g>` : ""; }).join("");
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const tit = escreve(`O show é em ${estado}`, W - 100, 150, 76, 40);
  const cidades = story.shows.map((s) => s.cidade).join(", ");
  const yT = R.y + R.h + 40 + tit.f;
  const dobras = [1, 2].map((i) => `<line x1="${X + (W / 3) * i}" y1="${Y}" x2="${X + (W / 3) * i}" y2="${Y + H}" stroke="${cor.tinta}" stroke-opacity="0.18" stroke-width="3" stroke-dasharray="14 12"/>`).join("");
  const papel = `<clipPath id="${id}"><rect x="${X}" y="${Y}" width="${w.toFixed(1)}" height="${H}"/></clipPath>
    <rect x="${X + 16}" y="${Y + 20}" width="${w.toFixed(1)}" height="${H}" fill="#000" opacity="0.25"/>
    <g clip-path="url(#${id})"><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${cor.papel}"/>${dobras}
      <clipPath id="${idR}"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" rx="12"/></clipPath><g opacity="${clamp((abre - 0.6) / 0.4).toFixed(3)}"><g clip-path="url(#${idR})">${est}</g>${pinos}</g>
      ${escrito(T, 6.3, 0.4, tit.linhas, { x: X + 50, y: yT, f: tit.f, fill: cor.tinta, ancora: "start" })}
      <text x="${X + 50}" y="${(yT + (tit.linhas.length - 1) * tit.f * 1.12 + 70).toFixed(1)}" font-family="${F_INTER}" font-size="${cabeI(cidades, W - 100, 44).toFixed(1)}" fill="${cor.tinta}" opacity="${entra(T, 7.0).toFixed(3)}">${esc(cidades)}</text></g>`;
  const cabeca = `<text x="90" y="290" font-family="${F_MARKER}" font-size="54" fill="${cor.texto}" opacity="${entra(T, 5.6).toFixed(3)}">abre o encarte</text>`;
  return fundo(cor) + cabeca + papel + `<rect x="0" y="${lerp(1920, 0, p(T, 8.7, 0.3, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}

export function cenaLadoA(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, k = p(T, 9.0, 0.45, pop);
  const cassete = fita({ x: 220, y: lerp(80, 230, k), w: 640, cor, ang: (T - 9) * 230, fluxo: 0.15 + (T - 9) * 0.06, op: Math.min(1, k * 2),
    topo: (a) => { const n = escreve(story.banda, a.w, a.h, 92, 40);
      return escrito(T, 0, 0.01, n.linhas, { x: a.x + a.w / 2, y: a.y + (a.h - n.linhas.length * n.f * 1.12) / 2 + n.f * 0.95, f: n.f, fill: cor.tinta }); },
    base: (a) => `<text x="${a.x + a.w / 2}" y="${a.y + 36}" text-anchor="middle" font-family="${F_MARKER}" font-size="38" fill="${cor.tinta}">LADO A</text>` });
  const X = 90, Y = 800, W = 900, alto = Math.min(230, 640 / N), H = 170 + N * alto + 40;
  const faixas = story.shows.map((sh, i) => {
    const y = Y + 170 + i * alto, s = Math.min(1.15, alto / 200), op = entra(T, 9.5 + i * 0.35);
    const cid = sh.cidade, fc = Math.min(70 * s, (W - 220) / (cid.length * 0.62));
    const sub = [sh.casa || "horário no perfil da banda", hora(sh.hora)].filter(Boolean).join(" · ");
    return `<line x1="${X + 40}" y1="${y + alto - 10}" x2="${X + W - 40}" y2="${y + alto - 10}" stroke="${cor.tinta}" stroke-opacity="0.15" stroke-width="3"/>
      <text x="${X + 40}" y="${(y + 80 * s).toFixed(1)}" font-family="${F_MARKER}" font-size="${(70 * s).toFixed(1)}" fill="${cor.faixa}" opacity="${op.toFixed(3)}">${i + 1}.</text>
      ${escrito(T, 9.5 + i * 0.35, 0.35, [cid], { x: X + 150, y: y + 80 * s, f: fc, fill: cor.tinta, ancora: "start" })}
      <text x="${X + 150}" y="${(y + 80 * s + 62 * s).toFixed(1)}" font-family="${F_INTER}" font-size="${cabeI(sub, W - 200, 40 * s).toFixed(1)}" fill="${cor.tinta}" fill-opacity="0.7" opacity="${op.toFixed(3)}">${esc(sub)}</text>`;
  }).join("");
  const kp = p(T, 9.2, 0.45, pop);
  const papel = `<g opacity="${Math.min(1, kp * 2).toFixed(3)}" transform="translate(0 ${lerp(90, 0, kp).toFixed(1)})">
    <rect x="${X + 16}" y="${Y + 20}" width="${W}" height="${H}" fill="#000" opacity="0.25"/><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${cor.papel}"/>
    <rect x="${X}" y="${Y}" width="${W}" height="24" fill="${cor.faixa}"/>
    <text x="${X + 40}" y="${Y + 120}" font-family="${F_MARKER}" font-size="80" fill="${cor.tinta}">LADO A</text>
    <text x="${X + W - 40}" y="${Y + 120}" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="${cor.tinta}" fill-opacity="0.55">SHOWS DE HOJE</text>${faixas}</g>`;
  return fundo(cor) + cassete + contador(540, 660, 120 + (T - 9) * 41, cor) + papel;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const titulo = ["Compartilha", "com quem vai", "com você"].map((l, i) => {
    const f = Math.min(124, 960 / (l.length * 0.62));
    return escrito(T, 12.55 + i * 0.22, 0.25, [l], { x: 540, y: 430 + i * 150, f, fill: i === 0 ? cor.acento : cor.texto });
  }).join("");
  const reb = clamp((T - 12.6) / 1.7), parado = T >= 14.3;
  const ang = -Math.pow(reb, 0.7) * 1700, fluxo = 0.75 * (1 - reb);
  const kf = p(T, 12.6, 0.4, pop);
  const cassete = fita({ x: 160, y: 890, w: 760, cor, ang, fluxo, op: Math.min(1, kf * 2),
    topo: (a) => escrito(T, 13.2, 0.4, ["Siga @smufdpj"], { x: a.x + a.w / 2, y: a.y + 112, f: 92, fill: cor.tinta }),
    base: (a) => `<text x="${a.x + a.w / 2}" y="${a.y + 34}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${cor.tinta}">${parado ? "PRONTA PRA OUTRA" : "REBOBINANDO"}</text>` });
  const site = "somaisumfadepearljam.com.br/agenda";
  const kb = p(T, 12.8, 0.35, pop);
  return fundo(cor) + titulo + cassete +
    (kb > 0 ? `<g opacity="${Math.min(1, kb * 2).toFixed(3)}">${botoes({ cx: 540, y: 1410, w: 700, cor, apertado: parado ? "stop" : "rew" })}</g>` : "") +
    `<text x="540" y="1660" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="${cabeI(site, 920, 46).toFixed(1)}" fill="${cor.texto}" opacity="${entra(T, 13.6).toFixed(3)}">${esc(site)}</text>`;
}

