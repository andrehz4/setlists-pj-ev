// Layout N, "Rádio FM": o story como um receiver anos 70. O ponteiro procura a estação e o visor acende com a banda,
// o logo sai do alto-falante, o visor vira radar no estado, cada show é uma estação do dial e o pedido de compartilhar
// fecha no visor. Desenho do Claude Code (13/11/2026).
import { DEFS } from "./pecas.mjs";
import { abertura, cenaLogo } from "./cenas-sintonia.mjs";
import { cenaEstado } from "./cenas-sinal.mjs";
import { cenaShows, cenaFinal } from "./cenas-programa.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "prata", rotulo: "#e4e7ea", bg: "#1c2a3a", veio: "#223447", painel: "#c9ced3", botao: "#e4e7ea", mostrador: "#efe6cf", visor: "#07121d", luz: "#7fd4ff", texto: "#14181d", apoio: "#56606b", acento: "#e03a2b" },
  { nome: "madeira", rotulo: "#f3e4cc", bg: "#5a3a22", veio: "#4a2f1b", painel: "#2a1f17", botao: "#3a2c21", mostrador: "#f1e2c2", visor: "#140b04", luz: "#ffb547", texto: "#f3e4cc", apoio: "#b89870", acento: "#ff5a2b" },
  { nome: "fosforo", rotulo: "#e8e8e8", bg: "#0d0d0d", veio: "#151515", painel: "#1b1b1b", botao: "#2a2a2a", mostrador: "#d9e8dc", visor: "#021008", luz: "#4dff88", texto: "#e8e8e8", apoio: "#808080", acento: "#ff3b30" },
  { nome: "creme", rotulo: "#fbf4e4", bg: "#8e1f1b", veio: "#7d1a17", painel: "#efe4cf", botao: "#d9ccb2", mostrador: "#fbf4e4", visor: "#2a0d0a", luz: "#ffcf7a", texto: "#2a1410", apoio: "#8a6a5a", acento: "#c8231b" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${DEFS}
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaEstado(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
