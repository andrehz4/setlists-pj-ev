// Cena 3, variação B (papel recortado): o estado do show vira um recorte de papel colado com fita, a cidade ganha um
// círculo à caneta e o nome escrito à mão. MOTION-SPEC-banda, "Cena 3, variações B e C".
import { ufs } from "../mapa.mjs";
import { p, pop, enter, move, lerp, clamp } from "./tempo.mjs";
import { COR, esc } from "./pecas.mjs";
import { logoQueViraPino } from "./viajante.mjs";
import { mundo, caixaDe, enquadra, camera, tela, caminho, estados, grupoMapa, pino, naCena4, saindo, afastar, R3, R4 } from "./mapa-comum.mjs";

const F_MAO = "'Permanent Marker',cursive", MAO_F = 52;
// largura por caractere da letra à mão: o spec estima 0.58, mas no render real o nome longo passava e era cortado
const MAO_EM = 0.66;
const DASH = "10 3 6 5 14 2 7 4 4 6 12 3", FITA = "#d6c69c";

// círculo à caneta: volta e pouco, raio ondulado por fórmula (nada aleatório), sd muda o traço de cada show
export function caneta(cx, cy, r, sd) {
  const q = [];
  let len = 0;
  for (let k = 0; k <= 56; k++) {
    const u = k / 56, th = -2.3 + sd * 1.7 + Math.PI * 2 * 1.12 * u;
    const rr = r * (1 + 0.05 * Math.sin(3 * th + sd * 2) + 0.03 * Math.sin(5 * th + sd)) * (0.97 + 0.08 * u);
    q.push([cx + rr * 1.1 * Math.cos(th), cy + rr * 0.92 * Math.sin(th)]);
    if (k) len += Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]);
  }
  return { d: `M${q.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}`, len };
}

// recorte de um estado: sombra, papel, borda irregular (tracejado grosso da cor do papel) e duas fitas
function recorte(T, cam, uf) {
  const pa = p(T, 7.1, 0.4, pop), po = p(T, 7.1, 0.12, enter);
  if (po <= 0) return "";
  const polys = ufs()[uf].map((poly) => poly.map((q) => tela(cam, mundo(q)))), todos = polys.flat();
  const [x0, y0, x1, y1] = caixaDe(todos), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sobe = 40 * (1 - pa), d = caminho(polys);
  const papel = `<g opacity="${po.toFixed(3)}" transform="translate(${cx.toFixed(1)} ${(cy - sobe).toFixed(1)}) scale(${lerp(1.08, 1, pa).toFixed(4)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})">
  <path d="${d}" transform="translate(${lerp(16, 5, pa).toFixed(1)} ${lerp(22, 7, pa).toFixed(1)})" fill="${COR.tinta}" fill-opacity="0.35" stroke="${COR.tinta}" stroke-opacity="0.35" stroke-width="6" stroke-linejoin="round"/>
  <path d="${d}" fill="${COR.papel}" stroke="${COR.papel}" stroke-width="6" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${COR.papel}" stroke-width="14" stroke-dasharray="${DASH}"/></g>`;
  const fita = p(T, 7.4, 0.25, pop);
  if (fita <= 0) return papel;
  const k = lerp(1, 0.55, naCena4(T)) * lerp(1.4, 1, fita);
  const canto = (f) => todos.reduce((b, q) => (f(q) < f(b) ? q : b), todos[0]);
  const fitas = [[canto((q) => q[0] + q[1]), -38], [canto((q) => q[1] - q[0]), 36]].map(([q, rot]) =>
    `<g opacity="${Math.min(1, 1.5 * fita).toFixed(3)}" transform="translate(${q[0].toFixed(1)} ${(q[1] - sobe).toFixed(1)}) rotate(${rot}) scale(${k.toFixed(3)})"><rect x="-62" y="-19" width="124" height="38" fill="${FITA}" fill-opacity="0.9"/></g>`).join("");
  return papel + fitas;
}

// nome da cidade à mão, ao lado do círculo (direita, esquerda ou embaixo), escrito da esquerda pra direita
function nomeAMao(T, x, y, rC, cidade, pouso, i) {
  const wr = p(T, pouso - 0.05, 0.35, enter), wo = 1 - saindo(T);
  if (wr <= 0 || wo <= 0) return "";
  // do lado com mais espaço; nome comprido encolhe a letra (até 34) antes de ir pra baixo do círculo
  const gx = rC * 1.1 + 14, dir = 1020 - x - gx >= x - gx - 60, livre = dir ? 1020 - x - gx : x - gx - 60;
  const f = Math.min(MAO_F, livre / (cidade.length * MAO_EM)), lado = f >= 34, fs = lado ? f : MAO_F, nw = cidade.length * MAO_EM * fs;
  const xs = lado ? (dir ? x + gx : x - gx - nw) : clamp(x - nw / 2, 60, 1020 - nw), ny = lado ? y : y + rC + 40;
  return `<g opacity="${wo.toFixed(3)}"><clipPath id="mao${i}"><rect x="${(xs - 12).toFixed(1)}" y="${(ny - 70).toFixed(1)}" width="${((nw + 24) * wr).toFixed(1)}" height="120"/></clipPath>
  <text x="${xs.toFixed(1)}" y="${(ny + 18).toFixed(1)}" clip-path="url(#mao${i})" transform="rotate(-4 ${xs.toFixed(1)} ${ny.toFixed(1)})" font-family="${F_MAO}" font-size="${fs.toFixed(1)}"
  fill="${COR.tinta}" stroke="${COR.papel}" stroke-width="12" stroke-linejoin="round" paint-order="stroke">${esc(cidade)}</text></g>`;
}

export function mapaPapel(T, story, cor, quem) {
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))].filter((u) => ufs()[u]);
  const caixa = caixaDe(ufsShow.flatMap((u) => ufs()[u].flat().map(mundo)));
  const e3 = enquadra(caixa, R3, 2, 110), e4 = enquadra(caixa, R4, 3, 50), cam = camera(T, e3, e4);
  const c4 = naCena4(T), R = lerp(28, 26, c4), rC = lerp(64, 40, c4), N = story.shows.length;
  // cidades perto demais: os círculos se afastam (calculado no enquadramento final de cada cena) e um fio liga ao ponto
  const reais = (e) => story.shows.map((s) => tela(e, mundo(s.lonlat)));
  const o3 = afastar(reais(e3), 64, R3), o4 = afastar(reais(e4), 26, R4);
  const cidades = story.shows.map((s, i) => {
    const pinAt = 7.35 + i * 0.45, drop = 7.5 + i * 0.45;
    if (T < pinAt) return "";
    const [ax, ay] = tela(cam, mundo(s.lonlat)), x = ax + lerp(o3[i][0], o4[i][0], c4), y = ay + lerp(o3[i][1], o4[i][1], c4);
    const fio = Math.hypot(x - ax, y - ay) > 4 ? `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${COR.tinta}" stroke-width="3"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="6" fill="${COR.tinta}" stroke="${COR.creme}" stroke-width="2.5"/>` : "";
    const pen = p(T, drop, 0.4, move), c = caneta(x, y, rC, (i + 1) * 1.3);
    const traco = pen > 0 ? `<path d="${c.d}" fill="none" stroke="${COR.tinta}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${c.len.toFixed(1)}" stroke-dashoffset="${(c.len * (1 - pen)).toFixed(1)}"/>` : "";
    return fio + traco + nomeAMao(T, x, y, rC, s.cidade, drop + 0.34, i) + // logo colado no círculo, vira o pino enquanto o nome é escrito
      logoQueViraPino(T, pino(T, { x, y, R, i, N, cor, s: p(T, pinAt, 0.3, pop) }), { x, y, s: 0.85 * p(T, pinAt, 0.3, pop), uri: quem?.logoUri, vira: drop + 0.5 });
  }).join("");
  return grupoMapa(T, estados(cam, cor, () => 0.1) + ufsShow.map((u) => recorte(T, cam, u)).join("") + cidades);
}
