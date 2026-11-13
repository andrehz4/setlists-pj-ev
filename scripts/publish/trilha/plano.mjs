// Plano de níveis no tempo: em que trecho do vídeo a música fica magra (piano), média ou cheia (banda inteira).
// O golpe (entrada da banda) cai no começo da manchete: é isso que dá ênfase à notícia.
import { COLD_DUR, BLOCK_DUR, OUTRO_DUR } from "../reel/base.mjs";

// Reel de domingo: abertura no piano, banda inteira na manchete líder, médio no meio, respiro no piano,
// segundo golpe e banda cheia até o fim das manchetes, encerramento no piano.
export function planoReel(nBlocos = 8) {
  const ini = (i) => COLD_DUR + i * BLOCK_DUR;
  const respiro = Math.min(4, nBlocos - 2);
  const fim = ini(nBlocos);
  const p = [{ de: 0, ate: ini(0), nivel: "magro" }, { de: ini(0), ate: ini(1), nivel: "cheio" }];
  if (respiro > 1) p.push({ de: ini(1), ate: ini(respiro), nivel: "medio" });
  p.push({ de: ini(respiro), ate: ini(respiro + 1), nivel: "magro" });
  p.push({ de: ini(respiro + 1), ate: fim, nivel: "cheio" });
  p.push({ de: fim, ate: fim + OUTRO_DUR, nivel: "magro" });
  return p.filter((x) => x.ate > x.de);
}

// Story: abertura curta no piano, golpe na primeira manchete, médio sob a fala, cheio nas trocas de manchete.
export function planoStory(trocas, duracao) {
  const p = [{ de: 0, ate: trocas[0] ?? 1.5, nivel: "magro" }];
  trocas.forEach((t, i) => {
    const prox = trocas[i + 1] ?? duracao;
    p.push({ de: t, ate: Math.min(t + 2, prox), nivel: "cheio" });
    if (prox > t + 2) p.push({ de: t + 2, ate: prox, nivel: "medio" });
  });
  return p;
}

// Golpes = entradas no nível cheio. Usado no relatório e no teste.
export function golpesDoPlano(plano) {
  return plano.filter((x, i) => x.nivel === "cheio" && plano[i - 1]?.nivel !== "cheio").map((x) => x.de);
}
