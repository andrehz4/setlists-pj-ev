// Layout G: mapa de LED. Grade de pontos na tela; cada ponto vê em que estado cai (contorno do IBGE). Estado do show
// aceso, vizinhos apagados, mar quase sumido. Câmera fixa na região dos estados dos shows (a grade é calculada uma vez
// por story e guardada). Acende numa varredura diagonal; a cidade vira um LED grande com ondas de radar.
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela } from "../../mapa-comum.mjs";

export const RM = { x: 60, y: 430, w: 960, h: 1130 };
const PASSO = 22;
const cache = new Map();

function dentro([x, y], poly) {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}

// Câmera: caixa dos estados dos shows (com folga pro vizinho aparecer), mínimo de 4 graus.
export function cameraLed(story) {
  const todos = ufs(), pts = [];
  for (const uf of new Set(story.shows.map((s) => s.uf))) for (const poly of todos[uf] || []) for (const q of poly) pts.push(mundo(q));
  if (!pts.length) story.shows.forEach((s) => pts.push(mundo(s.lonlat)));
  return enquadra(caixaDe(pts), RM, 4, 40);
}

// Pontos { x, y, nivel }: 2 = estado do show, 1 = outro estado, 0 = mar/fora.
export function gradeLed(story) {
  const chave = `${story.dia}|${story.contaPura}|${story.shows.map((s) => s.uf).join(",")}`;
  if (cache.has(chave)) return cache.get(chave);
  const cam = cameraLed(story), shows = new Set(story.shows.map((s) => s.uf));
  const polys = Object.entries(ufs()).flatMap(([uf, ps]) => ps.map((poly) => {
    const t = poly.map((q) => tela(cam, mundo(q)));
    const xs = t.map((v) => v[0]), ys = t.map((v) => v[1]);
    return { uf, t, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  })).filter((p) => p.box[2] > RM.x && p.box[0] < RM.x + RM.w && p.box[3] > RM.y && p.box[1] < RM.y + RM.h);
  const pts = [];
  for (let y = RM.y + PASSO / 2; y < RM.y + RM.h; y += PASSO) for (let x = RM.x + PASSO / 2; x < RM.x + RM.w; x += PASSO) {
    const hit = polys.find((p) => x >= p.box[0] && x <= p.box[2] && y >= p.box[1] && y <= p.box[3] && dentro([x, y], p.t));
    pts.push({ x, y, nivel: hit ? (shows.has(hit.uf) ? 2 : 1) : 0 });
  }
  const res = { cam, pts };
  cache.set(chave, res);
  return res;
}

// Desenho dos LEDs no instante T (cena 3 começa em 5.5). on(x, y) = quando o ponto acende.
export function leds(T, story, cor) {
  const { pts } = gradeLed(story);
  const on = (x, y) => 5.55 + ((x - RM.x) + (y - RM.y)) / (RM.w + RM.h) * 0.9;
  const R = [2.2, 4.4, 6.6], OP = [0.12, 0.32, 1];
  return pts.map(({ x, y, nivel }) => {
    const k = Math.min(1, Math.max(0, (T - on(x, y)) / 0.18));
    if (k <= 0) return "";
    const fill = nivel === 2 ? cor.letra : cor.apoio;
    return `<circle cx="${x}" cy="${y}" r="${(R[nivel] * (0.6 + 0.4 * k)).toFixed(1)}" fill="${fill}" opacity="${(OP[nivel] * k).toFixed(2)}"/>`;
  }).join("");
}

// Posição na tela de cada show (mesma câmera dos LEDs), presa ao ponto da grade mais perto.
export function posShows(story) {
  const { cam } = gradeLed(story);
  return story.shows.map((s) => {
    const [x, y] = tela(cam, mundo(s.lonlat));
    const gx = RM.x + PASSO / 2 + Math.round((x - RM.x - PASSO / 2) / PASSO) * PASSO;
    const gy = RM.y + PASSO / 2 + Math.round((y - RM.y - PASSO / 2) / PASSO) * PASSO;
    return [Math.min(Math.max(gx, RM.x + 40), RM.x + RM.w - 40), Math.min(Math.max(gy, RM.y + 40), RM.y + RM.h - 40)];
  });
}
