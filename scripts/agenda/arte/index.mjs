// Agenda na ARTE do post: o coletor guarda a imagem (fila.mjs), o curador (routine Claude) lê e grava em
// media/news/agenda-arte/lidas.json, e aqui a leitura volta pros posts como post.arte, que o montar.mjs usa só pra
// COMPLETAR o que a legenda não disse. Sem leitura nenhuma, nada muda.
import { showsDaArte } from "./quais.mjs";

export { enfileirarArtes, limparFila, PASTA } from "./fila.mjs";

// Pendura em cada post a leitura do curador, se houver. Devolve quantos posts ganharam shows da arte.
export function aplicarLeituras(posts, lidas) {
  let n = 0;
  for (const p of posts) {
    const shows = lidas[p.link] ? showsDaArte(lidas[p.link], p.data) : [];
    if (shows.length) { p.arte = shows; n++; }
  }
  return n;
}
