// Garante que a voz cabe no story de 21,3 s: cada fala tem uma janela (de onde entra até onde a próxima coisa começa).
// Passou da janela: acelera até 12% (ainda natural). Nem assim: o chamador troca pela próxima variação da frase.
import { FALAS, DURACAO } from "./tempo.mjs";

export const MAX_ACELERA = 1.12;
// fim de cada janela (s reais): abertura até o whoosh, estado até a lista, hora até o corte da bateria, final até o fim
export const FIM_JANELA = { abertura: 5.95, whoosh: 6.96, estado: 9.7, data: 11.45, hora: 14.55, final: DURACAO - 0.2 };

// duracoes: { chave: segundos } -> { chave: { atempo, cabe } }
export function encaixar(duracoes) {
  const out = {};
  for (const f of FALAS) {
    const d = duracoes[f.chave];
    if (!d) continue;
    const janela = FIM_JANELA[f.chave] - f.em;
    const atempo = Math.max(1, d / janela);
    out[f.chave] = { atempo: Number(atempo.toFixed(3)), cabe: atempo <= MAX_ACELERA };
  }
  return out;
}

// Escolhe, entre as variações (em ordem de preferência), a primeira que cabe na janela. Devolve o índice.
export function variacaoQueCabe(chave, duracoesVariacoes) {
  const i = duracoesVariacoes.findIndex((d) => encaixar({ [chave]: d })[chave].cabe);
  return i >= 0 ? i : null;
}
