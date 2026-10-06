// Mapa (variação A: câmera do Brasil inteiro até as cidades da banda, pinos caindo; B e C em arquivos próprios) e
// lista dos shows (MOTION-SPEC-banda).
import { p, pop, enter, move, lerp, clamp } from "./tempo.mjs";
import { COR, esc, larguraAnton, F_ANTON, F_INTER_XB } from "./pecas.mjs";
import { mundo, caixaDe, enquadra, camera, tela, estados, grupoMapa, pino, onda, etiquetaCidade, R3, R4 } from "./mapa-comum.mjs";
import { mapaPapel } from "./mapa-papel.mjs";
import { mapaRota } from "./mapa-rota.mjs";
import { logoQueViraPino } from "./viajante.mjs";

export function mapa(T, story, cor, variacao = "A", quem) {
  if (T < 5.5) return "";
  if (variacao === "B") return mapaPapel(T, story, cor, quem);
  if (variacao === "C") return mapaRota(T, story, cor, quem);
  const caixa = caixaDe(story.shows.map((s) => mundo(s.lonlat)));
  const cam = camera(T, enquadra(caixa, R3, 6, 140), enquadra(caixa, R4, 3, 50));
  const acende = Object.fromEntries(story.shows.map((s, i) => [s.uf, p(T, 7.84 + i * 0.45, 0.3, enter)]));
  const R = lerp(40, 26, p(T, 9.0, 0.7, move)), N = story.shows.length;
  const pinos = story.shows.map((s, i) => {
    const drop = 7.5 + i * 0.45;
    if (T < drop) return "";
    const [x, y0] = tela(cam, mundo(s.lonlat)), y = y0 - 170 * (1 - p(T, drop, 0.34, pop));
    // o logo da banda cai no lugar do pino e vira o pino logo depois do pouso
    return onda(T, x, y0, R, drop + 0.34) + logoQueViraPino(T, pino(T, { x, y, R, i, N, cor }), { x, y, uri: quem?.logoUri, vira: drop + 0.45 }) + etiquetaCidade(T, x, y0, R, s.cidade, drop + 0.34);
  }).join("");
  return grupoMapa(T, estados(cam, cor, (uf) => 0.2 + 0.55 * (acende[uf] || 0)) + pinos);
}

const hora = (h) => (h ? h.replace(":00", "H").replace(":", "H") : null);
export function shows(T, story, cor) {
  const sobe = p(T, 9.0, 0.7, move);
  if (sobe <= 0) return "";
  const topo = lerp(1920, 785, sobe), N = story.shows.length;
  const cityF = Math.min(170, (835 / N - 60) / 1.8), horaF = 0.7 * cityF, casaF = clamp(0.36 * cityF, 30, 60);
  const bloco = 1.05 * cityF + 16 + horaF + 32, total = N * bloco + (N - 1) * 50;
  let y = 815 + (835 - total) / 2;
  const itens = story.shows.map((s, i) => {
    const on = 9.5 + i * 0.25, o = p(T, on, 0.35, enter), dx = 80 * (1 - o);
    const badge = N > 1 ? 0.62 * cityF + 20 : 0, livre = 960 - badge;
    const f = Math.min(cityF, livre / (s.cidade.length * 0.5)), y1 = y + cityF;
    const h = hora(s.hora), hs = p(T, on + 0.15, 0.3, pop), hw = h ? larguraAnton(h, horaF) + 42 : 0, y2 = y1 + 16;
    const casa = s.casa || (!h ? `detalhes no ${story.conta}` : "");
    const g = `<g opacity="${o.toFixed(3)}" transform="translate(${dx} 0)">
      ${N > 1 ? `<circle cx="${60 + 0.31 * cityF}" cy="${y1 - 0.36 * cityF}" r="${0.31 * cityF}" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="5"/>
      <text x="${60 + 0.31 * cityF}" y="${y1 - 0.16 * cityF}" text-anchor="middle" font-family="${F_ANTON}" font-size="${0.45 * cityF}" fill="${COR.creme}">${i + 1}</text>` : ""}
      <text x="${60 + badge}" y="${y1}" font-family="${F_ANTON}" font-size="${f}" fill="${COR.creme}">${esc(s.cidade.toUpperCase())}</text>
      ${h ? `<g transform="translate(60 ${y2 + (horaF + 34) / 2}) rotate(-2) scale(${lerp(1.5, 1, hs).toFixed(3)}) translate(0 ${-(horaF + 34) / 2})"><rect width="${hw}" height="${horaF + 34}" fill="${cor.strip}"/>
      <text x="21" y="${20 + horaF * 0.84}" font-family="${F_ANTON}" font-size="${horaF}" fill="${COR.creme}">${h}</text></g>` : ""}
      ${casa ? `<text x="${60 + (h ? hw + 24 : 0)}" y="${y2 + horaF * 0.5 + 17 + casaF * 0.36}" font-family="${F_INTER_XB}" font-weight="800" font-size="${Math.min(casaF, (960 - hw - 24) / (casa.length * 0.6))}" fill="${COR.creme}">${esc(casa)}</text>` : ""}</g>`;
    y += bloco + 50;
    return g;
  }).join("");
  return `<rect x="0" y="${topo}" width="1080" height="${1920 - topo}" fill="${cor.bg}"/><rect x="0" y="${topo}" width="1080" height="4" fill="${COR.tinta}"/>${itens}`;
}
