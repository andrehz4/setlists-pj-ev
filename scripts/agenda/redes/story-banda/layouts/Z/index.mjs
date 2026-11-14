// Layout Z, homenagem ao clima do álbum de 2024 em PINTURA COM LUZ (longa exposição sobre o preto), sem a capa, sem a
// composição dela, sem logotipo e sem o nome do disco. Lanternas rabiscam por cima do clipe e escrevem "HOJE TEM" e
// o nome da banda; depois duas luzes contornam o logo, uma desenha o contorno do estado, um traço contínuo liga os
// shows e a chamada final é escrita em luz. Texto sempre nítido: o brilho fica em volta. Desenho do Claude Code (13/11/2026).
import { DEFS } from "./pecas.mjs";
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa } from "./cenas-mapa.mjs";
import { cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). bg/bg2 = preto da borda/centro;
// luzes = cores das lanternas (a 1a domina, a 4a só no rabisco de fundo); texto = letra nítida; acento = hora.
export const temas = [
  { nome: "ciano", bg: "#010309", bg2: "#06101c", luzes: ["#22d3ee", "#3b82f6", "#34f5a0", "#a5f3fc"], texto: "#f3fbff", acento: "#5ee7ff" },
  { nome: "ambar", bg: "#060301", bg2: "#140b04", luzes: ["#ff8a1f", "#ffb020", "#ff4f2a", "#ffd27a"], texto: "#fff7ec", acento: "#ffb547" },
  { nome: "branco", bg: "#000000", bg2: "#000000", luzes: ["#ffffff", "#eef2f7", "#fff3df", "#cfd5dd"], texto: "#ffffff", acento: "#ffffff" },
  { nome: "magenta", bg: "#070106", bg2: "#160512", luzes: ["#ff2bd6", "#ff3355", "#ff6a2b", "#ff8ad0"], texto: "#fff3fa", acento: "#ff5ad8" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${DEFS}
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, story, cor)}</svg>`;
}
