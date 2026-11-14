// Layout L, "Fita cassete": o story como uma mixtape. A fita entra no deck e o PLAY aperta, o encarte mostra o logo e
// desdobra no mapa, o LADO A lista os shows como faixas e no final a fita rebobina. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-deck.mjs";
import { cenaEstado, cenaLadoA, cenaFinal } from "./cenas-encarte.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "azul", bg: "#10213a", corpo: "#2b4c74", borda: "#0b1628", janela: "#0b1628", etiqueta: "#f4efe2", faixa: "#3d7fd1", fita: "#4a3424", papel: "#f4efe2", tinta: "#1c2b44", texto: "#f2f5fa", apoio: "#8ea6c4", acento: "#ffcf3f", sobreAcento: "#10213a" },
  { nome: "preta", bg: "#e9dcc0", corpo: "#1d1a17", borda: "#000000", janela: "#3a332c", etiqueta: "#fbf6ea", faixa: "#d9822b", fita: "#5a3e2a", papel: "#fbf6ea", tinta: "#1d1a17", texto: "#1d1a17", apoio: "#7a6a52", acento: "#c6501e", sobreAcento: "#fbf6ea" },
  { nome: "cromo", bg: "#121212", corpo: "#9a9ea3", borda: "#3c4046", janela: "#2a2d31", etiqueta: "#ececec", faixa: "#1f1f1f", fita: "#4a3424", papel: "#ececec", tinta: "#141414", texto: "#f0f0f0", apoio: "#8a8a8a", acento: "#ff5a36", sobreAcento: "#121212" },
  { nome: "vermelha", bg: "#22100f", corpo: "#d8342a", borda: "#6e1311", janela: "#3a0d0b", etiqueta: "#fff3dc", faixa: "#151515", fita: "#4a3424", papel: "#fff3dc", tinta: "#151515", texto: "#fff3dc", apoio: "#e3a597", acento: "#ffcf3f", sobreAcento: "#151515" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaEstado(T, story, cor)}${cenaLadoA(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
