// Layout T, "Binaural": homenagem ao clima do álbum de 2000 (espaço profundo e som em dois canais), sem foto, sem
// logotipo e sem o nome do disco. A nebulosa se forma por cima do clipe e o nome da banda aparece como constelação
// nova; depois o logo no visor do telescópio, o estado como carta celeste, um objeto catalogado por show e, no final,
// as ondas L e R do osciloscópio viram uma só e trazem a chamada. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows } from "./cenas-servico.mjs";
import { cenaFinal } from "./cenas-final.mjs";

// 4 temas na ordem da roda de cores do story (azul profundo, ocre/âmbar de nebulosa, preto absoluto, vermelho/magenta).
// bg/bg2 = céu (centro/borda); neb* = nuvens da nebulosa; estrela/quente = estrelas; linha = traço da carta; texto/
// texto2 = texto forte/fraco; acento = números e destaques; reticula = mira do visor; canalL/canalR = ondas.
export const temas = [
  { nome: "azul", bg: "#0b1f4a", bg2: "#020716", neb1: "#2f6fd6", neb2: "#7b4fd0", neb3: "#36c0e0", estrela: "#f2f6ff", quente: "#ffd9a0",
    linha: "#9fc3ff", texto: "#f4f7ff", texto2: "#a9bce0", acento: "#6fe0ff", reticula: "#ff6b5a", canalL: "#6fe0ff", canalR: "#ff8ad8" },
  { nome: "ambar", bg: "#3a210a", bg2: "#0f0702", neb1: "#e08a2a", neb2: "#b5481c", neb3: "#f2c25a", estrela: "#fff4e0", quente: "#ffd27a",
    linha: "#f0c27e", texto: "#fff3df", texto2: "#d9b88a", acento: "#ffb340", reticula: "#ffe2a8", canalL: "#ffb340", canalR: "#ff6a3d" },
  { nome: "breu", bg: "#0b0b0e", bg2: "#000000", neb1: "#3a3a46", neb2: "#26262e", neb3: "#5a5a66", estrela: "#ffffff", quente: "#ffffff",
    linha: "#d8d8d8", texto: "#ffffff", texto2: "#9c9c9c", acento: "#ffffff", reticula: "#ffffff", canalL: "#ffffff", canalR: "#8c8c8c" },
  { nome: "magenta", bg: "#3d0a26", bg2: "#0e0208", neb1: "#e0306a", neb2: "#9b2bd0", neb3: "#ff6a4a", estrela: "#fff0f6", quente: "#ffc2d8",
    linha: "#ff9fc6", texto: "#fff2f7", texto2: "#e0a6c0", acento: "#ff4f8b", reticula: "#ffd0e0", canalL: "#ff4f8b", canalR: "#ffb04a" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
