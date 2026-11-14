// Layout K, "Setlist de palco": a folha do setlist colada com fita crepe no chão do palco. O nome da banda é o
// título, o logo vem colado, o mapa é desenhado à caneta, os shows viram as músicas da lista e o bis pede o
// compartilhamento. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo, cenaEstado } from "./cenas-folha.mjs";
import { cenaShows, cenaFinal } from "./cenas-lista.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "branco", bg: "#161b24", palco: "#161b24", palco2: "#1b212c", papel: "#f6f3ea", tinta: "#15171c", acento: "#1f57c3", fita: "#e2d6b0", luz: "#9cc2ff" },
  { nome: "kraft", bg: "#1f1710", palco: "#1f1710", palco2: "#271d14", papel: "#c9a46b", tinta: "#1d140a", acento: "#8f1d0e", fita: "#efe6cf", luz: "#ffcf80" },
  { nome: "pautado", bg: "#0b0b0b", palco: "#0b0b0b", palco2: "#141414", papel: "#fbfaf4", linha: "#a9c1dd", margem: "#e88a8a", tinta: "#111111", acento: "#c2410c", fita: "#ddd3b8", luz: "#ffffff" },
  { nome: "marcador", bg: "#1c0e0c", palco: "#1c0e0c", palco2: "#241311", papel: "#fffdf6", tinta: "#151515", acento: "#e10600", fita: "#d9cfb4", luz: "#ff7a66" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaEstado(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
