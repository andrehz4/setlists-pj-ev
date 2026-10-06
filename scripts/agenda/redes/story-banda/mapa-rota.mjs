// Cena 3, variação C (rota de turnê): uma estrada tracejada sai da cidade da banda e passa pelos shows do dia, com uma
// palheta andando na ponta e a quilometragem contando. MOTION-SPEC-banda, "Cena 3, variações B e C".
import { p, pop, enter, move, lerp, clamp } from "./tempo.mjs";
import { COR, esc, etiqueta, F_INTER_XB } from "./pecas.mjs";
import { mundo, caixaDe, enquadra, camera, tela, estados, grupoMapa, pino, onda, etiquetaCidade, naCena4, saindo, R3, R4 } from "./mapa-comum.mjs";

export const distanciaKm = ([lo1, la1], [lo2, la2]) => {
  const r = Math.PI / 180, a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
const origem = (story) => story.baseLonlat || story.shows[0].lonlat;

// pernas origem -> show 1 -> show 2 ...; menos de 5 km = mesma cidade (vira um laço em volta do pino)
export function pernas(story) {
  const N = story.shows.length, sp = N === 1 ? 0.75 : Math.min(0.6, 1.5 / N), dur = N === 1 ? 0.75 : 0.83 * sp;
  return story.shows.map((s, i) => {
    const km = distanciaKm(i ? story.shows[i - 1].lonlat : origem(story), s.lonlat), t0 = 7.15 + i * sp;
    return { i, km, laco: km < 5, t0, dur, pouso: t0 + dur + 0.34 };
  });
}
// estrada total em linha reta (laços não contam)
export const kmDaRota = (story) => pernas(story).reduce((a, l) => a + (l.laco ? 0 : l.km), 0);

function amostras(A, B, l, R) {
  if (l.laco) return Array.from({ length: 41 }, (_, k) => { const th = Math.PI * 0.75 + (k / 40) * Math.PI * 1.8; return [B[0] + (R + 30) * Math.cos(th), B[1] + (R + 30) * Math.sin(th)]; });
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, sg = l.i % 2 ? -1 : 1;
  const C = [(A[0] + B[0]) / 2 - ((B[1] - A[1]) / L) * 0.18 * L * sg, (A[1] + B[1]) / 2 + ((B[0] - A[0]) / L) * 0.18 * L * sg];
  return Array.from({ length: 33 }, (_, k) => { const t = k / 32, u = 1 - t; return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]; });
}
function parcial(q, f) {
  const x = f * (q.length - 1), i = Math.floor(x), out = q.slice(0, i + 1);
  if (i < q.length - 1) out.push([lerp(q[i][0], q[i + 1][0], x - i), lerp(q[i][1], q[i + 1][1], x - i)]);
  return out;
}

function estrada(T, q, l, k, cor) {
  const f = p(T, l.t0, l.dur, move);
  if (f <= 0) return "";
  const r = parcial(q, f), d = `M${r.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}`, e = r.at(-1), e0 = r[Math.max(0, r.length - 2)];
  const palheta = 1 - p(T, l.t0 + l.dur, 0.2, enter), ang = (Math.atan2(e[1] - e0[1], e[0] - e0[0]) * 180) / Math.PI;
  return `<path d="${d}" fill="none" stroke="${COR.tinta}" stroke-width="${14 * k}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${COR.creme}" stroke-width="${5 * k}" stroke-dasharray="${16 * k} ${12 * k}"/>
  ${palheta > 0 ? `<g opacity="${palheta.toFixed(3)}" transform="translate(${e[0].toFixed(1)} ${e[1].toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M22 0C14 14-8 20-16 12C-22 6-22-6-16-12C-8-20 14-14 22 0Z" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="4"/></g>` : ""}`;
}

export function mapaRota(T, story, cor) {
  const base = origem(story), ls = pernas(story), N = story.shows.length;
  const caixa = caixaDe([...story.shows.map((s) => mundo(s.lonlat)), mundo(base)]);
  const cam = camera(T, enquadra(caixa, R3, 2.25, 140), enquadra(caixa, R4, 3, 50));
  const c4 = naCena4(T), R = lerp(40, 26, c4), k = lerp(1, 0.6, c4), sai = saindo(T);
  const P = story.shows.map((s) => tela(cam, mundo(s.lonlat))), O = tela(cam, mundo(base));
  const ufBase = (story.cidadeBase || "").split("/")[1];
  const acende = Object.fromEntries([...(ufBase ? [[ufBase, p(T, 6.95, 0.3, enter)]] : []), ...story.shows.map((s, i) => [s.uf, p(T, ls[i].pouso, 0.3, enter)])]
    .reduce((m, [u, v]) => m.set(u, Math.max(m.get(u) || 0, v)), new Map()));
  const ruas = ls.map((l) => estrada(T, amostras(l.i ? P[l.i - 1] : O, P[l.i], l, R), l, k, cor)).join("");
  const ob = p(T, 6.95, 0.3, pop);
  const marco = ob > 0 ? `<g transform="translate(${O[0].toFixed(1)} ${O[1].toFixed(1)}) scale(${(ob * lerp(1, 0.6, c4)).toFixed(3)})"><circle r="14" fill="${COR.creme}" stroke="${COR.tinta}" stroke-width="6"/></g>` : "";
  const pinos = story.shows.map((s, i) => {
    const drop = ls[i].pouso - 0.34;
    if (T < drop) return "";
    const [x, y0] = P[i], y = y0 - 170 * (1 - p(T, drop, 0.34, pop));
    return onda(T, x, y0, R, ls[i].pouso) + pino(T, { x, y, R, i, N, cor }) + etiquetaCidade(T, x, y0, R, s.cidade, ls[i].pouso);
  }).join("");
  // "saída · Cidade" embaixo do marco (mais abaixo se um pino estiver em cima dele)
  const nome = (story.cidadeBase || "").split("/")[0], op = p(T, 6.95, 0.12, enter) * (1 - sai);
  let saida = "";
  if (nome && op > 0) {
    const txt = `saída · ${nome}`, w = txt.length * 0.6 * 30 + 24, perto = P.some((q) => Math.hypot(q[0] - O[0], q[1] - O[1]) < 70);
    const x = clamp(O[0] - w / 2, 60, 1020 - w), y = O[1] + (perto ? 86 : 30);
    saida = `<g opacity="${op.toFixed(3)}"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="46" fill="${COR.tinta}"/>
    <text x="${(x + 12).toFixed(1)}" y="${(y + 33).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${COR.creme}">${esc(txt)}</text></g>`;
  }
  // quilometragem contando junto com o desenho da estrada (sem etiqueta se for tudo na mesma cidade)
  const total = kmDaRota(story), alvo = total >= 5 ? Math.max(10, Math.round(total / 10) * 10) : 0;
  const agora = ls.reduce((a, l) => a + (l.laco ? 0 : l.km * p(T, l.t0, l.dur, move)), 0);
  const km = alvo && sai < 1 ? `<g opacity="${(1 - sai).toFixed(3)}">${etiqueta(T, { texto: `${Math.min(alvo, Math.max(10, Math.round(agora / 10) * 10))} KM DE ESTRADA`,
    x: 60, y: 1530, f: 64, fundo: cor.strip, cor: COR.creme, rot: -2, at: ls[0].t0 })}</g>` : "";
  return grupoMapa(T, estados(cam, cor, (uf) => 0.2 + 0.55 * (acende[uf] || 0)) + ruas + marco + pinos + saida) + km;
}
