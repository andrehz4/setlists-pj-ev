// Layout Q, "Vitalogy": homenagem ao clima do álbum de 1994 (velho livro de medicina caseira), sem foto, sem logotipo
// e sem o nome do disco. Capa de tecido com o título gravado em dourado sobe por cima do clipe; depois as páginas viram:
// logo como "Fig. 1", estado como prancha de atlas, índice com um capítulo por show e, no verso da capa, o carimbo
// pedindo pra compartilhar. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). capa/capa2 = tecido; ouro* = relevo
// dourado; papel/papel2 = página (centro/borda queimada); mancha = umidade e mofo; tinta = texto; acento = tinta
// vermelha (nota na margem, carimbo, números); canto = cantoneira de foto.
export const temas = [
  { nome: "ferrugem", bg: "#3f140b", capa: "#7a2c1d", capa2: "#3f140b", ouroEsc: "#7d5a22", ouro: "#d2a94f", ouroClaro: "#f6e2a2",
    papel: "#efe2c1", papel2: "#cdb487", mancha: "#7a5222", tinta: "#33200f", acento: "#a3291a", canto: "#2a1a0e" },
  { nome: "musgo", bg: "#1c2310", capa: "#3f4a2a", capa2: "#1c2310", ouroEsc: "#7a5e24", ouro: "#d4b25a", ouroClaro: "#f7e6a8",
    papel: "#ece2c2", papel2: "#c9b98c", mancha: "#6b5826", tinta: "#2c2612", acento: "#8f2a17", canto: "#24210f" },
  { nome: "couro", bg: "#1e1009", capa: "#4a2d1a", capa2: "#1e1009", ouroEsc: "#79551f", ouro: "#cda24c", ouroClaro: "#f3dc98",
    papel: "#e9dab4", papel2: "#c4a874", mancha: "#6e4a1c", tinta: "#2a190c", acento: "#8a2416", canto: "#1e1209" },
  { nome: "creme", bg: "#b59d6c", capa: "#e2d3ae", capa2: "#b59d6c", ouroEsc: "#4a2c12", ouro: "#7a4a1e", ouroClaro: "#a8703a",
    papel: "#f6eed8", papel2: "#ddcaa0", mancha: "#8a6a3a", tinta: "#4a2c14", acento: "#9c3a1c", canto: "#4a2c14" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
