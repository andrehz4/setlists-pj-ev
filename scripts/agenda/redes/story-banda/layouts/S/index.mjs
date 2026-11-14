// Layout S, "Yield": homenagem ao clima do álbum de 1998 (estrada aberta, céu amplo, placa de "dê a preferência"),
// sem foto, sem logotipo e sem o nome do disco. Placa verde de rodovia vem pela estrada por cima do clipe; depois a
// viagem: logo numa placa grande presa no poste, mapa rodoviário dobrado com a rodovia riscada até os pinos, uma
// placa verde por show passando no pórtico e, no fim, um outdoor de beira de estrada. Desenho do Claude Code (13/11/2026).
import { abertura, cenaLogo } from "./cenas-capa.mjs";
import { cenaMapa } from "./cena-mapa.mjs";
import { cenaShows, cenaFinal } from "./cenas-servico.mjs";

// Partes comuns: placa verde no padrão brasileiro, metal do poste, vermelho da placa triangular, papel do mapa.
const BASE = { placa: "#0b7a43", placa2: "#06572f", branco: "#ffffff", metal1: "#d9dde0", metal2: "#7d858c", vermelhoPlaca: "#d22420",
  baliza: "#f2f2ee", papel: "#f4eedb", papel2: "#ddd2b2", terra: "#ebe4cb", tinta: "#26302a", rodovia: "#d22420", casco: "#ffffff",
  reflexo: 0, farol: null, molhado: false, neblina: 0, chuva: false, nuvem: null };

// 4 temas na ordem da roda de cores do story (azul, ocre, preto, vermelho): dia claro, pôr do sol, noite com as placas
// refletivas no farol, e chuva com neblina (acento vermelho). bruma = cor do ar no horizonte; acento = destaques.
export const temas = [
  { ...BASE, nome: "dia", bg: "#3d7fc9", ceu1: "#2e6fc2", ceu2: "#b9dcf3", bruma: "#e6f2fa", astro: "sol", sol: "#fff8dc", nuvem: "#ffffff",
    serra: "#7f9fb0", arvore: "#4f7a3a", campo1: "#a9c56c", campo2: "#5d8f33", asfalto1: "#4d5157", asfalto2: "#9ba0a6", acostamento: "#8c8a82",
    borda: "#f4f4f0", faixa: "#f3c31c", acento: "#f3c31c", ufCor: "#cfe3b4", cartaz: "#f5f0e2", cartazTinta: "#0b5a32", cartazAcento: "#d22420" },
  { ...BASE, nome: "poente", bg: "#a8642c", ceu1: "#3a2f5c", ceu2: "#f2a24a", bruma: "#f7c27a", astro: "poente", sol: "#ffe08a", nuvem: "#e98a5a",
    serra: "#7a4a4a", arvore: "#3a2418", campo1: "#c08a42", campo2: "#5a3518", asfalto1: "#2f2a2c", asfalto2: "#8a6d5e", acostamento: "#6e5848",
    borda: "#f6e6cc", faixa: "#f2b622", acento: "#f2a24a", ufCor: "#f1d6a6", papel: "#f6ead2", cartaz: "#f6ead2", cartazTinta: "#3a2418", cartazAcento: "#c4541c" },
  { ...BASE, nome: "noite", bg: "#0b1020", ceu1: "#03050c", ceu2: "#1a2648", bruma: "#26345c", astro: "lua", sol: "#eef1ff", reflexo: 1,
    serra: "#0e1424", arvore: "#05070c", campo1: "#141e1c", campo2: "#05090a", asfalto1: "#1b1d22", asfalto2: "#2a2e38", acostamento: "#14161a",
    borda: "#e8e8e2", faixa: "#ffd23a", baliza: "#cfd3d6", farol: "#fff2c8", acento: "#ffd23a", metal1: "#8e959c", metal2: "#3a3f45",
    placa: "#0d8a4c", placa2: "#075a31", ufCor: "#cfe3b4", cartaz: "#f3efe4", cartazTinta: "#0b1020", cartazAcento: "#e0a400" },
  { ...BASE, nome: "chuva", bg: "#7c858c", ceu1: "#6d767e", ceu2: "#bfc5c8", bruma: "#d9dcdd", astro: null, neblina: 0.7, chuva: true, molhado: true,
    nuvem: "#8a9399", serra: "#9aa3a6", arvore: "#6b766c", campo1: "#8e9a86", campo2: "#3e4a3c", asfalto1: "#2a2d31", asfalto2: "#80878c", acostamento: "#5a5e5f",
    borda: "#eeeeea", faixa: "#e6b81c", acento: "#d7261e", ufCor: "#f2cfca", rodovia: "#d7261e", horaCor: "#ffd84a", cartaz: "#f1f1ec", cartazTinta: "#1c1f22", cartazAcento: "#d7261e" },
];

export function quadro(T, story, cor, logoUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${abertura(T, story, cor)}${cenaLogo(T, story, cor, logoUri)}${cenaMapa(T, story, cor)}${cenaShows(T, story, cor)}${cenaFinal(T, story, cor)}</svg>`;
}
