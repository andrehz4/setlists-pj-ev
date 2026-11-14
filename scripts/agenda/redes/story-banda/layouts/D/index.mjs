// Layout D, "Grade" (Claude Design, MOTION-SPEC-banda-D): cartaz tipográfico de grade, campos de cor chapados,
// filetes de 3 px e texto que sobe por máscara, sem rotação. Cenas: 1 abertura 0 a 3, 2 logo 3 a 5.5, 3 mapa
// 5.5 a 9, 4 shows 9 a 12.5, 5 final 12.5 a 15 (T autoral; o render.mjs converte o tempo real com b-roll).
import { abertura, cenaLogo, modeloAbertura, modeloLogo } from "./cenas-capa.mjs";
import { cenaMapa } from "./cena-mapa.mjs";
import { modeloMapa } from "./mapa-modelo.mjs";
import { cenaShows, cenaFinal, modeloShows } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho), mapeados dos 4 do Design:
// cobalto, lima, grafite e sinal. bg = fundo, ink = texto, blk = bloco chapado, on = texto sobre o bloco.
export const temas = [
  { nome: "cobalto", bg: "#ece8df", ink: "#141414", blk: "#1f3fd1", on: "#ece8df" },
  { nome: "lima", bg: "#c9e64b", ink: "#141414", blk: "#141414", on: "#c9e64b" },
  { nome: "grafite", bg: "#262626", ink: "#efece4", blk: "#f2c230", on: "#262626" },
  { nome: "sinal", bg: "#ff4f1a", ink: "#141414", blk: "#141414", on: "#f4f1ea" },
];

// geometria calculada uma vez por story (o vídeo pede 640 quadros do mesmo story)
const MODELOS = new WeakMap();
function modelo(story) {
  if (!MODELOS.has(story)) MODELOS.set(story, { abertura: modeloAbertura(story), logo: modeloLogo(story),
    mapa: modeloMapa(story), shows: modeloShows(story) });
  return MODELOS.get(story);
}

export function quadro(T, story, cor, logoUri) {
  const M = modelo(story);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor, M)}${cenaLogo(T, story, cor, M, logoUri)}${cenaMapa(T, story, cor, M)}
  ${cenaShows(T, story, cor, M)}${cenaFinal(T, cor)}</svg>`;
}
