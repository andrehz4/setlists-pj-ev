// Layout P, "Vs.": homenagem ao clima do álbum de 1993 em DESENHO (fotocópia P&B granulada, alambrado e uma ovelha
// cartum amassando o focinho na cerca), sem a foto, o logotipo ou a tipografia da capa. Placa presa no arame por cima
// do clipe, logo em foto P&B na cerca, mapa em papel atrás da malha, uma etiqueta por show e a ovelha de novo no final.
// Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa, cenaShows, cenaFinal } from "./cenas-servico.mjs";

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho): P&B puro (acento branco), sépia, negativo
// e P&B com acento vermelho. papel = etiquetas; tinta = texto nelas; sobreBg = traço direto no fundo; la/cara = ovelha.
export const temas = [
  { nome: "pb", bg: "#262626", bg2: "#070707", grao: "#ffffff", graoOp: 0.1, sobreBg: "#f2f2f0", papel: "#f1f0eb", tinta: "#111111",
    acento: "#ffffff", sobreAcento: "#111111", acentoMapa: "#ffffff", acentoTexto: "#111111", arame: "#8e8e8e", sombraArame: "#000000",
    abracadeira: "#f4f4f4", contorno: "#0b0b0b", la: "#f3f2ee", cara: "#1c1c1c", focinho: "#333333", olho: "#ffffff", pupila: "#080808" },
  { nome: "sepia", bg: "#cbb892", bg2: "#8f7a52", grao: "#24170b", graoOp: 0.13, sobreBg: "#24170b", papel: "#f0e5cc", tinta: "#24170b",
    acento: "#7a2e0e", sobreAcento: "#f6ecd5", acentoMapa: "#7a2e0e", acentoTexto: "#7a2e0e", arame: "#4a3820", sombraArame: "#000000",
    abracadeira: "#efe3c6", contorno: "#1d1208", la: "#f6eedb", cara: "#2a1c0e", focinho: "#46311b", olho: "#fbf4e2", pupila: "#120a03" },
  { nome: "negativo", bg: "#0a0a0a", bg2: "#000000", grao: "#ffffff", graoOp: 0.12, sobreBg: "#f5f5f5", papel: "#111111", tinta: "#f5f5f5",
    acento: "#f5f5f5", sobreAcento: "#0a0a0a", acentoMapa: "#f5f5f5", acentoTexto: "#f5f5f5", arame: "#9c9c9c", sombraArame: "#000000",
    abracadeira: "#f5f5f5", contorno: "#f0f0f0", la: "#1b1b1b", cara: "#ececec", focinho: "#c9c9c9", olho: "#ffffff", pupila: "#050505" },
  { nome: "vermelho", bg: "#e6e3dd", bg2: "#b9b5ad", grao: "#000000", graoOp: 0.12, sobreBg: "#111111", papel: "#fbfaf6", tinta: "#111111",
    acento: "#d7261e", sobreAcento: "#ffffff", acentoMapa: "#d7261e", acentoTexto: "#d7261e", arame: "#4a4a4a", sombraArame: "#000000",
    abracadeira: "#d7261e", contorno: "#111111", la: "#fbfbf8", cara: "#161616", focinho: "#2c2c2c", olho: "#ffffff", pupila: "#0a0a0a" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, cor)}</svg>`;
}
