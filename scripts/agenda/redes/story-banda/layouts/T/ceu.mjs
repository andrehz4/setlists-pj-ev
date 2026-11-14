// Layout T (homenagem ao clima do álbum de 2000: espaço profundo e som em dois canais): peças comuns. Céu de estrelas
// determinísticas (cintilam com T), nebulosa de degradês suaves, grão fino, estrela desenhada com raios e o texto em
// Inter/Anton. Tudo função pura de T, sem foto e sem Math.random.
import { esc, F_ANTON, F_INTER_XB } from "../../pecas.mjs";

export { esc, F_ANTON };
export const F_XB = F_INTER_XB;
export const F_SB = "'Inter SemiBold','Inter',system-ui,sans-serif";
export const F_REG = "'Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => v.toFixed(1);
// semente estável a partir de um texto (posições da constelação, coordenadas fictícias)
export const semente = (t) => [...String(t)].reduce((a, c) => (a * 31 + c.codePointAt(0)) % 99991, 7);

// texto: fonte "anton", "xb", "sb" ou "reg"
export function txt(x, y, t, f, fill, { anchor = "middle", fonte = "xb", ls = 0, op = 1 } = {}) {
  const fam = { anton: F_ANTON, xb: F_XB, sb: F_SB, reg: F_REG }[fonte], w = { anton: 400, xb: 800, sb: 600, reg: 400 }[fonte];
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}">${esc(t)}</text>`;
}

// campo de estrelas: 3 camadas (poeira, médias, brilhantes com raios). Posições fixas, brilho oscila com T.
const CAMPO = Array.from({ length: 320 }, (_, i) => {
  const m = rnd(i + 900), r = m > 0.97 ? 2.6 + rnd(i + 40) * 1.6 : m > 0.82 ? 1.3 + rnd(i + 40) * 0.9 : 0.5 + rnd(i + 40) * 0.6;
  return { x: rnd(i) * 1080, y: rnd(i + 3000) * 1920, r, fase: rnd(i + 77) * 6.28, vel: 2 + rnd(i + 55) * 4, quente: rnd(i + 13) > 0.8 };
});
export function estrelas(T, cor, { op = 1, raio = null } = {}) {
  const dentro = raio ? (s) => Math.hypot(s.x - raio.x, s.y - raio.y) < raio.r : () => true;
  return `<g>${CAMPO.filter(dentro).map((s) => {
    const a = op * (0.55 + 0.45 * Math.sin(T * s.vel + s.fase)) * (s.r < 1.2 ? 0.7 : 1);
    return s.r > 2.5 ? estrela(s.x, s.y, s.r, s.quente ? cor.quente : cor.estrela, a) :
      `<circle cx="${f1(s.x)}" cy="${f1(s.y)}" r="${f1(s.r)}" fill="${s.quente ? cor.quente : cor.estrela}" opacity="${a.toFixed(2)}"/>`;
  }).join("")}</g>`;
}

// estrela brilhante: halo em degradê, miolo e 4 raios finos que somem nas pontas
export function estrela(x, y, r, c, op = 1) {
  const h = novoId("th"), l = r * 7;
  return `<radialGradient id="${h}"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
    <g opacity="${op.toFixed(2)}"><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 4)}" fill="url(#${h})"/>
    <path d="M${f1(x - l)},${f1(y)} L${f1(x)},${f1(y - 0.5)} L${f1(x + l)},${f1(y)} L${f1(x)},${f1(y + 0.5)} Z M${f1(x)},${f1(y - l)} L${f1(x + 0.5)},${f1(y)} L${f1(x)},${f1(y + l)} L${f1(x - 0.5)},${f1(y)} Z" fill="${c}" opacity="0.8"/>
    <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}"/></g>`;
}

// nebulosa: elipses com degradê radial que some na borda (sem filtro de blur, barato por quadro). k = formação 0..1
const NUVENS = [[0.72, 0.2, 520, 300, -24, "neb1", 0.55], [0.3, 0.34, 460, 260, 18, "neb2", 0.45], [0.55, 0.28, 300, 160, -8, "neb3", 0.5],
  [0.2, 0.72, 520, 280, -30, "neb2", 0.35], [0.84, 0.82, 420, 240, 22, "neb1", 0.4], [0.5, 0.56, 640, 220, 12, "neb3", 0.22]];
export function nebulosa(T, cor, k = 1, { so = NUVENS.length } = {}) {
  return NUVENS.slice(0, so).map(([a, b, rx, ry, rot, c, op], i) => {
    const id = novoId("tn"), kk = Math.max(0, Math.min(1, k * 1.6 - i * 0.12)), dx = Math.sin(T * 0.15 + i) * 14;
    return kk <= 0 ? "" : `<radialGradient id="${id}"><stop offset="0" stop-color="${cor[c]}" stop-opacity="${(op * kk).toFixed(3)}"/><stop offset="0.45" stop-color="${cor[c]}" stop-opacity="${(op * kk * 0.45).toFixed(3)}"/><stop offset="1" stop-color="${cor[c]}" stop-opacity="0"/></radialGradient>
    <ellipse cx="${f1(a * 1080 + dx)}" cy="${f1(b * 1920)}" rx="${f1(rx * (0.6 + 0.4 * kk))}" ry="${f1(ry * (0.6 + 0.4 * kk))}" transform="rotate(${rot} ${f1(a * 1080)} ${f1(b * 1920)})" fill="url(#${id})"/>`;
  }).join("") + poeira(cor, k);
}
// faixa de poeira escura que corta a nebulosa (dá profundidade)
const poeira = (cor, k) => { const id = novoId("tp");
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0.3" stop-color="${cor.bg2}" stop-opacity="0"/><stop offset="0.5" stop-color="${cor.bg2}" stop-opacity="${(0.5 * k).toFixed(3)}"/><stop offset="0.7" stop-color="${cor.bg2}" stop-opacity="0"/></linearGradient>
    <ellipse cx="560" cy="520" rx="560" ry="90" transform="rotate(-20 560 520)" fill="url(#${id})"/>`; };

// grão fino: ladrilho de 200 px com pontinhos fixos
const PONTOS = Array.from({ length: 200 }, (_, i) => `<circle cx="${f1(rnd(i + 5000) * 200)}" cy="${f1(rnd(i + 5300) * 200)}" r="${f1(0.4 + rnd(i + 5700) * 0.8)}"/>`).join("");
export const grao = (cor, op = 0.18) => { const id = novoId("tg");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${cor.estrela}">${PONTOS}</g></pattern><rect width="1080" height="1920" fill="url(#${id})" opacity="${op}"/>`; };

// céu inteiro: fundo com vinheta, nebulosa, estrelas e grão
export function ceu(T, cor, k = 1) {
  const v = novoId("tv");
  return `<radialGradient id="${v}" cx="0.5" cy="0.42" r="0.8"><stop offset="0" stop-color="${cor.bg}"/><stop offset="1" stop-color="${cor.bg2}"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${v})"/>${nebulosa(T, cor, k)}${estrelas(T, cor)}${grao(cor)}`;
}

// cabeçalho técnico de carta: rótulo espaçado + régua fina com marcas
export function cabecalho(y, rotulo, cor, op = 1) {
  const marcas = Array.from({ length: 41 }, (_, i) => `M${140 + i * 20},${y + 26} v${i % 5 ? 6 : 14}`).join("");
  return `<g opacity="${op.toFixed(3)}">${txt(540, y, rotulo, 30, cor.texto2, { fonte: "sb", ls: 9 })}
    <path d="M140,${y + 26} H940 ${marcas}" stroke="${cor.linha}" stroke-width="1.2" fill="none" opacity="0.8"/></g>`;
}

// coordenada fictícia (ascensão reta e declinação) estável por texto
export function coordenada(t) {
  const s = semente(t), ar = `${String(s % 24).padStart(2, "0")}h ${String((s >> 3) % 60).padStart(2, "0")}m`;
  const dec = `${s % 2 ? "+" : "−"}${(s >> 5) % 80}° ${String((s >> 2) % 60).padStart(2, "0")}′`;
  return { ar, dec };
}
