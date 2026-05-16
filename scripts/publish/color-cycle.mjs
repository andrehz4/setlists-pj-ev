// Fonte unica do ciclo de cor do @smufdpj. 3 posts por cor, rotaciona
// preto -> vermelho -> ocre -> azul, dirigido por queue.postCount.
// Usado por run-publish.mjs (carrossel + capa Card 11) e
// run-publish-story.mjs (story). Antes a paleta vivia duplicada nos dois
// (e o story usava uma paleta antiga diferente, #c12727/#0a0908).

export const CYCLE_COLORS = [
  "#0a0a0a", // preto
  "#E10600", // vermelho
  "#a87f2c", // ocre sepia
  "#2a5b9e", // azul petroleo
];

export const POSTS_PER_COLOR = 3;

export function getCurrentCycleColor(postCount) {
  const idx = Math.floor((postCount || 0) / POSTS_PER_COLOR) % CYCLE_COLORS.length;
  return CYCLE_COLORS[idx];
}
