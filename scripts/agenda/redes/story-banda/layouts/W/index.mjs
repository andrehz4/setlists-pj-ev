// Layout W, homenagem ao clima do álbum de 2009 (verão, otimismo, tirinha colorida e máquina de escrever), sem foto,
// sem logotipo, sem o nome do disco e sem a grade de quadros da capa: desenhos próprios e genéricos. Três quadros se
// abrem por cima do clipe ("HOJE TEM!" e o nome da banda), o logo entra num quadro com "TCHAN!", o estado vira um
// quadro com retícula e balõezinhos numerados, cada show ganha um quadro na tira e, no final, a tecla de apagar
// come o rascunho e a máquina reescreve "Siga @smufdpj". Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows } from "./cenas-servico.mjs";
import { cenaFinal } from "./cenas-final.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). bg/bgPonto = sarjeta com meio-tom;
// painel = quadro neutro (mapa); balao = balão e papel da máquina; linha = contorno; sombra = sombra chapada;
// amarelo/piscina/laranja/vermelho/verde/marrom = cores chapadas dos quadros e desenhos; ponto = retícula Ben-Day; titulo = letreiro solto no fundo.
export const temas = [
  { nome: "piscina", bg: "#0f93b3", bgPonto: "#0a6f88", bgPontoOp: 0.7, painel: "#fff7e0", painel2: "#f0e2b6", balao: "#ffffff", linha: "#141414",
    sombra: "#141414", sombraOp: 0.85, amarelo: "#ffd23a", piscina: "#43cbe2", laranja: "#ff8c24", vermelho: "#e8412c", verde: "#3fae5a",
    marrom: "#b06a35", ponto: "#ffffff", tracoMapa: "#141414", titulo: "#ffffff" },
  { nome: "sol", bg: "#e39d1c", bgPonto: "#b8740c", bgPontoOp: 0.6, painel: "#fff3d0", painel2: "#f3dc9c", balao: "#ffffff", linha: "#1a120a",
    sombra: "#1a120a", sombraOp: 0.85, amarelo: "#ffe066", piscina: "#2fb6cf", laranja: "#f07a1a", vermelho: "#d63a22", verde: "#4f9a3a",
    marrom: "#9a5a26", ponto: "#ffffff", tracoMapa: "#1a120a", titulo: "#ffffff" },
  { nome: "noite", bg: "#0b0d1a", bgPonto: "#2c3270", bgPontoOp: 0.75, painel: "#171a33", painel2: "#252a52", balao: "#f3f2ff", linha: "#05060d",
    sombra: "#22e6ff", sombraOp: 0.6, amarelo: "#f2ff3d", piscina: "#22e6ff", laranja: "#ff8a3a", vermelho: "#ff2d8a", verde: "#39f58a",
    marrom: "#c77b3e", ponto: "#ffffff", tracoMapa: "#8a90d8", titulo: "#ffffff" },
  { nome: "branco", bg: "#f4efe4", bgPonto: "#e3262b", bgPontoOp: 0.22, painel: "#ffffff", painel2: "#f6e6e0", balao: "#ffffff", linha: "#151515",
    sombra: "#e3262b", sombraOp: 0.9, amarelo: "#fff1ec", piscina: "#f7cfc6", laranja: "#ff8f80", vermelho: "#e3262b", verde: "#3a3a3a",
    marrom: "#7a3a2a", ponto: "#e3262b", tracoMapa: "#151515", titulo: "#e3262b" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
