// Layout X, "Lightning Bolt": homenagem ao clima do álbum de 2013 (eletricidade e geometria art déco), sem a capa,
// sem o símbolo geométrico dela, sem a tipografia dela e sem o nome do disco na tela. Um raio corta o clipe e acende
// o letreiro de neon; depois o logo num espelho de camarim déco, o estado com linha de alta tensão e faísca no fio,
// um disjuntor por show no quadro de força e o letreiro final pedindo pra compartilhar. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows } from "./cenas-servico.mjs";
import { cenaFinal } from "./cenas-final.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho). bg/bg2 = fundo (base/alto); linha =
// filetes, leques e torres; neon/nucleo = tubo e miolo claro; neon2/nucleo2 = tubo da 2a placa; ouro = molduras
// déco e rótulos; texto = texto corrido; metal* = quadro de força; fio = cabos; lampada* = bulbo de camarim.
export const temas = [
  { nome: "eletrico", bg: "#050d26", bg2: "#0d2a66", linha: "#5b8fe0", neon: "#3fb8ff", nucleo: "#e9f8ff", neon2: "#ff5fc8", nucleo2: "#ffe9f7",
    ouro: "#c9a75a", texto: "#e6eefc", metal: "#1d2a48", metal2: "#0c1428", fio: "#7a8db0", lampada: "#ffe7a6", lampada2: "#b8862e", grao: "#ffffff" },
  { nome: "deco", bg: "#140d05", bg2: "#3c2a0e", linha: "#c79a45", neon: "#ffbf4a", nucleo: "#fff4d8", neon2: "#5fe0d0", nucleo2: "#e8fffb",
    ouro: "#d8b15e", texto: "#f5e8cc", metal: "#3a2a14", metal2: "#170f06", fio: "#a88c5c", lampada: "#fff0c0", lampada2: "#c08a2a", grao: "#fff2d0" },
  { nome: "gelo", bg: "#030405", bg2: "#11161d", linha: "#8b9db0", neon: "#cfefff", nucleo: "#ffffff", neon2: "#8fd8ff", nucleo2: "#f4fbff",
    ouro: "#b9c3cc", texto: "#eef3f7", metal: "#22272e", metal2: "#0a0c0f", fio: "#6c7682", lampada: "#f4f8ff", lampada2: "#8a96a6", grao: "#ffffff" },
  { nome: "rubro", bg: "#14030a", bg2: "#3e0818", linha: "#c43a52", neon: "#ff3a52", nucleo: "#ffe4e8", neon2: "#ffc14a", nucleo2: "#fff5dc",
    ouro: "#d9a35e", texto: "#fbe9ec", metal: "#3a1220", metal2: "#16050b", fio: "#a0707c", lampada: "#ffe7b8", lampada2: "#b3672a", grao: "#ffffff" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
