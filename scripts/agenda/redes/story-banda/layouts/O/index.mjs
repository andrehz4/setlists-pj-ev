// Layout O, "Ten": homenagem ao clima do álbum de 1991 (rosa, compensado recortado, letreiro pintado à mão, mãos
// erguidas), sem reproduzir a capa, a foto ou o logotipo. Placa "HOJE TEM" sobe por cima do clipe, logo numa placa de
// madeira, estado recortado em compensado, uma placa por show e mãos erguidas no final. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho): rosa clássico, magenta escuro, roxo noite
// e creme rosado. placa = face pintada; placa2 = placa do logo; borda = madeira crua; sobreBg = texto direto no fundo.
export const temas = [
  { nome: "rosa", bg: "#ec5c98", bg1: "#ec5c98", bg2: "#b3245f", luz: "#ffe0ee", placa: "#2e1b14", placa2: "#f3e4d0", borda: "#e2b98a", veio: "#000000", tinta: "#ffeef5", tinta2: "#ff6fa8", tinta3: "#2e1b14", mao: "#2a1712", sobreBg: "#2a1018" },
  { nome: "magenta", bg: "#a3205f", bg1: "#a3205f", bg2: "#4c0a2b", luz: "#ff8cc0", placa: "#f3e4d0", placa2: "#f3e4d0", borda: "#c99a6a", veio: "#5a3420", tinta: "#3b0f24", tinta2: "#c2185b", tinta3: "#3b0f24", mao: "#1c0510", sobreBg: "#ffe3ef" },
  { nome: "roxo", bg: "#4d2070", bg1: "#4d2070", bg2: "#170a2a", luz: "#d98bff", placa: "#f6e3f0", placa2: "#f1e2d2", borda: "#e0b88f", veio: "#5a2a6a", tinta: "#2a1238", tinta2: "#d6338a", tinta3: "#2a1238", mao: "#12061f", sobreBg: "#ffd6ee" },
  { nome: "creme", bg: "#ffdbe8", bg1: "#ffdbe8", bg2: "#f3a2c3", luz: "#fff8ee", placa: "#3a2418", placa2: "#fff4ea", borda: "#e2b98a", veio: "#000000", tinta: "#fff0f5", tinta2: "#e83f86", tinta3: "#3a2418", mao: "#5a2340", sobreBg: "#3a1428" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
