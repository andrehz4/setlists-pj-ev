// Regressão (16/11/2026): o botão "Ver a minha folha" do gerador do Ibirapuera não fazia nada.
// Os botões têm o atributo data-gerar SEM valor, então b.dataset.gerar é '' (falso) e o
// `if (b.dataset.gerar)` nunca entrava. O certo é testar a presença: 'gerar' in b.dataset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../../setlist-ibirapuera/', import.meta.url);
const telas = readFileSync(new URL('telas.js', raiz), 'utf8');
const html = readFileSync(new URL('index.html', raiz), 'utf8');

test('erro antigo: dataset de atributo vazio é string vazia, falsa no if', () => {
  const dataset = { gerar: '' };
  assert.equal(Boolean(dataset.gerar), false);
  assert.equal('gerar' in dataset, true);
});

test('botões de ver a folha usam data-gerar sem valor', () => {
  const botoes = html.match(/<button[^>]*data-gerar[^>]*>/g) || [];
  assert.ok(botoes.length >= 1, 'achei nenhum botão data-gerar');
});

test('o clique testa a presença do data-gerar, não o valor', () => {
  assert.match(telas, /'gerar' in b\.dataset\) return ir\('resultado'\)/);
  assert.doesNotMatch(telas, /if \(b\.dataset\.gerar\)/);
});
