// Layout R, "mural instantâneo": homenagem ao clima do álbum de 1996 (mural de fotos instantâneas) sem a capa, sem foto real,
// sem o arranjo dela e sem o nome do disco. As fotos são desenhos genéricos (olho, dado, chave, óculos, estrada, lua)
// que caem por cima do clipe e se encaixam numa grade; depois o logo, o estado, os shows e o mural final viram fotos
// revelando, com legenda à mão (Permanent Marker). Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). bg/bg2 = parede do mural (centro/borda);
// moldura* = papel da foto; tinta = caneta na faixa; acento = pino e número; fita/rotulo = fita crepe; tacha* =
// tachinha; filme = paleta desbotada das imagens (vela = cinza da foto revelando, sepia = meio da revelação).
export const temas = [
  { nome: "filme", bg: "#d9e6dc", bg2: "#a9c3b6", textura: "liso", grao: "#1d3b36", graoOp: 0.07, moldura: "#fbfaf4", moldura2: "#e7e4d7",
    tinta: "#1d2f4a", acento: "#c2412d", fita: "#efe6c8", rotulo: "#f2ead0", tacha: "#d9472f", tacha2: "#7e1d10",
    filme: { ceu: "#a9cdc4", ceu2: "#d8d2b4", sombra: "#24403f", meio: "#6f9690", luz: "#f1e7cc", quente: "#e3a35f", pele: "#d9b69a", vela: "#7d8a84", sepia: "#a8865a" } },
  { nome: "cortica", bg: "#b3864f", bg2: "#7c5530", textura: "cortica", granulo: "#6e4824", granulo2: "#d6aa6e", grao: "#2b1a0b", graoOp: 0.12,
    moldura: "#f8f5ec", moldura2: "#e4dccb", tinta: "#211710", acento: "#b8322a", fita: "#eadfbf", rotulo: "#f0e6c6", tacha: "#2f6fb0", tacha2: "#173c66",
    filme: { ceu: "#c9b48a", ceu2: "#e2cfa6", sombra: "#3b2a1e", meio: "#8f7356", luz: "#f4e6c6", quente: "#e88a4a", pele: "#d7ab88", vela: "#857c6e", sepia: "#9c7444" } },
  { nome: "noite", bg: "#1d2026", bg2: "#07080a", textura: "liso", grao: "#ffffff", graoOp: 0.06, moldura: "#efece3", moldura2: "#d4d0c4",
    tinta: "#15171c", acento: "#d24a2c", fita: "#d9d2bd", rotulo: "#e8e1cc", tacha: "#e8c33a", tacha2: "#7a5a10",
    filme: { ceu: "#5f7c8a", ceu2: "#9aa9a6", sombra: "#17242c", meio: "#45606c", luz: "#e8e0c8", quente: "#d98a5a", pele: "#c4a08a", vela: "#646c6c", sepia: "#8a7458" } },
  { nome: "gelo", bg: "#eef1f3", bg2: "#cdd3d8", textura: "liso", grao: "#20262c", graoOp: 0.08, moldura: "#ffffff", moldura2: "#eaecec",
    tinta: "#151515", acento: "#d7261e", fita: "#f1e8d0", rotulo: "#f6efda", tacha: "#d7261e", tacha2: "#6e0c08",
    filme: { ceu: "#b9cfd6", ceu2: "#e5dcc8", sombra: "#26313a", meio: "#7a8f98", luz: "#f6efe0", quente: "#e46a4e", pele: "#e0b8a2", vela: "#8b9092", sepia: "#a88462" } },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
