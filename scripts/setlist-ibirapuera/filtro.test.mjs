// Filtro do nome do gerador do Ibirapuera: barra palavrão, crime, ódio e bizarrice, inclusive disfarçados,
// e deixa passar nomes de gente de verdade (inclusive os que contêm pedaços parecidos).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nomeProibido, soLetras } from '../../setlist-ibirapuera/filtro.js';

test('barra palavrão, crime e ódio, inclusive disfarçados', () => {
  for (const n of ['porra', 'PÓRRRAAA', 'p u t a', 'Puta', 'caralho', 'c4r4lh0', 'pedofilo', 'P3D0F1L14', 'pedo',
    'estuprador', 'nazista', 'Hitler', 'fuck', 'arrombado', 'buceta', 'viado', 'cu', 'fdp', 'Pedofilia Ana', 'onlyfans'])
    assert.equal(nomeProibido(n), true, n);
});

test('deixa passar nomes reais', () => {
  for (const n of ['André', 'Ana', 'José', 'Fagner', 'Fagundes', 'Nigel', 'Ísis', 'Lucas', 'Dickson', 'Cuca',
    'Mamadou', 'Janus', 'Pietra', 'Matheus', 'Assis', 'Helena', 'Kaká', 'Marília', 'Eddie', 'Raquel', 'Cássio'])
    assert.equal(nomeProibido(n), false, n);
});

test('só letras, sem número, emoji ou símbolo, até 18', () => {
  assert.equal(soLetras('Ana🎸123!'), 'Ana');
  assert.equal(soLetras("D'Ávila-Souza"), "D'Ávila-Souza");
  assert.equal(soLetras('a'.repeat(30)).length, 18);
});
