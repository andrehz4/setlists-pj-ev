// Layout J, "Conversa": o story como um grupo de amigos combinando o show. Notificação sobre o clipe, amigo manda o
// logo, a localização e o convite com os shows; no final o link é digitado e enviado. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo, cenaLocal } from "./cenas-chat.mjs";
import { cenaConvite, cenaFinal } from "./cenas-convite.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "noite", bg: "#0e1621", topo: "#17212b", eu: "#2b5278", textoEu: "#ffffff", outro: "#182533", texto: "#f5f5f5", apoio: "#7f91a4", acento: "#5eb5f7" },
  { nome: "dia", bg: "#dfe6ee", topo: "#ffffff", eu: "#3a7bd5", textoEu: "#ffffff", outro: "#ffffff", texto: "#14181d", apoio: "#6b7785", acento: "#e0572b" },
  { nome: "grafite", bg: "#121212", topo: "#1e1e1e", eu: "#ff6a2b", textoEu: "#121212", outro: "#2a2a2a", texto: "#f2f2f2", apoio: "#8d8d8d", acento: "#ff6a2b" },
  { nome: "roxo", bg: "#1d1430", topo: "#2a1e45", eu: "#b56cff", textoEu: "#160d26", outro: "#2f2350", texto: "#f3eefc", apoio: "#9a8bbd", acento: "#ffd34d" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaLocal(T, story, cor)}${cenaConvite(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
