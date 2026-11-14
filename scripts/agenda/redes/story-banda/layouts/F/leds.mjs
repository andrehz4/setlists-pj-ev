// Layout F, cena 3: mapa de LEDs em grade de pontos (passo 15 px na janela 60,400 960x1220). Cada ponto vê em que
// estado cai (contornos do IBGE em media/agenda/geo, mesma projeção do mapa-comum). Câmera fixa na caixa dos estados
// dos shows. A grade é calculada uma vez por story (cache); por quadro só se cortam as listas já ordenadas.
import { ufs, centroUf } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela } from "../../mapa-comum.mjs";

export const MAPF = { x: 60, y: 400, w: 960, h: 1220 };
export const G = 15;
const cache = new Map();
const dot = (x, y, r) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
export const ponto = dot;
export const lonlatDe = (s) => s.lonlat || (ufs()[s.uf] ? centroUf(s.uf) : [-47.9, -15.8]);

function dentro(x, y, poly) {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}

// câmera: caixa dos estados dos shows, folga 40, zoom máximo equivalente ao s 14 do Design (2,56 graus na janela)
function camera(story) {
  const pts = [];
  for (const uf of new Set(story.shows.map((s) => s.uf))) {
    for (const poly of ufs()[uf] || []) for (const q of poly) pts.push(mundo(q));
  }
  if (!pts.length) story.shows.forEach((s) => pts.push(mundo(lonlatDe(s))));
  return enquadra(caixaDe(pts), MAPF, 2.56, 40);
}

// encaixa no ponto da grade mais perto (dentro da janela)
const naGrade = (v, o, n) => o + G / 2 + Math.min(n - 1, Math.max(0, Math.round((v - o - G / 2) / G))) * G;

export function grade(story) {
  const chave = `${story.contaPura}|${story.shows.map((s) => `${s.uf}:${lonlatDe(s)}`).join(",")}`;
  if (cache.has(chave)) return cache.get(chave);
  const cam = camera(story), meus = new Set(story.shows.map((s) => s.uf));
  const polys = Object.entries(ufs()).flatMap(([uf, ps]) => ps.map((poly) => {
    const t = poly.map((q) => tela(cam, mundo(q))), xs = t.map((v) => v[0]), ys = t.map((v) => v[1]);
    return { uf, t, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  })).filter((q) => q.box[2] > MAPF.x && q.box[0] < MAPF.x + MAPF.w && q.box[3] > MAPF.y && q.box[1] < MAPF.y + MAPF.h);
  const land = [], hot = [];
  for (let y = MAPF.y + G / 2; y < MAPF.y + MAPF.h; y += G) for (let x = MAPF.x + G / 2; x < MAPF.x + MAPF.w; x += G) {
    const hit = polys.find((q) => x >= q.box[0] && x <= q.box[2] && y >= q.box[1] && y <= q.box[3] && dentro(x, y, q.t));
    if (!hit) continue;
    // varredura diagonal de cima/esquerda: acende (sem fade) entre 5.50 e 5.95
    const d = 5.5 + 0.45 * (((x - MAPF.x) / MAPF.w) * 0.6 + ((y - MAPF.y) / MAPF.h) * 0.4);
    (meus.has(hit.uf) ? hot : land).push({ x, y, d });
  }
  land.sort((a, b) => a.d - b.d);
  hot.sort((a, b) => a.d - b.d);
  const nx = MAPF.w / G, ny = Math.floor(MAPF.h / G);
  const cidades = story.shows.map((s) => {
    const [x, y] = tela(cam, mundo(lonlatDe(s)));
    return [naGrade(x, MAPF.x, nx), naGrade(y, MAPF.y, ny)];
  });
  const res = { land, hot, todos: land.concat(hot), cidades,
    dL: land.map((q) => dot(q.x, q.y, 3.6)), dH: hot.map((q) => dot(q.x, q.y, 4.6)) };
  cache.set(chave, res);
  return res;
}

// quantos itens (ordenados por d) já acenderam em T
function acesos(lista, T) {
  let a = 0, b = lista.length;
  while (a < b) { const m = (a + b) >> 1; if (lista[m].d <= T) a = m + 1; else b = m; }
  return a;
}

// LEDs no instante T: fundo apagado, estados, ondas e núcleos das cidades (t[i] = quando a cidade i acende)
export function desenharLeds(T, story, cor, t) {
  const g = grade(story), op = Math.min(1, Math.max(0, (T - 5.5) / 0.15));
  const dL = g.dL.slice(0, acesos(g.land, T)).join(""), dH = g.dH.slice(0, acesos(g.hot, T)).join("");
  const ondas = [], nucleos = [];
  g.cidades.forEach(([cx, cy], i) => {
    for (const t0 of [t[i], t[i] + 0.45]) {
      const r = (T - t0) * 800;
      if (r <= 0 || r >= 320) continue;
      for (const q of g.todos) if (Math.abs(Math.hypot(q.x - cx, q.y - cy) - r) < 9) ondas.push(dot(q.x, q.y, 5));
    }
    if (T >= t[i] && (T - t[i] > 0.9 || Math.floor((T - t[i]) * 6) % 2 === 0)) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy <= 5) nucleos.push(dot(cx + dx * G, cy + dy * G, 6));
      }
    }
  });
  const path = (d, fill, extra = "") => (d ? `<path d="${d}" fill="${fill}"${extra}/>` : "");
  return `<pattern id="fgrade" x="${MAPF.x}" y="${MAPF.y}" width="${G}" height="${G}" patternUnits="userSpaceOnUse">` +
    `<circle cx="${G / 2}" cy="${G / 2}" r="2.4" fill="${cor.dim}"/></pattern>` +
    `<rect x="${MAPF.x}" y="${MAPF.y}" width="${MAPF.w}" height="${MAPF.h}" fill="url(#fgrade)" opacity="${op.toFixed(3)}"/>` +
    path(dL, cor.ch, ` fill-opacity="0.32"`) + path(dH, cor.ch) + path(ondas.join(""), cor.acc) + path(nucleos.join(""), cor.acc);
}
