// Layout I, "Edição Extra": primeira página de jornal girando sobre o clipe, perfil com foto em retícula,
// infográfico hachurado, box de SERVIÇO e manchete final com carimbo. Desenho do Claude Code (13/11/2026).
import { abertura, cenaPerfil } from "./cenas-capa.mjs";
import { cenaMapa, cenaServico, cenaFinal } from "./cenas-servico.mjs";

// 4 temas, na ordem da roda de cores do story (azul, ocre, preto, vermelho)
export const temas = [
  { nome: "jornal", bg: "#f2ede1", tinta: "#141414", acento: "#c8102e", sobreAcento: "#f2ede1" },
  { nome: "salmao", bg: "#f4d9c6", tinta: "#1c1714", acento: "#0f4c81", sobreAcento: "#f4d9c6" },
  { nome: "negativo", bg: "#161514", tinta: "#eee6d6", acento: "#ffcf3f", sobreAcento: "#161514" },
  { nome: "sepia", bg: "#e9dcc2", tinta: "#2a1f14", acento: "#8a2b1d", sobreAcento: "#e9dcc2" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaPerfil(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaServico(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
