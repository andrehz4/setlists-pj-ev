// Layout D, cenas 1 (abertura sobre o clipe: bloco de cor entra da esquerda com o nome da banda em até 4 linhas,
// 0 a 3) e 2 (logo quadrado na grade, coluna do ano, conta e base, 3 a 5.5).
import { lerp } from "../../tempo.mjs";
import { mask, filete, pr, out, io, texto, cabe, quebra, dataCurta, novoId, f1 } from "./pecas.mjs";

const CR = "#f4f1ea";

// geometria da abertura (spec D, cena 1)
export function modeloAbertura(story) {
  const nm = quebra(String(story.banda).toUpperCase(), 960, 4, 300, 100), n = nm.linhas.length;
  const linhas = nm.linhas.map((t, i) => ({ t, y: 1590 - (n - 1 - i) * nm.F * 0.9, at: 0.12 + i * 0.08 }));
  const ruleY = linhas[0].y - nm.F * 0.75 - 44, labelY = ruleY - 26;
  return { F: nm.F, linhas, ruleY, labelY, topo: labelY - 36 - 56 };
}

export function abertura(T, story, cor, M) {
  if (T >= 3) return "";
  const A = M.abertura, wipe = pr(T, 0, 0.35, io), sai = pr(T, 2.55, 0.3, io);
  const topo = lerp(A.topo, 0, pr(T, 2.6, 0.4, io));
  const bloco = wipe > 0
    ? `<rect x="0" y="${f1(topo)}" width="${f1(1080 * wipe)}" height="${f1(1920 - topo)}" fill="${cor.bg}"/>` : "";
  const rot = `HOJE · ${dataCurta(story.dia)}`;
  return bloco +
    mask("SÓ MAIS UM FÃ DE PEARL JAM", { y: 290, F: 30, fonte: "xb", fill: CR, p: pr(T, 0.1, 0.4), q: sai }) +
    mask("AGENDA", { x: 1020, y: 290, F: 30, fonte: "xb", fill: CR, anchor: "end", p: pr(T, 0.15, 0.4), q: sai }) +
    filete(312, pr(T, 0.1, 0.45, io) * (1 - sai), CR) +
    mask(rot, { y: A.labelY, F: cabe(rot, 960, 36, "xb"), fonte: "xb", fill: cor.ink, p: pr(T, 0.1, 0.4), q: sai }) +
    filete(A.ruleY, pr(T, 0.08, 0.45, io) * (1 - sai), cor.ink) +
    A.linhas.map((l, i) => mask(l.t, { y: l.y, F: A.F, fill: cor.ink, p: pr(T, l.at, 0.42),
      q: pr(T, 2.55 + i * 0.04, 0.3, io) })).join("");
}

// sem logo: o nome da banda no quadrado, em `on`
function reserva(story, x, y, s, cor) {
  const nm = quebra(String(story.banda).toUpperCase(), s - 80, 4, 120, 40), passo = nm.F * 0.95;
  const y0 = y + s / 2 - (nm.linhas.length * passo) / 2 + nm.F * 0.78;
  return nm.linhas.map((l, i) => texto(x + s / 2, y0 + i * passo, l, nm.F, cor.on, "ab", "middle")).join("");
}

export function modeloLogo(story) {
  const B = String(story.banda).toUpperCase(), conta = story.conta || "";
  const base = story.cidadeBase ? String(story.cidadeBase).replace("/", " / ").toUpperCase() : "";
  const ano = /^\d{4}$/.test(String(story.desde ?? "")) ? String(story.desde) : "";
  return { B, fB: cabe(B, 960, 72), conta, fConta: cabe(conta, 960, 64, "xb"), base, fBase: cabe(base, 960, 84),
    ano, fAno: Math.min(170, cabe(ano.slice(0, 2), 300, 170), cabe(ano.slice(2), 300, 170)) };
}

export function cenaLogo(T, story, cor, M, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const L = M.logo, r = (t) => pr(T, t, 0.4, io), m = (t) => pr(T, t, 0.42, out), lg = r(3.2), cl = novoId("dl");
  const img = logoUri ? `<image href="${logoUri}" x="60" y="390" width="620" height="620" preserveAspectRatio="xMidYMid slice"/>`
    : reserva(story, 60, 390, 620, cor);
  const logo = lg > 0 ? `<clipPath id="${cl}"><rect x="60" y="390" width="620" height="${f1(620 * lg)}"/></clipPath>
    <g clip-path="url(#${cl})"><rect x="60" y="390" width="620" height="620" fill="${cor.blk}"/>${img}</g>` : "";
  const ink = cor.ink;
  const ano = L.ano ? mask("DESDE", { x: 712, y: 432, F: 30, fonte: "xb", fill: ink, p: m(3.45) }) +
    mask(L.ano.slice(0, 2), { x: 706, y: 620, F: L.fAno, fill: ink, p: m(3.5) }) +
    mask(L.ano.slice(2), { x: 706, y: 810, F: L.fAno, fill: ink, p: m(3.6) }) : "";
  const conta = L.conta ? mask("CONTA", { y: 1120, F: 28, fonte: "xb", fill: ink, p: m(3.8) }) +
    mask(L.conta, { y: 1200, F: L.fConta, fonte: "xb", fill: ink, p: m(3.85) }) + filete(1260, r(3.9), ink) : "";
  const base = L.base ? mask("BASE", { y: 1310, F: 28, fonte: "xb", fill: ink, p: m(4.0) }) +
    mask(L.base, { y: 1410, F: L.fBase, fill: ink, p: m(4.05) }) : "";
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>` +
    mask(L.B, { y: 318, F: L.fB, fill: ink, p: m(3.05) }) + filete(350, r(3.0), ink) + logo + ano +
    filete(1070, r(3.7), ink) + conta + base;
}
