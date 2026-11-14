// Layout S, cena 3 (5.5 a 9): mapa rodoviário de papel que desdobra em 3 gomos por cima da estrada parada. Placa
// verde no topo diz o estado; no mapa, estados vizinhos em traço fino, o do show pintado, a rodovia vermelha com
// casco branco riscada até os pinos numerados, rosa dos ventos, escala e legenda das cidades.
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs, centroUf } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { placa, texto, cabe, grao, novoId, f1, rnd } from "./pecas.mjs";
import { paisagem } from "./estrada.mjs";

const P = { x: 70, y: 540, w: 940 }, R = { x: P.x + 40, y: P.y + 40, w: P.w - 80, h: 740 };
// altura da legenda e do papel (cresce com o número de shows)
const altLeg = (N) => 100 + N * 68;
const altPapel = (N) => R.y - P.y + R.h + 34 + altLeg(N) + 40;
const lonlat = (s) => s.lonlat || centroUf(s.uf);

// curva suave que passa pelos pontos (quadráticas pelos pontos médios)
function suave(pts) {
  if (pts.length < 3) return `M${pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join(" L")}`;
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, e] = pts[i + 1]; d += ` Q${f1(a)},${f1(b)} ${f1((a + c) / 2)},${f1((b + e) / 2)}`; }
  const [a, b] = pts.at(-1);
  return `${d} L${f1(a)},${f1(b)}`;
}

// alfinete de mapa com o número
const alfinete = (x, y, n, cor, k) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})">
  <ellipse cx="4" cy="2" rx="14" ry="5" fill="#000" opacity="0.3"/>
  <path d="M0,0 C-10,-16 -26,-30 -26,-52 A26,26 0 1 1 26,-52 C26,-30 10,-16 0,0 Z" fill="${cor.rodovia}" stroke="#fff" stroke-width="3"/>
  <circle cx="0" cy="-52" r="17" fill="#fff"/>${texto(0, -43, String(n), 25, cor.rodovia)}</g>`;

function mapaDoEstado(T, story, cor) {
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 60);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const cl = novoId("sx"), kr = p(T, 6.2, 1.1, enter);
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="${cor.terra}" stroke="${cor.tinta}" stroke-width="1.2" opacity="0.6"/>`).join("");
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="${cor.ufCor}" stroke="${cor.tinta}" stroke-width="2.6" stroke-linejoin="round"/>`).join("");
  const pts = story.shows.map((s) => tela(cam, mundo(lonlat(s))));
  // a rodovia entra pela borda esquerda, faz uma curva e passa pelos pinos na ordem dos shows
  const ini = [R.x - 20, R.y + R.h * 0.8], [ax, ay] = pts[0], meio = [(ini[0] + ax) / 2, (ini[1] + ay) / 2 + 60];
  const rota = suave([ini, meio, ...pts]);
  const desl = afastar(pts.map(([a, b]) => [a, b - 52]), 30, R);
  const pinos = pts.map(([a, b], i) => { const k = p(T, 6.9 + i * 0.3, 0.4, pop), [dx, dy] = desl[i];
    return k > 0 ? `<circle cx="${f1(a)}" cy="${f1(b)}" r="6" fill="${cor.rodovia}" stroke="#fff" stroke-width="2"/>${Math.hypot(dx, dy) > 4 ? `<path d="M${f1(a)},${f1(b)} L${f1(a + dx)},${f1(b + dy)}" stroke="${cor.tinta}" stroke-width="2"/>` : ""}` + alfinete(a + dx, b + dy, i + 1, cor, k) : ""; }).join("");
  const nx = R.x + R.w - 70, ny = R.y + 90;
  const norte = `<g transform="translate(${nx} ${ny})"><circle r="40" fill="${cor.papel}" stroke="${cor.tinta}" stroke-width="1.5" opacity="0.95"/>
    <path d="M0,-32 L11,6 L0,0 Z" fill="${cor.tinta}"/><path d="M0,-32 L-11,6 L0,0 Z" fill="none" stroke="${cor.tinta}" stroke-width="1.5"/>${texto(0, 30, "N", 20, cor.tinta)}</g>`;
  const ex = R.x + 30, ey = R.y + R.h - 34;
  const escala = `<g><rect x="${ex}" y="${ey}" width="80" height="10" fill="${cor.tinta}"/><rect x="${ex + 80}" y="${ey}" width="80" height="10" fill="${cor.papel}" stroke="${cor.tinta}" stroke-width="1.5"/>
    ${texto(ex, ey - 10, "0", 20, cor.tinta, { fonte: "b", anchor: "start" })}${texto(ex + 160, ey - 10, "50 km", 20, cor.tinta, { fonte: "b", anchor: "end" })}</g>`;
  return `<clipPath id="${cl}"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}"/></clipPath>
    <rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="#cfe3ee"/>
    <g clip-path="url(#${cl})">${vizinhos}${meus}<path d="${rota}" fill="none" stroke="${cor.casco}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - kr)}"/>
      <path d="${rota}" fill="none" stroke="${cor.rodovia}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - kr)}"/>
      ${pinos}${norte}${escala}</g>
    <rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="none" stroke="${cor.tinta}" stroke-width="2.5"/>`;
}

// legenda: uma linha por cidade com o número no círculo vermelho
function legenda(T, story, cor) {
  const y0 = R.y + R.h + 34, N = story.shows.length, k = p(T, 6.6, 0.5, enter);
  const linhas = story.shows.map((s, i) => { const y = y0 + 120 + i * 68, t = `${s.cidade}/${s.uf}`;
    return `<circle cx="${R.x + 52}" cy="${y - 16}" r="22" fill="${cor.rodovia}"/>${texto(R.x + 52, y - 6, String(i + 1), 26, "#fff")}
      ${texto(R.x + 96, y, t, cabe(t, R.w - 130, 46, "b"), cor.tinta, { fonte: "b", anchor: "start" })}`; }).join("");
  return `<g opacity="${k.toFixed(3)}"><rect x="${R.x}" y="${y0}" width="${R.w}" height="${altLeg(N)}" fill="#fff" opacity="0.55" stroke="${cor.tinta}" stroke-width="1.5"/>
    ${texto(R.x + 28, y0 + 50, "LEGENDA", 26, cor.tinta, { anchor: "start", ls: 5 })}<rect x="${R.x + 28}" y="${y0 + 64}" width="${R.w - 56}" height="2" fill="${cor.tinta}" opacity="0.6"/>${linhas}</g>`;
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  // papel desdobrando: os gomos dos lados aparecem a partir do gomo do meio
  const ku = p(T, 5.55, 0.6, enter), sx = lerp(1 / 3, 1, ku), sh = novoId("sd"), H = altPapel(story.shows.length);
  const gomos = [0, 1, 2].map((i) => `<rect x="${f1(P.x + (i * P.w) / 3)}" y="${P.y}" width="${f1(P.w / 3)}" height="${H}" fill="url(#${sh}${i % 2})"/>`).join("");
  const papel = `<linearGradient id="${sh}0" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0.1"/></linearGradient>
    <linearGradient id="${sh}1" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.14"/></linearGradient>
    <rect x="${P.x + 14}" y="${P.y + 20}" width="${P.w}" height="${H}" fill="#000" opacity="0.35"/><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${H}" fill="${cor.papel}"/>
    ${mapaDoEstado(T, story, cor)}${legenda(T, story, cor)}${gomos}
    <path d="M${P.x},${P.y + H / 2} H${P.x + P.w}" stroke="#000" stroke-width="1.5" opacity="0.15"/>${grao(cor.tinta, 0.12, P.x, P.y, P.w, H)}`;
  const kp = p(T, 5.7, 0.45, pop), fe = cabe(estado, 760, 96);
  const topo = `<g transform="translate(0 ${f1((1 - kp) * -400)})">${placa({ x: 110, y: 250, w: 860, h: 250, cor }, texto(540, 330, "O SHOW É EM", 44, cor.branco, { ls: 6 }) +
    `<rect x="190" y="352" width="700" height="4" rx="2" fill="${cor.branco}"/>` + texto(540, 352 + 44 + fe * 0.74, estado, fe, cor.branco))}</g>`;
  return paisagem(T, cor, { hz: 1500, vel: 0 }) + `<rect width="1080" height="1920" fill="#000" opacity="0.28"/>` +
    `<clipPath id="${sh}c"><rect x="${f1(540 - (P.w / 2 + 20) * sx)}" y="0" width="${f1((P.w + 40) * sx)}" height="1920"/></clipPath><g clip-path="url(#${sh}c)">${papel}</g>` + topo;
}
