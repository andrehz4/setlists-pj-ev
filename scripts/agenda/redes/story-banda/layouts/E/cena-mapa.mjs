// Layout E ("Bilhete"), cena 3 (5.5 a 9): mapa em gravura. Retícula tracejada, contornos dourados dos estados se
// desenhando por traço, rosa dos ventos em cada cidade com ondas e o nome em serifa sublinhado. De 9 em diante o mapa
// fica a 16% atrás dos ingressos da cena 4.
import { ufs, centroUf } from "../../../mapa.mjs";
import { mundo, caixaDe, tela } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { pr, out, io, back, lerp, f1, fade, rotulo, orn, caber, mede, estrela, ROMANO } from "./pecas.mjs";

const JAN = { x: 60, y: 490, w: 960, h: 1130 }, K = Math.cos((20 * Math.PI) / 180);
const SMAX = 350; // ~14 unidades do desenho por unidade dele (px por grau)
const junta = (l) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} e ${l.at(-1)}` : l[0]);

// afasta valores do eixo `k` com folga mínima, dentro de [lo, hi]
function espalha(itens, k, folga, lo, hi) {
  const s = [...itens].sort((a, b) => a[k] - b[k]);
  for (let i = 0; i < s.length; i++) s[i][k] = Math.max(s[i][k], lo, i ? s[i - 1][k] + folga : lo);
  for (let i = s.length - 1; i >= 0; i--) s[i][k] = Math.min(s[i][k], i < s.length - 1 ? s[i + 1][k] - folga : hi);
}

const CACHE = new WeakMap();
export function modelo(story) {
  if (CACHE.has(story)) return CACHE.get(story);
  const N = story.shows.length, lista = [...new Set(story.shows.map((s) => s.uf))].filter((u) => ufs()[u]);
  const bb = caixaDe(lista.flatMap((u) => ufs()[u].flat().map(mundo)));
  const bw = Math.max(bb[2] - bb[0], 1.2), bh = Math.max(bb[3] - bb[1], 1.2);
  const cam = { cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2, s: Math.min((JAN.w - 140) / bw, (JAN.h - 140) / bh, SMAX),
    rx: JAN.x + JAN.w / 2, ry: JAN.y + JAN.h / 2 };
  const pts = story.shows.map((s, i) => ({ cidade: s.cidade, n: i + 1, m: mundo(s.lonlat || centroUf(s.uf)),
    t: 5.85 + 0.45 * i }));
  const cen = [pts.reduce((a, c) => a + c.m[0], 0) / N, pts.reduce((a, c) => a + c.m[1], 0) / N];
  for (const c of pts) {
    const [ax, ay] = tela(cam, c.m), nx = N > 1 ? 54 : 0;
    c.f = Math.min(72, caber(c.cidade, 960 - nx - 120, 72));
    c.lw = nx + mede(c.cidade, c.f);
    c.dir = ax + 54 + c.lw <= 1020;
    c.lx = Math.min(1020 - c.lw, Math.max(60, c.dir ? ax + 54 : ax - 54 - c.lw)) - ax;
    c.ly = ay + 22;
  }
  espalha(pts, "ly", 96, JAN.y + 70, JAN.y + JAN.h - 20);
  const nomes = lista.map(nomeUf), cab = junta(nomes);
  // estados demais pra uma linha: 2 linhas partidas entre os nomes (corpo até 64, pra não encostar no rótulo)
  const k = Math.ceil(nomes.length / 2), dois = nomes.length === 2 ? [`${nomes[0]} e`, nomes[1]]
    : nomes.length - k === 1 ? [nomes.slice(0, k).join(", "), `e ${nomes[k]}`]
    : [`${nomes.slice(0, k).join(", ")},`, junta(nomes.slice(k))];
  const um = caber(cab, 940, 150), cabQ = um >= 64 || nomes.length < 2 ? { F: um, linhas: [cab] }
    : { F: Math.min(64, ...dois.map((l) => caber(l, 940, 64))), linhas: dois };
  const M = { N, lista, cam, pts, cen, cabQ, rot: lista.length > 1 ? "NOS ESTADOS DE" : "NO ESTADO DE" };
  CACHE.set(story, M);
  return M;
}

// câmera do quadro: aproximação lenta (x1.10) e o centro andando 40% até o meio das cidades
function cameraEm(T, M) {
  const d = pr(T, 5.5, 3.5, io);
  return { ...M.cam, s: M.cam.s * lerp(1, 1.1, d), cx: lerp(M.cam.cx, M.cen[0], 0.4 * d), cy: lerp(M.cam.cy, M.cen[1], 0.4 * d) };
}

function reticula(cam, cor, op) {
  if (op <= 0) return "";
  const w0 = (JAN.x - cam.rx) / cam.s + cam.cx, w1 = (JAN.x + JAN.w - cam.rx) / cam.s + cam.cx;
  const h0 = (JAN.y - cam.ry) / cam.s + cam.cy, h1 = (JAN.y + JAN.h - cam.ry) / cam.s + cam.cy;
  const traco = `stroke="${cor.gold}" stroke-width="1.5" stroke-dasharray="2 8"`;
  let s = "";
  for (let lo = Math.floor(w0 / K); lo <= Math.ceil(w1 / K); lo++) {
    const x = tela(cam, [lo * K, 0])[0];
    s += `<line x1="${f1(x)}" y1="${JAN.y}" x2="${f1(x)}" y2="${JAN.y + JAN.h}" ${traco}/>`;
  }
  for (let la = Math.floor(h0); la <= Math.ceil(h1); la++) {
    const y = tela(cam, [0, la])[1];
    s += `<line x1="${JAN.x}" y1="${f1(y)}" x2="${JAN.x + JAN.w}" y2="${f1(y)}" ${traco}/>`;
  }
  return `<g opacity="${op.toFixed(3)}">${s}</g>`;
}

// contornos: cada anel vira um path com o comprimento real (o traço se desenha por dashoffset)
function contornos(T, cam, M, cor) {
  const desenha = pr(T, 5.5, 0.9, out), preenche = 0.16 * pr(T, 5.8, 0.5, out);
  let fundo = "", linhas = "";
  for (const [uf, aneis] of Object.entries(ufs())) {
    const meu = M.lista.includes(uf), sw = meu ? 2.6 : 1.4, op = meu ? 1 : 0.5;
    const telas = aneis.map((a) => a.map((v) => tela(cam, mundo(v))));
    if (meu && preenche > 0) fundo += `<path
      d="${telas.map((q) => `M${q.map(([x, y]) => `${f1(x)},${f1(y)}`).join("L")}Z`).join("")}"
      fill="${cor.gold}" fill-opacity="${preenche.toFixed(3)}"/>`;
    for (const q of telas) {
      let L = 0;
      for (let i = 0; i < q.length; i++) { const [a, b] = q[i], [c, e] = q[(i + 1) % q.length]; L += Math.hypot(c - a, e - b); }
      const dash = desenha < 1 ? ` stroke-dasharray="${f1(L + 1)}" stroke-dashoffset="${f1((L + 1) * (1 - desenha))}"` : "";
      linhas += `<path d="M${q.map(([x, y]) => `${f1(x)},${f1(y)}`).join("L")}Z" fill="none" stroke="${cor.gold}"
        stroke-opacity="${op}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`;
    }
  }
  return fundo + linhas;
}

function estrelas(T, cam, M, cor) {
  return M.pts.map((c) => {
    const [x, y] = tela(cam, c.m), k = pr(T, c.t, 0.5, back);
    if (k <= 0) return "";
    const onda = (t0) => { const q = pr(T, t0, 0.9, out);
      return q > 0 && q < 1 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(20 + 110 * q)}"
        fill="none" stroke="${cor.gold}" stroke-width="2" opacity="${(1 - q).toFixed(3)}"/>` : ""; };
    return onda(c.t) + onda(c.t + 0.25) +
      `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(lerp(-45, 0, k))}) scale(${k.toFixed(3)})">` +
      `<path d="${estrela(36)}" fill="${cor.gold}"/><circle r="6" fill="${cor.bg}"/></g>`;
  }).join("");
}

function etiquetas(T, cam, M, cor, some) {
  if (some >= 1) return "";
  return M.pts.map((c) => {
    const [ax, ay] = tela(cam, c.m), p = pr(T, c.t + 0.1, 0.6, out) * (1 - some), u = pr(T, c.t + 0.25, 0.5, io) * (1 - some);
    if (p <= 0) return "";
    const x = ax + c.lx, nx = M.N > 1 ? 54 : 0, ex = c.dir ? x : x + c.lw;
    const longe = Math.abs(c.ly + 16 - ay) > 30 || Math.abs(ex - ax) > 80;
    const fio = longe && u > 0 ? `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(lerp(ax, ex, u))}"
      y2="${f1(lerp(ay, c.ly + 16, u))}" stroke="${cor.gold}" stroke-width="2"/>` : "";
    return fio + (nx ? fade(x, c.ly, ROMANO[c.n - 1] || String(c.n), 40, cor.gold, p,
       { fonte: "pf7", anchor: "start", ls0: 0 }) : "") +
      fade(x + nx, c.ly, c.cidade, c.f, cor.paper, p, { anchor: "start" }) +
      (u > 0 ? `<rect x="${f1(x + nx)}" y="${f1(c.ly + 16)}" width="${f1((c.lw - nx) * u)}"
        height="2" fill="${cor.gold}"/>` : "");
  }).join("");
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 12.5) return "";
  const M = modelo(story), cam = cameraEm(T, M), p4 = pr(T, 9, 0.5, io), sai = pr(T, 9, 0.2, io);
  const cl = `emapa${story.contaPura || "x"}`.replace(/[^\w]/g, ""), sc = lerp(1, 0.92, p4);
  const cab = sai < 1 ? `<g opacity="${(1 - sai).toFixed(3)}">${rotulo(540, 290, M.rot, pr(T, 5.5, 0.4, out), cor.gold)}` +
    M.cabQ.linhas.map((l, i, a) => fade(540, 410 - (a.length - 1 - i) * 0.95 * M.cabQ.F, l, M.cabQ.F, cor.paper,
      pr(T, 5.5, 0.45, out))).join("") + "</g>" : "";
  return cab + orn(540, 455, 520, pr(T, 5.55, 0.6, io), cor.gold) +
    `<clipPath id="${cl}"><rect x="${JAN.x}" y="${JAN.y}" width="${JAN.w}" height="${JAN.h}"/></clipPath>` +
    `<g clip-path="url(#${cl})"><g opacity="${lerp(1, 0.16, p4).toFixed(3)}"
      transform="translate(540 1055) scale(${sc.toFixed(4)}) translate(-540 -1055)">` +
    reticula(cam, cor, 0.4 * pr(T, 5.5, 0.4, out)) + contornos(T, cam, M, cor) + estrelas(T, cam, M, cor) + `</g></g>` +
    etiquetas(T, cam, M, cor, sai);
}
