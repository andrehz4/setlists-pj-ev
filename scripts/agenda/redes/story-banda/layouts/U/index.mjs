// Layout U, "Riot Act": homenagem ao clima do álbum de 2002 (documento oficial de protesto num inverno seco), sem
// foto, sem logotipo e sem o nome do disco. Meia folha de ofício sobe por cima do clipe e o nome é batido na máquina
// letra a letra; depois, sob céu cinza frio e galhos secos: ficha com o logo grampeado como anexo, mapa em papel
// quadriculado preso com clipe e pinos à caneta, relação de shows com um carimbo em cada linha e o carimbo grande com
// assinatura no despacho final. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho): azul-acinzentado frio, ocre de papel velho,
// papel carbono (folha escura, letra azulada) e branco com carimbo vermelho. ceu/ceu2/sol = céu; galho = traço das
// árvores; papel/papel2/mancha = folha; tinta = fita da máquina; carimbo; caneta = esferográfica; metal = grampo e
// clipe; foto = papel do anexo e do mapa; quadro = quadriculado.
export const temas = [
  { nome: "frio", bg: "#4b5866", ceu: "#8696a4", ceu2: "#3c4855", sol: "#eef2f5", grao: "#0f1720", graoOp: 0.12, galho: "#1a222b",
    papel: "#ece6d6", papel2: "#cbc2aa", mancha: "#6f6248", tinta: "#1b2230", carimbo: "#2f4d8a", caneta: "#1d3f9c",
    metal: "#d2d7dc", metal2: "#6c757e", foto: "#f6f4ee", quadro: "#7c99b8" },
  { nome: "ocre", bg: "#8a7550", ceu: "#b7a785", ceu2: "#6d5c3e", sol: "#f6eedb", grao: "#2a1f10", graoOp: 0.13, galho: "#2b2113",
    papel: "#ecdcb2", papel2: "#c9ad74", mancha: "#7a5a26", tinta: "#2a1e10", carimbo: "#8a2f17", caneta: "#23379a",
    metal: "#d9d4c8", metal2: "#7b7362", foto: "#f4ead0", quadro: "#b39a66" },
  { nome: "carbono", bg: "#101114", ceu: "#2c3036", ceu2: "#08090b", sol: "#c9d1dd", grao: "#ffffff", graoOp: 0.06, galho: "#6d7682",
    papel: "#1d1f26", papel2: "#0f1014", mancha: "#4a5f8f", tinta: "#b9c6e6", carimbo: "#8fa8e0", caneta: "#d9e2f5",
    metal: "#c7ccd3", metal2: "#4c535c", foto: "#262933", quadro: "#4a5f8f" },
  { nome: "branco", bg: "#c9cdd1", ceu: "#e3e6e8", ceu2: "#aab0b6", sol: "#ffffff", grao: "#000000", graoOp: 0.09, galho: "#2a2d31",
    papel: "#fbfbf7", papel2: "#e3e1d8", mancha: "#8e8a7c", tinta: "#151515", carimbo: "#cc1f17", caneta: "#1c2f8c",
    metal: "#d6d9dd", metal2: "#71777e", foto: "#ffffff", quadro: "#9fb3c6" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
