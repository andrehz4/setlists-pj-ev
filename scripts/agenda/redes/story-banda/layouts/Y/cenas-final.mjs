// Layout Y, cena 5 (12.5 a 15): noite polar; a aurora se acende e "escreve" o pedido de compartilhar da esquerda pra
// direita, linha a linha, com brilho; depois "Siga @smufdpj", o link e uma placa de gelo pingando na água.
import { p, enter } from "../../tempo.mjs";
import { txt, cabe, largura, paisagem, novoId, f1, f3 } from "./pecas.mjs";
import { placa, gota } from "./gelo.mjs";

const SITE = "somaisumfadepearljam.com.br/agenda";
const LINHAS = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const f = Math.min(...LINHAS.map((l) => cabe(l, 860, 170, "anton", 4))), y0 = 300, g = novoId("yt"), bl = novoId("yu");
  const linhas = LINHAS.map((l, i) => {
    const k = p(T, 12.65 + i * 0.35, 0.6, enter), y = y0 + (i + 1) * f * 1.06, w = largura(l, f, "anton", 4), cl = novoId("yz");
    if (k <= 0) return "";
    // a borda da escrita é a própria aurora: uma faixa clara que corre na frente do texto
    const xb = 540 - w / 2 - 20 + (w + 40) * k;
    return `<clipPath id="${cl}"><rect x="0" y="${f1(y - f * 1.5)}" width="${f1(xb)}" height="${f1(f * 2.2)}"/></clipPath>
      <g clip-path="url(#${cl})"><g filter="url(#${bl})" opacity="0.7">${txt(540, y, l, f, `url(#${g})`, { ls: 4 })}</g>${txt(540, y, l, f, `url(#${g})`, { ls: 4 })}</g>
      ${k < 1 ? `<rect x="${f1(xb - 6)}" y="${f1(y - f * 1.05)}" width="12" height="${f1(f * 1.25)}" rx="6" fill="${cor.at1}" opacity="${f3(0.8 * (1 - k))}" filter="url(#${bl})"/>` : ""}`;
  }).join("");
  const yS = y0 + LINHAS.length * f * 1.06 + 150, ks = p(T, 13.6, 0.5, enter), kl = p(T, 13.9, 0.5, enter);
  const siga = `<g opacity="${f3(ks)}" transform="translate(0 ${f1((1 - ks) * 30)})">${txt(540, yS, "Siga @smufdpj", cabe("Siga @smufdpj", 760, 104), cor.sobreCeu)}</g>`;
  const link = txt(540, yS + 86, SITE, cabe(SITE, 840, 44, "xb"), cor.sobreCeu, { fonte: "xb", op: kl * 0.9 });
  const hz = 1420, kp = p(T, 13.2, 0.8, enter), px = 540 + Math.sin(T * 0.8) * 10, py = hz + 90 + Math.sin(T * 1.7) * 4;
  const gotas = [0.3, 0.55, 0.72].map((a, i) => gota(T, px - 260 + 520 * a, py + 44, 300 + i * 11, cor, 120)).join("");
  return paisagem(T, cor, { horizonte: hz, k: p(T, 12.5, 1.4, enter) }) +
    `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${cor.at1}"/><stop offset="0.55" stop-color="${cor.at2}"/><stop offset="1" stop-color="${cor.at1}"/></linearGradient>
    <filter id="${bl}" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>` +
    linhas + siga + link + `<g opacity="${f3(kp)}">${placa(px, py, 560, 120, 77, cor)}${gotas}</g>`;
}
