// Layout Z, cenas 1 (rastros de luz rabiscam por cima do clipe e escrevem "HOJE TEM" e o nome da banda, 0 a 3) e
// 2 (o logo acende enquanto duas lanternas contornam a moldura, com @conta, estrada e base, 3 a 5.5).
import { p, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { novaCamada, pinta, trilha, luz, brilhante, escreve, fundo, feixe, txt, cabe, largura, novoId, f1, op3 } from "./pecas.mjs";
import { rabisco, assinatura, moldura } from "./gestos.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataCurta = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;
// dados de exposição no topo, como o visor da câmera na longa exposição
export const exif = (cor, t = "EXPOSIÇÃO 30 s  ·  f/8  ·  ISO 100") => txt(540, 262, t, 24, cor.texto, { fonte: "interB", ls: 5, op: 0.42 });

// rabiscos ambiente (fixos por cena): [semente, x0, y0, x1, y1, amplitude, cor, início, duração, espessura]
const RAB_ABRE = [[3, -80, 980, 1160, 1120, 110, 0, 0.05, 1.1, 1], [8, 1160, 1760, -80, 1640, 90, 1, 0.3, 1.2, 0.8], [5, -80, 1450, 1160, 860, 60, 2, 0.6, 1.3, 0.55]];
const ambiente = (c, T, lista, cor) => lista.forEach(([s, x0, y0, x1, y1, a, i, at, d, w]) =>
  luz(c, trilha(rabisco(s, x0, y0, x1, y1, a)), cor.luzes[i], p(T, at, d, (u) => u), { w, op: 0.75, semente: s }));

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 12), nL = linhas.length, N = story.shows.length;
  const fN = Math.min(150, 520 / (nL * 1.08), ...linhas.map((l) => cabe(l, 900, 150, "marker", 2))), fH = 92;
  const H = fH + 24 + nL * fN * 1.08 + 120, yHoje = 1660 - H + fH, base = (i) => yHoje + 24 + fN * 0.86 + i * fN * 1.08;
  const c = novaCamada(), fim = 0.8 + nL * 0.35;
  ambiente(c, T, RAB_ABRE, cor);
  escreve(c, T, 0.3, 0.45, 540, yHoje, "HOJE TEM", fH, cor.texto, cor.luzes[1], { fonte: "marker", ls: 6 });
  linhas.forEach((l, i) => escreve(c, T, 0.8 + i * 0.35, 0.4, 540, base(i), l, fN, cor.texto, cor.luzes[0], { fonte: "marker", ls: 2 }));
  const yS = base(nL - 1) + 40, wS = Math.min(820, Math.max(...linhas.map((l) => largura(l, fN, "marker", 2))) + 60);
  luz(c, trilha(assinatura(540 - wS / 2, 540 + wS / 2, yS, 4)), cor.luzes[2], p(T, fim, 0.35, (u) => u), { w: 0.6, semente: 9 });
  const data = `${dataCurta(story.dia)}${N > 1 ? `  ·  ${N} SHOWS` : ""}`;
  brilhante(c, 540, yS + 78, data, cabe(data, 820, 42, "interXB", 3), cor.texto, cor.luzes[0], { fonte: "interXB", ls: 3, op: p(T, fim + 0.1, 0.3) });
  const v = novoId("zw"), veu = `<linearGradient id="${v}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.38" stop-color="#000" stop-opacity="0"/><stop offset="0.62" stop-color="#000" stop-opacity="0.72"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>
    <rect width="1080" height="1920" fill="url(#${v})" opacity="${op3(p(T, 0, 0.35))}"/>`;
  return veu + pinta(c) + feixe(T, 2.58, cor, 0.42);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, lado = 600, fx = 240, fy = 380, r = 34, c = novaCamada();
  const k1 = p(T, 3.1, 1.35, enter), k2 = p(T, 3.3, 1.35, enter), acende = p(T, 3.25, 1.2, enter);
  luz(c, trilha(moldura(fx - 6, fy - 6, lado + 12, lado + 12, r + 6)), cor.luzes[0], k1, { w: 0.85, semente: 2 });
  luz(c, trilha(moldura(fx - 24, fy - 24, lado + 48, lado + 48, r + 24).reverse()), cor.luzes[1], k2, { w: 0.5, op: 0.8, semente: 5 });
  ambiente(c, T, [[11, -80, 1560, 1160, 1720, 70, 3, 3.0, 1.6, 0.5]], cor);
  const cl = novoId("zl"), sp = novoId("zs"), br = novoId("zr"), sx = lerp(-700, 900, k1);
  const img = logoUri ? `<image href="${logoUri}" x="${fx}" y="${fy}" width="${lado}" height="${lado}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cl})" opacity="${op3(0.08 + 0.92 * acende)}"/>`
    : "";
  if (!logoUri) { const ls = linhasDoNome(story.banda, 10), fr = Math.min(130, 440 / ls.length, ...ls.map((l) => cabe(l, lado - 90, 130, "marker")));
    ls.forEach((l, i) => brilhante(c, 540, fy + lado / 2 + fr * 0.36 + (i - (ls.length - 1) / 2) * fr * 1.1, l, fr, cor.texto, cor.luzes[0], { fonte: "marker", op: acende })); }
  const quadroLogo = `<clipPath id="${cl}"><rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" rx="${r}"/></clipPath>
    <radialGradient id="${sp}"><stop offset="0" stop-color="${cor.luzes[0]}" stop-opacity="0.35"/><stop offset="1" stop-color="${cor.luzes[0]}" stop-opacity="0"/></radialGradient>
    <circle cx="540" cy="${fy + lado / 2}" r="520" fill="url(#${sp})" opacity="${op3(acende)}"/>
    <rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" rx="${r}" fill="#000" opacity="0.6"/>${img}
    <linearGradient id="${br}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    ${k1 < 1 ? `<g clip-path="url(#${cl})"><rect x="${f1(fx + sx)}" y="${fy - 200}" width="220" height="${lado + 400}" fill="url(#${br})" transform="rotate(20 ${f1(fx + sx + 110)} ${fy + lado / 2})"/></g>` : ""}`;
  const yc = fy + lado + 140, fc = cabe(conta, 860, 74, "interXB"), wc = largura(conta, fc, "interXB");
  brilhante(c, 540, yc, conta, fc, cor.texto, cor.luzes[0], { fonte: "interXB", op: p(T, 3.65, 0.4) });
  luz(c, trilha(assinatura(540 - wc / 2 - 20, 540 + wc / 2 + 10, yc + 38, 7)), cor.luzes[2], p(T, 3.9, 0.6, (u) => u), { w: 0.5, semente: 12 });
  const linhas = [story.desde ? `na estrada desde ${story.desde}` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const info = linhas.map((l, i) => txt(540, yc + 140 + i * 64, l, cabe(l, 820, 46, "inter"), cor.texto, { fonte: "inter", op: 0.88 * p(T, 4.1 + i * 0.2, 0.4) })).join("");
  return fundo(T, cor) + exif(cor) + quadroLogo + pinta(c) + info;
}
