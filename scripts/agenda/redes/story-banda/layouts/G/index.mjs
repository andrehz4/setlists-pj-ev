// Layout G, "painel de embarque": letras em plaquinhas split-flap, mapa de LED e os shows como partidas de hoje.
// Desenho do Claude Code (13/11/2026), na mesma régua de tempo do story por banda (tempo.mjs).
import { abertura, cenaLogo } from "./cenas-abertura.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-shows.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "aeroporto", bg: "#0b1f44", placa: "#16326b", placaClara: "#1f4185", letra: "#ffffff", acento: "#ffd23f", apoio: "#8fa6cf" },
  { nome: "ferrovia", bg: "#0f2a22", placa: "#184335", placaClara: "#215544", letra: "#f4efe1", acento: "#ffb627", apoio: "#8fb3a3" },
  { nome: "noturno", bg: "#0e1116", placa: "#1d222b", placaClara: "#2a313d", letra: "#f2f2f2", acento: "#ffb400", apoio: "#7d8696" },
  { nome: "sinal", bg: "#161212", placa: "#2a2222", placaClara: "#3a2e2e", letra: "#fbf4ec", acento: "#ff3b2f", apoio: "#a18f8a" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
