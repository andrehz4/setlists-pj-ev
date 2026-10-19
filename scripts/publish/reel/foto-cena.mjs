// Foto de fundo de uma cena do reel. Notícia sem foto própria (hasImg false) também passa pela busca, que cai na
// foto do integrante ou da banda: antes ela ia direto pro fundo fantasma "CLIPE", que parecia erro no ar
// (teste em scripts/regressao/reel-sem-fantasma.test.mjs).
import { fetchImageBuffer } from "./midia.mjs";

export function fotoDaCena(scene, items, buscar = fetchImageBuffer) {
  if (scene.kind === "coldopen") return buscar(items.find((it) => it.hasImg) || items[0]);
  return buscar(scene.item);
}
