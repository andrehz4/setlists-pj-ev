// Layout F: medidas que dependem do story (calculadas uma vez por story e guardadas): fileiras do nome na abertura,
// fileira do topo das cenas 3 e 4, etiquetas das cidades no mapa e linhas do quadro de partidas.
import { nomeUf } from "../../../voz.mjs";
import { tileFit, larguraFileira, caber } from "./pastilhas.mjs";
import { grade, G, MAPF } from "./leds.mjs";

const SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const cache = new WeakMap();

// quebra por palavras em até maxL fileiras de no máximo cols caracteres (null se não couber)
function quebrar(txt, cols, maxL) {
  const out = [];
  let cur = "";
  for (const w of txt.split(/\s+/).filter(Boolean)) {
    if ([...w].length > cols) return null;
    const t = cur ? `${cur} ${w}` : w;
    if ([...t].length <= cols) cur = t; else { out.push(cur); cur = w; }
  }
  out.push(cur);
  return out.length <= maxL ? out : null;
}

// afasta itens no eixo key com distância mínima gap, dentro de [lo, hi]
function espalhar(itens, key, gap, lo, hi) {
  const s = [...itens].sort((a, b) => a[key] - b[key]);
  for (let i = 0; i < s.length; i++) s[i][key] = Math.max(s[i][key], lo, i ? s[i - 1][key] + gap : lo);
  for (let i = s.length - 1; i >= 0; i--) s[i][key] = Math.min(s[i][key], i < s.length - 1 ? s[i + 1][key] - gap : hi);
}

const horaDe = (h) => {
  const m = String(h || "").match(/^(\d{1,2})[:h]?(\d{2})?/);
  return m ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : "--:--";
};

// cena 1: maior pastilha (124 a 36, passo 4) em que o nome quebra em até 3 fileiras; fileiras terminam em y 1600
function nomeAbertura(B) {
  let s = null;
  for (let tw = 124; tw >= 36 && !s; tw -= 4) {
    const gap = Math.round(tw * 0.08), cols = Math.floor((960 + gap) / (tw + gap)), lines = quebrar(B, cols, 3);
    if (lines) s = { tw, gap, cols, lines };
  }
  // palavra maior que a fileira: a pastilha encolhe até a palavra caber (nunca corta letra)
  if (!s) {
    const n = Math.max(...B.split(/\s+/).map((w) => [...w].length)), tw = Math.floor(963 / n) - 3;
    s = { tw, gap: 3, cols: n, lines: quebrar(B, n, 99) };
  }
  const h = Math.round(s.tw * 1.4), rg = Math.round(s.tw * 0.12), n = s.lines.length;
  s.ys = s.lines.map((_, i) => 1600 - (n - i) * h - (n - 1 - i) * rg);
  s.hy = s.ys[0] - 56 - 30;
  s.top = s.hy - 50;
  return s;
}

// cena 2: o nome numa fileira (tileFit 966, máx 56); se a pastilha ficar menor que 34, quebra em 2 fileiras
function nomeLogo(B) {
  const um = tileFit([...B].length, 966, 56, 0.1);
  if (um.tw >= 34) return { ...um, lines: [B] };
  for (let cols = Math.ceil([...B].length / 2); cols <= [...B].length; cols++) {
    const l = quebrar(B, cols, 2);
    if (l) return { ...tileFit(cols, 966, 40, 0.1), lines: l };
  }
  return { ...um, lines: [B] };
}

// cena 3: etiqueta em pastilhas (tw 30 gap 4) acima da cidade, espalhadas na vertical; sob o núcleo se colidir
function etiquetas(story, cidades) {
  const N = story.shows.length;
  const pts = story.shows.map((s, i) => {
    const lab = `${N > 1 ? `${i + 1} ` : ""}${s.cidade.toUpperCase()}`, n = [...lab].length;
    const lt = Math.min(30, Math.floor(964 / n) - 4), lw = larguraFileira(n, lt, 4), [ax, ay] = cidades[i];
    const lx = Math.min(1020 - lw, Math.max(60, ax - 24));
    return { i, lab, lt, lw, a: [ax, ay], t: 5.95 + i * 0.45, lx, ly: ay - 2.5 * G - 62 };
  });
  // espalha; a que cair em cima do próprio núcleo vai pra baixo dele e espalha de novo (até estabilizar)
  for (let volta = 0; volta < 4; volta++) {
    espalhar(pts, "ly", 58, MAPF.y + 10, MAPF.y + MAPF.h - 52);
    let mexeu = false;
    for (const c of pts) {
      if (c.ly + 42 > c.a[1] - 2.5 * G && c.ly < c.a[1] + 2.5 * G) { c.ly = c.a[1] + 2.5 * G + 12; mexeu = true; }
    }
    if (!mexeu) break;
  }
  return pts.sort((a, b) => a.i - b.i);
}

// cena 4: linhas do quadro de partidas a partir de y 480; encolhe tudo junto se não couber até y 1640
function partidas(story) {
  const cidades = story.shows.map((s) => s.cidade.toUpperCase()), N = cidades.length;
  const cityCols = Math.max(...cidades.map((c) => [...c].length));
  const medir = (k) => {
    const htw = Math.floor(70 * k), ht = { tw: htw, gap: Math.max(3, Math.round(6 * k)) }, hh = Math.round(htw * 1.4);
    const tw = Math.floor(tileFit(cityCols, 966, 60).tw * k);
    const tc = { tw, gap: Math.max(3, Math.round(tw * 0.08)) }, dy = Math.round(16 * k), rgap = Math.round(44 * k);
    const rowH = hh + dy + Math.round(tc.tw * 1.4);
    return { ht, hh, tc, dy, rgap, rowH, total: N * rowH + (N - 1) * rgap };
  };
  let m = medir(1);
  if (m.total > 1160) m = medir(1160 / m.total);
  for (let k = 0.98; m.total > 1160 && k > 0.4; k -= 0.02) m = medir(k);
  const linhas = story.shows.map((s, i) => {
    const sub = s.casa || (s.hora ? null : `detalhes no ${story.conta}`);
    return { cidade: cidades[i], on: 9.4 + i * 0.32, ry: 480 + i * (m.rowH + m.rgap), hora: horaDe(s.hora), sub,
      sf: sub ? caber(sub, 556, 36) : 0 };
  });
  return { ...m, cityCols, linhas };
}

export { quebrar };

export function modelo(story) {
  if (cache.has(story)) return cache.get(story);
  const B = String(story.banda || story.conta || "").toUpperCase().trim(), dia = story.dia;
  const data = `${SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const head3 = ufsShow.length === 1 ? nomeUf(ufsShow[0]).toUpperCase() : ufsShow.join(" + ");
  const head4 = `PARTIDAS · ${data}`, hc = Math.max([...head3].length, [...head4].length);
  const g = grade(story);
  const m = { B, s1: nomeAbertura(B), head1: `HOJE · ${data}`, t2: nomeLogo(B),
    head3, head4, hc, t3: tileFit(hc, 966, 64), pts: etiquetas(story, g.cidades), p4: partidas(story) };
  cache.set(story, m);
  return m;
}
