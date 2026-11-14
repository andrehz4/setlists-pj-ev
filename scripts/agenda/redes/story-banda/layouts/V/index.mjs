// Layout V, "o disco do abacate": homenagem ao clima do álbum de 2006 numa feira livre brasileira, sem foto, sem
// logotipo e sem o nome do disco. Toldo listrado desce por cima do clipe e um abacate abre ao meio com "HOJE TEM" no
// caroço e a banda escrita na polpa; depois o logo vira rótulo colado no caixote, o estado aparece riscado no papel de
// embrulho com etiquetas de preço de pino, cada show ganha uma plaquinha espetada no caixote e o final é o letreiro
// pintado na faixa do toldo. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho): verde abacate, madeira, feira à noite
// (lâmpada acesa) e branco com toldo vermelho. toldoA/B = listras; faixa = letreiro do toldo; mad* = madeira;
// papel* = embrulho; lapis = traço no papel; placa = cartolina da plaquinha; acento = pincel vermelho do preço;
// rotulo = rótulo do caixote; polpaTinta = texto escrito na polpa; luz = força do halo da lâmpada (0 = apagada).
const BASE = { graoCor: "#000", lapis: "#2b1d10", placaTinta: "#141210", barbante: "#e9e2d0", luzCor: "#ffd27a", polpaTinta: "#1f3a0e",
  rotuloTinta: "#1b1610", carocoTinta: "#fbf0d6", luz: 0 };
export const temas = [
  { ...BASE, nome: "abacate", bg: "#24502a", bg2: "#0f2713", sobreBg: "#f5eed4", toldoA: "#2f7034", toldoB: "#f1e9cc", faixa: "#245a28",
    faixaTinta: "#f7f0d4", mad: "#b88a54", mad2: "#7a5431", veio: "#5a3a1d", papel: "#d9bc8e", papel2: "#b39066", placa: "#fbf7e9",
    acento: "#d1291e", etiq: "#fffdf4", rotulo: "#f4ecd2" },
  { ...BASE, nome: "madeira", bg: "#9a6a2e", bg2: "#4f3112", sobreBg: "#fbf0d8", toldoA: "#c9862b", toldoB: "#f6e8c6", faixa: "#6e4118",
    faixaTinta: "#fbeccb", mad: "#c99e62", mad2: "#8a6136", veio: "#5c3c1c", papel: "#e2c99c", papel2: "#bc9b6c", placa: "#f7d93e",
    acento: "#c3261a", etiq: "#fffbea", rotulo: "#f6ead0" },
  { ...BASE, nome: "noite", bg: "#17130d", bg2: "#030302", graoCor: "#fff", sobreBg: "#ffe2a0", toldoA: "#24324a", toldoB: "#d6b25a",
    faixa: "#16203a", faixaTinta: "#ffd77d", mad: "#9a6e40", mad2: "#5a3c1e", veio: "#3b2511", papel: "#c9ab7e", papel2: "#957650",
    placa: "#fbf4dd", acento: "#e3321f", etiq: "#fff8e6", rotulo: "#f3e6c8", luz: 1 },
  { ...BASE, nome: "toldo", bg: "#f3eee3", bg2: "#d8cfbd", sobreBg: "#1c1612", toldoA: "#d4291d", toldoB: "#fbf8f0", faixa: "#d4291d",
    faixaTinta: "#fffaf0", mad: "#d4b386", mad2: "#9d7a4e", veio: "#6e5030", papel: "#e6d2ad", papel2: "#c4a77c", placa: "#ffffff",
    acento: "#d4291d", etiq: "#ffffff", rotulo: "#fffaf0" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
