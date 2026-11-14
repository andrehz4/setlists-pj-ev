// Layout M, "Lambe-lambe": o story como cartazes de gráfica popular colados numa parede de tijolo, um por cima do
// outro. Cada cena cola um cartaz novo (desenrola de cima pra baixo, cola molhada que seca e escorre): HOJE TEM, logo,
// mapa do estado, tiras com os shows e o pedido de compartilhar. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho). Pares de cor de gráfica.
export const temas = [
  { nome: "amarelo", bg: "#3d4652", parede: "#5b6572", junta: "#434b56", papel: "#ffd400", papel2: "#f4eedd", tinta: "#111111", tinta2: "#1f3fd1", velho: "#d9d2bf", cola: "#f4f0e4" },
  { nome: "laranja", bg: "#6e3a22", parede: "#8c4b2d", junta: "#b9a48a", papel: "#ff7a1a", papel2: "#f2e8d2", tinta: "#0f3d2e", tinta2: "#111111", velho: "#e4d6bb", cola: "#f6efdf" },
  { nome: "branco", bg: "#1c1c1c", parede: "#2b2b2b", junta: "#191919", papel: "#f4f1ea", papel2: "#ffd9d6", tinta: "#e10600", tinta2: "#111111", velho: "#8a8478", cola: "#e8e4da" },
  { nome: "rosa", bg: "#5e211b", parede: "#7a2c23", junta: "#a65d4e", papel: "#ff6fb0", papel2: "#f4eedd", tinta: "#1a2fa8", tinta2: "#111111", velho: "#e1cfc4", cola: "#f7eef0" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor, logoUri)}${cenaShows(T, story, cor)}${cenaFinal(T, story, cor)}</svg>`;
}
