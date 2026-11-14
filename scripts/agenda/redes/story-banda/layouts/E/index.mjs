// Layout E do Claude Design, "Bilhete": gravura e ingresso de teatro. Serifa itálica grande, filetes e moldura
// dourados, ornamento de losango, entradas lentas por fade com o espaçamento entre letras fechando. Abertura sobre o
// clipe, medalhão do logo, mapa em gravura com rosa dos ventos, um ingresso por show e o convite final.
// Régua: design-handoff/retorno/story-mapa/layouts-DEF/MOTION-SPEC-banda-E.md.
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa } from "./cena-mapa.mjs";
import { cenaShows, cenaFinal } from "./cenas-servico.mjs";
import { moldura } from "./pecas.mjs";

// Os 4 temas do desenho na ordem da roda de cores do story (azul, ocre, preto, vermelho): noite, floresta, ameixa, vinho.
export const temas = [
  { nome: "noite", bg: "#101a33", gold: "#e3c58b", paper: "#f2ecdf" },
  { nome: "floresta", bg: "#13301f", gold: "#d4b06a", paper: "#f1ead8" },
  { nome: "ameixa", bg: "#38203d", gold: "#e6b49a", paper: "#f4e8e0" },
  { nome: "vinho", bg: "#4a1420", gold: "#d9b36c", paper: "#f3e9d6" },
];

export function quadro(T, story, cor, logoUri) {
  const fundo = T >= 3 ? `<rect width="1080" height="1920" fill="${cor.bg}"/>${moldura(1, cor.gold)}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${fundo}` +
    `${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}` +
    `${cenaFinal(T, story, cor)}</svg>`;
}
