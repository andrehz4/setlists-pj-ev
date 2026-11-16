// Regressão (16/11/2026): no story do gerador do Ibirapuera a folha encolheu pra 37% da largura (letra ilegível) e
// sobraram 12% de vazio embaixo do rodapé. Tudo era y fixo: quando o rodapé "Segue a gente" entrou, a folha pagou a
// conta. Hoje a geometria sai de story-layout.js (imagem e vídeo usam a mesma): rodapé na base, cartas em cima dele
// e a folha com o espaço que sobra até o título.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../../setlist-ibirapuera/', import.meta.url);
const { layout, vazioEmbaixo, TITULO_FIM, RODAPE_ALT, RESPIRO } = await import(new URL('story-layout.js', raiz));
const { rodape } = await import(new URL('story-rodape.js', raiz));
const W = 1080, H = 1920;
const ler = (n) => readFileSync(new URL(n, raiz), 'utf8');

test('erro antigo: folha de 400 px e rodapé acabando em 1678 reprovam nas duas medidas', () => {
  assert.ok(400 / W < 0.55, 'folha antiga ocupava 37% da largura');
  assert.ok((H - (1476 + 202)) / H > 0.06, 'sobravam 12% de vazio embaixo');
});

test('com as 6 cartas a folha ocupa pelo menos 55% da largura e não encosta no título', () => {
  const g = layout();
  assert.ok(g.folha.larg / W >= 0.55, `folha com ${(100 * g.folha.larg / W).toFixed(1)}% da largura`);
  assert.ok(g.folha.alt / H >= 0.38, 'folha com menos de 38% da altura');
  assert.ok(g.folha.y >= TITULO_FIM);
  assert.ok(g.folha.x >= 40 && g.folha.x + g.folha.larg <= W - 40);
});

test('o vazio embaixo do rodapé é menor que 6% da altura (medido nas camadas de verdade)', () => {
  const g = layout();
  const camadas = rodape((nome, x, y, w, h) => ({ nome, x, y, w, h }), null, g.rodape.y);
  const fim = Math.max(...camadas.map((k) => k.y + k.h));
  assert.equal(fim, g.rodape.fim, 'RODAPE_ALT.total não bate com as camadas do rodapé');
  assert.ok((H - fim) / H < 0.06 && vazioEmbaixo(g) < 0.06, `vazio de ${H - fim} px`);
  assert.ok(fim <= H - 50, 'rodapé colado demais na borda');
});

// Ajuste do mesmo dia: a chamada do @ ficou grudada na carta de cima e o papel entrava atrás do índice. O Andre aprovou
// descer a chamada (até uns 70 px dentro da faixa de baixo do Instagram) em troca de respiro igual entre os grupos.
test('respiro igual entre folha, cartas e rodapé; a chamada do @ não desce mais que 70 px na faixa do Instagram', () => {
  const g = layout();
  assert.ok(RESPIRO >= 28, 'respiro curto demais');
  assert.equal(g.rodape.y - (g.chance.y + g.chance.h), RESPIRO, 'cartas grudadas no rodapé');
  assert.ok(Math.abs(g.indice.y - (g.folha.y + g.folha.alt) - RESPIRO) <= 2, 'folha encostando (ou entrando) no índice');
  assert.ok(g.rodape.y + RODAPE_ALT.chamada <= H - 250 + 70);
});

test('nada se atropela: cartas em ordem, sem sobrepor uma à outra nem ao rodapé', () => {
  for (const linhas of [0, 1, 2]) for (const indice of [true, false]) for (const chance of [true, false]) {
    const g = layout({ indice, linhas, chance });
    const blocos = [g.indice && [g.indice.y, g.indice.h], g.grade && [g.grade.y, linhas * g.grade.h + (linhas - 1) * g.grade.gap],
      g.chance && [g.chance.y, g.chance.h]].filter(Boolean);
    let fim = TITULO_FIM;
    for (const [y, h] of blocos) { assert.ok(y >= fim, 'carta por cima da anterior'); fim = y + h; }
    assert.ok(fim <= g.rodape.y, 'carta por cima do rodapé');
    const baixo = g.folha.y + g.folha.alt, teto = (blocos.length ? blocos[0][0] : g.rodape.y) - 20;
    assert.ok(baixo <= teto, 'folha encostando nas cartas');
    assert.ok(g.folha.larg / W >= 0.55 && g.folha.larg <= W - 80);
  }
});

test('imagem e vídeo usam a mesma geometria (nada de posição fixa da folha de volta)', () => {
  assert.match(ler('story.js'), /layout\(\{/);
  assert.doesNotMatch(ler('story.js'), /FOLHA = \{/);
  assert.match(ler('story-roteiro.js'), /nome === 'folha'\)\.geo/); // o vídeo encolhe a folha pra geo da camada da imagem
  assert.doesNotMatch(ler('story-rodape.js'), /RODAPE = \{ y:/);
});
