// Layout F "Painel" do Claude Design (MOTION-SPEC-banda-F): quadro de partidas de rodoviária, com pastilhas split-flap
// que embaralham e param letra por letra, mapa de LEDs em grade de pontos e texto digitado com cursor. Fonte única
// JetBrains Mono 800. Cenas: abertura 0 a 3, logo 3 a 5.5, mapa 5.5 a 9, partidas 9 a 12.5, final 12.5 a 15.
import { abertura, cenaLogo } from "./cenas-abertura.mjs";
import { cenaMapaShows, cenaFinal } from "./cenas-painel.mjs";

// 4 temas do Design (bg, tile = pastilha, ch = caractere, dim = pontos apagados, acc = destaque) na ordem da roda de
// cores do story: azul = metrô (fundo marinho), ocre = âmbar (letra âmbar), preto = verde fósforo (fundo quase preto),
// vermelho = placa (o Design não tem tema vermelho; a placa verde é o que sobra e fica bem distinta das outras três).
export const temas = [
  { nome: "metro", bg: "#0f2247", tile: "#0a1834", ch: "#f4f1e8", dim: "#2a3f6e", acc: "#ff8a1f" },
  { nome: "ambar", bg: "#0e0f11", tile: "#1f2125", ch: "#ffb21a", dim: "#3a3b40", acc: "#ff5a3c" },
  { nome: "verde", bg: "#0b1411", tile: "#17251f", ch: "#8af0ab", dim: "#2c4238", acc: "#ffd24a" },
  { nome: "placa", bg: "#0f4f34", tile: "#0a3a26", ch: "#ffffff", dim: "#2f7656", acc: "#ffd24a" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">` +
    `${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
