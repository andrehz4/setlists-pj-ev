// Layout R, cenas 1 (fotos instantâneas caem por cima do clipe e se encaixam numa grade; a do meio revela "HOJE TEM",
// o nome da banda à mão e a data, 0 a 3) e 2 (o logo vira uma foto grande revelando, legenda com a conta e a
// estrada, rótulo de fita com a base, 3 a 5.5).
import { p, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { fundo, varre, rotulo, mao, sans, cabe, diaCurto, novoId, f1, rnd } from "./pecas.mjs";
import { polaroide, medidas } from "./polaroide.mjs";
import { desenho } from "./desenhos.mjs";

// queda: a foto vem de cima girando, no ar (sombra longe), e assenta. Devolve o que a polaroide precisa.
export function queda(T, at, rot, sd, d = 0.5) {
  const k = p(T, at, d, enter);
  return { op: k > 0 ? Math.min(1, k * 5) : 0, alto: 1 - k, rot: rot + (1 - k) * (rnd(sd) > 0.5 ? 16 : -16), dy: lerp(-300, 0, k) };
}

// foto pequena do mural (desenho genérico) caindo em `at` e revelando devagar (algumas ainda revelando no fim da cena)
export function miuda(T, { cx, cy, w, rot, nome, at, sd, preso = null, revela = [0.4, 1.8] }, cor) {
  const q = queda(T, at, rot, sd);
  return polaroide({ cx, cy: cy + q.dy, w, rot: q.rot, alto: q.alto, op: q.op, cor, sd, preso,
    revela: p(T, at + revela[0], revela[1] * (0.8 + 0.8 * rnd(sd + 2)), (x) => x), foto: desenho(nome, cor.filme) });
}

const GRADE = [
  { cx: 190, cy: 330, rot: -6, nome: "olho" }, { cx: 540, cy: 300, rot: 3, nome: "estrada" }, { cx: 885, cy: 340, rot: 7, nome: "dado" },
  { cx: 195, cy: 1610, rot: 5, nome: "chave" }, { cx: 545, cy: 1640, rot: -3, nome: "lua" }, { cx: 880, cy: 1600, rot: -7, nome: "oculos" },
];
const ORDEM = [0, 4, 2, 3, 1, 5];

// miolo escuro da foto do meio: estrada bem apagada por baixo e o texto claro por cima
function capa(story, cor) {
  return (x, y, s) => {
    const linhas = linhasDoNome(story.banda, 12), f = Math.min((s - 220) / (linhas.length * 1.05), ...linhas.map((l) => cabe(l, s - 90, 128)));
    const alto = linhas.length * f * 1.05, y0 = y + 150 + (s - 210 - alto) / 2;
    return desenho("estrada", cor.filme)(x, y, s) + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.sombra}" opacity="0.72"/>` +
      sans(x + s / 2, y + 112, "HOJE TEM", 50, cor.filme.luz, { ls: 12 }) +
      `<path d="M${f1(x + s / 2 - 120)},${f1(y + 140)} h240" stroke="${cor.filme.luz}" stroke-width="2" opacity="0.6"/>` +
      linhas.map((l, i) => mao(x + s / 2, y0 + (i + 0.8) * f * 1.05, l, f, cor.filme.luz, { rot: -1.5 })).join("");
  };
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const N = story.shows.length, veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.3 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  const miudas = ORDEM.map((i, j) => miuda(T, { ...GRADE[i], w: 280, at: 0.08 + j * 0.1, sd: i + 1, revela: [0.35, 1.5 + (i % 3) * 0.6] }, cor)).join("");
  const q = queda(T, 0.5, -2, 7, 0.55), data = `${diaCurto(story.dia)}${N > 1 ? ` · ${N} shows` : ""}`;
  const central = polaroide({ cx: 540, cy: 980 + q.dy, w: 660, rot: q.rot, alto: q.alto, op: q.op, cor, sd: 7, preso: "fita",
    revela: p(T, 0.65, 0.95, (x) => x), foto: capa(story, cor),
    legenda: (x, y, w, h) => mao(0, y + h * 0.62, data, cabe(data, w - 100, 74), cor.tinta, { rot: -2 }) });
  return veu + miudas + central + varre(T, 2.55, cor);
}

// sem logo: o nome da banda à mão, quebrado por palavra, centrado na foto
const semLogo = (banda, x, y, s, cor) => { const l = linhasDoNome(banda, 12), f = Math.min((s - 140) / (l.length * 1.1), ...l.map((t) => cabe(t, s - 100, 130)));
  return l.map((t, i) => mao(x + s / 2, y + s / 2 + (i - (l.length - 1) / 2) * f * 1.1 + f * 0.36, t, f, cor.filme.luz, { rot: -2 })).join(""); };

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, estrada = story.desde ? `na estrada desde ${story.desde}` : "";
  const foto = (x, y, s) => { const cl = novoId("rl");
    return logoUri ? `<clipPath id="${cl}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}"/></clipPath>
      <image href="${logoUri}" x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(s)}" height="${f1(s)}" fill="${cor.filme.sombra}"/>${semLogo(story.banda, x, y, s, cor)}`; };
  const legenda = (x, y, w, h) => {
    const fc = cabe(conta, w - 90, estrada ? 72 : 84), yc = estrada ? y + h * 0.46 : y + h * 0.62;
    return mao(0, yc, conta, fc, cor.tinta, { rot: -1.5 }) + (estrada ? mao(0, y + h * 0.84, estrada, cabe(estrada, w - 120, 44), cor.tinta, { rot: -1.5, op: 0.85 }) : "");
  };
  const q = queda(T, 3.05, -2, 11, 0.5), { H } = medidas(740);
  const grande = polaroide({ cx: 540, cy: 900 + q.dy, w: 740, rot: q.rot, alto: q.alto, op: q.op, cor, sd: 11, preso: "tacha",
    revela: p(T, 3.35, 1.3, (x) => x), foto, legenda });
  let base = "";
  if (story.cidadeBase) {
    const t = `base: ${story.cidadeBase}`, f = cabe(t, 620, 54), larg = rotulo(0, 0, t, f, cor).w;
    base = rotulo(Math.min(540, 80 + larg / 2), 900 + H / 2 + 80, t, f, cor, { rot: -3, sd: 4, op: p(T, 3.9, 0.35, enter) }).svg;
  }
  const atras = miuda(T, { cx: 175, cy: 330, w: 250, rot: -9, nome: "chave", at: 3.0, sd: 21 }, cor) +
    miuda(T, { cx: 880, cy: 1610, w: 260, rot: 7, nome: "dado", at: 3.2, sd: 22, preso: "fita" }, cor);
  return fundo(cor) + atras + grande + base;
}
