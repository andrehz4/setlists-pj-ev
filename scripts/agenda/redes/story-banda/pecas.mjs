// Peças visuais do story por banda (MOTION-SPEC-banda): etiqueta de papel, carimbo da marca, cores e fontes.
import "../../../publish/fontconfig-boot.mjs";
import { F_ANTON, F_INTER_XB, F_PLAYFAIR } from "../../../publish/fontconfig-boot.mjs";
import { escapeXml as esc } from "../../../publish/slide/base.mjs";
import { p, pop, enter, lerp } from "./tempo.mjs";

export { esc, F_ANTON, F_INTER_XB, F_PLAYFAIR };
export const COR = { creme: "#f7f1de", papel: "#ede4cc", tinta: "#0a0908", cinza: "#9a9183", pin: "#E10600" };
export const TEMAS = { azul: "#2a5b9e", preto: "#0a0a0a", vermelho: "#E10600", ocre: "#a87f2c" };
// larguras estimadas (o spec manda trocar por medição real quando der)
export const larguraAnton = (t, f) => String(t).length * 0.5 * f;
export const larguraInter = (t, f) => String(t).length * 0.6 * f;

// Etiqueta de papel: Anton, padding 22/30/10, entra com escala 1.5 -> 1 (pop) a partir da borda esquerda.
export function etiqueta(T, { texto, x, y, f, fundo, cor, rot = 0, at, ancora = "esq" }) {
  const w = larguraAnton(texto, f) + 60, h = f + 32;
  const s = lerp(1.5, 1, p(T, at, 0.3, pop)), op = p(T, at, 0.1, enter);
  if (op <= 0) return "";
  const x0 = ancora === "centro" ? x - w / 2 : x;
  return `<g opacity="${op.toFixed(3)}" transform="translate(${x0} ${y + h / 2}) rotate(${rot}) scale(${s.toFixed(4)}) translate(0 ${-h / 2})">
  <rect width="${w}" height="${h}" fill="${fundo}"/>
  <text x="30" y="${22 + f * 0.82}" font-family="${F_ANTON}" font-size="${f}" fill="${cor}">${esc(texto)}</text></g>`;
}

// Carimbo da marca (opção A): selo creme torto em (560, 250), entra em 2.05.
export function carimbo(T) {
  const op = p(T, 2.05, 0.06, enter);
  if (op <= 0) return "";
  const s = lerp(1.7, 1, p(T, 2.05, 0.25, pop));
  return `<g opacity="${op.toFixed(3)}" transform="translate(${560 + 200} ${250 + 85}) rotate(-6) scale(${s.toFixed(4)}) translate(-200 -85)">
  <rect x="0" y="0" width="400" height="170" fill="none" stroke="${COR.creme}" stroke-width="4"/>
  <rect x="9" y="9" width="382" height="152" fill="none" stroke="${COR.creme}" stroke-width="2"/>
  <text x="200" y="52" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="30" fill="${COR.creme}">Só Mais um Fã de</text>
  <text x="200" y="104" text-anchor="middle" font-family="${F_ANTON}" font-size="50" letter-spacing="3" fill="${COR.creme}">PEARL JAM</text>
  <rect x="60" y="116" width="280" height="2" fill="${COR.creme}"/>
  <text x="200" y="148" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="26" fill="${COR.creme}">@smufdpj</text></g>`;
}

// Nome da banda em até 3 linhas, no maior corpo (240 a 110) em que cada linha caiba em 900 px.
export function quebrarNome(nome) {
  const palavras = String(nome).toUpperCase().split(/\s+/);
  for (let f = 240; f >= 110; f -= 10) {
    const linhas = [];
    for (const w of palavras) {
      const tenta = linhas.length ? `${linhas.at(-1)} ${w}` : w;
      if (linhas.length && larguraAnton(tenta, f) + 60 <= 900) linhas[linhas.length - 1] = tenta; else linhas.push(w);
    }
    if (linhas.length <= 3 && linhas.every((l) => larguraAnton(l, f) + 60 <= 900)) return { linhas, f };
  }
  return { linhas: [String(nome).toUpperCase()], f: 110 };
}
