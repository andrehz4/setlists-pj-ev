// Sorteio com cara de show: fecha com quem o Eddie usa (o resto varia), traço de bis no lugar certo, sem repetir, até 24.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sortearShow } from '../../setlist-ibirapuera/sorteio.js';

const d = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../setlist-ibirapuera/musicas.json'), 'utf8'));
let semente = 7;
const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);

test('100 sorteios: só o fecho vem do modelo, um traço de bis antes do bis, sem repetir', () => {
  const aberturas = new Set();
  const fecha = new Set(d.modelo.fecha.map((x) => x.chave));
  for (let i = 0; i < 100; i++) {
    const s = sortearShow(d.grupos, d.modelo, rnd);
    assert.ok(s.length >= 12 && s.length <= 24, `tamanho ${s.length}`);
    assert.equal(new Set(s.map((m) => m.chave)).size, s.length);
    aberturas.add(s[0].chave);
    assert.ok(fecha.has(s[s.length - 1].chave), `fechou com ${s[s.length - 1].nome}`);
    const marcas = s.map((m, j) => (m.bis ? j : -1)).filter((j) => j >= 0);
    assert.equal(marcas.length, 1);
    assert.ok(marcas[0] < s.length - 1);
  }
  assert.ok(aberturas.size > 40, `abertura variou pouco: ${aberturas.size}`);
});

test('sem modelo ainda sorteia (degrada pro peso solo)', () => {
  const s = sortearShow(d.grupos, null, rnd);
  assert.ok(s.length >= 8);
});
