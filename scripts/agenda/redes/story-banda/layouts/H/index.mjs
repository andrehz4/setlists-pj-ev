// Layout H, "disco de vinil": LP girando com o logo no selo, mapa dentro do selo, shows como lista de faixas da
// contracapa e capa final com adesivo. Desenho do Claude Code (13/11/2026), mesma régua de tempo (tempo.mjs).
import { abertura, cenaDisco, cenaMapa } from "./cenas-disco.mjs";
import { cenaShows, cenaFinal } from "./cenas-capa.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "creme", bg: "#efe6d2", tinta: "#1a1714", acento: "#d6402b", sobreAcento: "#1a1714", disco: "#121110" },
  { nome: "mostarda", bg: "#e3a72f", tinta: "#1b1714", acento: "#1f4e8c", sobreAcento: "#f6efe0", disco: "#121110" },
  { nome: "noite", bg: "#1a1720", tinta: "#f1e8d6", acento: "#e8b34a", sobreAcento: "#1a1720", disco: "#0b0a0d" },
  { nome: "verde", bg: "#2f5d50", tinta: "#f3ead7", acento: "#e8442e", sobreAcento: "#f3ead7", disco: "#101312" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaDisco(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
