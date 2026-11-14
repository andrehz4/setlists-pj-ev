// Layout Y, gelo e degelo: homenagem ao clima do álbum de 2020 (geleira, água escura, céu polar com aurora), sem foto,
// sem logotipo, sem o nome do disco e sem a composição da capa. Um bloco de gelo racha por cima do clipe e mostra o nome
// gravado; depois o logo congelado num cubo, o estado como carta náutica com linhas de profundidade e boias, uma placa
// de gelo flutuante por show e a aurora escrevendo o pedido de compartilhar. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows } from "./cenas-servico.mjs";
import { cenaFinal } from "./cenas-final.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). ceu1..3 = céu de cima pro horizonte;
// aurora1..3 = cortinas; at1/at2 = texto escrito pela aurora; agua/agua2/reflexo = mar; gelo1..3 = luz, meio e sombra
// do gelo; brilho = aresta; entalhe = texto gravado; hora = hora na placa; carta/cartaLinha/terra = carta náutica;
// sobreCeu = texto no céu e na carta; sobreAgua = texto na água; acento = boia, termômetro.
const base = { estrela: "#ffffff", brilho: "#ffffff", graoCor: "#ffffff", graoOp: 0.06, sobreAgua: "#f2fbff" };
export const temas = [
  { ...base, nome: "glacial", bg: "#0a2238", ceu1: "#03101f", ceu2: "#0d3555", ceu3: "#2a6f93", aurora1: "#7ff0e0", aurora2: "#58b8ff", aurora3: "#b9a6ff",
    at1: "#c8fff4", at2: "#7cc8ff", estrelaOp: 0.8, agua: "#020a14", agua2: "#0c2a40", reflexo: "#9fe3ff", gelo1: "#effbff", gelo2: "#94d2ef", gelo3: "#2b6f99",
    entalhe: "#0e3d5e", hora: "#0b5f8f", carta: "#0a2b44", cartaLinha: "#7fc8e8", terra: "#e8f7ff", sobreCeu: "#f2fbff", acento: "#ff7a3d", sobreAcento: "#ffffff" },
  { ...base, nome: "ambar", bg: "#2a1620", ceu1: "#1a1030", ceu2: "#7a3a46", ceu3: "#f0a050", aurora1: "#ffd27a", aurora2: "#ff9a5a", aurora3: "#ffb8a0",
    at1: "#ffe7a8", at2: "#ffa86a", estrela: "#fff3d8", estrelaOp: 0.4, agua: "#120a12", agua2: "#4a2430", reflexo: "#ffc27a", gelo1: "#fff5e4", gelo2: "#f0bf8e", gelo3: "#8a5a6a",
    brilho: "#fffaf0", entalhe: "#5a2626", hora: "#a8471a", carta: "#341b26", cartaLinha: "#f0b880", terra: "#fbe8cc", sobreCeu: "#fff4e2", sobreAgua: "#fff4e2", acento: "#ff8a3a", sobreAcento: "#2a1220" },
  { ...base, nome: "noite", bg: "#000000", ceu1: "#000000", ceu2: "#02100b", ceu3: "#0a2a20", aurora1: "#4dff9a", aurora2: "#1fd6a0", aurora3: "#a0ff6a",
    at1: "#b6ffd2", at2: "#4dff9a", estrelaOp: 0.95, agua: "#000000", agua2: "#04140f", reflexo: "#5effb0", gelo1: "#dbf3ef", gelo2: "#74abab", gelo3: "#1d3d42",
    brilho: "#f4fffc", entalhe: "#0b2828", hora: "#0d6e44", carta: "#020c09", cartaLinha: "#3fcf8a", terra: "#d2eee7", sobreCeu: "#e8fff4", acento: "#4dff9a", sobreAcento: "#00140a" },
  { ...base, nome: "neve", bg: "#eef3f6", ceu1: "#f7fafc", ceu2: "#e6eef4", ceu3: "#c9dae6", aurora1: "#e8423a", aurora2: "#9cc6e0", aurora3: "#f2b0aa",
    at1: "#d7261e", at2: "#1d4f75", estrela: "#9fb4c4", estrelaOp: 0, agua: "#2c3a45", agua2: "#6f8798", reflexo: "#ffffff", gelo1: "#ffffff", gelo2: "#cfe2ee", gelo3: "#7d9fb5",
    graoCor: "#1a2b38", graoOp: 0.05, entalhe: "#1a2b38", hora: "#d7261e", carta: "#f4f8fb", cartaLinha: "#6f93ab", terra: "#ffffff", sobreCeu: "#14222d", acento: "#d7261e", sobreAcento: "#ffffff" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
