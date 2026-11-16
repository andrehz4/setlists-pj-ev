// Sorteio com cara de show: fecha com quem o Eddie usa (o resto varia), traço de bis no lugar certo, sem repetir, até 24.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sortearShow } from '../../setlist-ibirapuera/sorteio.js';

const d = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../setlist-ibirapuera/musicas.json'), 'utf8'));
let semente = 7;
const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);

test('100 sorteios: abre, fecha e 1 do bis vêm do modelo, um traço de bis antes do bis, sem repetir', () => {
  const abre = new Set(d.modelo.abre.map((x) => x.chave));
  const bisReal = new Set(d.modelo.bis.map((x) => x.chave));
  const meios = new Set();
  const fecha = new Set(d.modelo.fecha.map((x) => x.chave));
  for (let i = 0; i < 100; i++) {
    const s = sortearShow(d.grupos, d.modelo, rnd);
    assert.ok(s.length >= 12 && s.length <= 24, `tamanho ${s.length}`);
    assert.equal(new Set(s.map((m) => m.chave)).size, s.length);
    assert.ok(abre.has(s[0].chave), `abriu com ${s[0].nome}`);
    s.slice(1, 4).forEach((m) => meios.add(m.chave));
    assert.ok(fecha.has(s[s.length - 1].chave), `fechou com ${s[s.length - 1].nome}`);
    const marcas = s.map((m, j) => (m.bis ? j : -1)).filter((j) => j >= 0);
    assert.equal(marcas.length, 1);
    assert.ok(marcas[0] < s.length - 1);
    assert.ok(s.slice(marcas[0] + 1, -1).some((m) => bisReal.has(m.chave)), 'bis sem nenhuma música típica de bis');
  }
  assert.ok(meios.size > 80, `o meio variou pouco: ${meios.size}`);
});

test('sem modelo ainda sorteia (degrada pro peso solo)', () => {
  const s = sortearShow(d.grupos, null, rnd);
  assert.ok(s.length >= 8);
});

// Regressão (16/11/2026): a primeira do bis saía do modelo de bis, que tem Rockin' e Hard Sun (são de FIM).
// Em ~1 de cada 4 sorteios uma música de encerramento ficava no meio do bis.
test('música de encerramento nunca no meio nem abrindo o bis (abrir pode: Ball Game e Better Man abrem e fecham)', () => {
  const fim = new Set(d.modelo.fecha.map((x) => x.chave));
  for (let i = 0; i < 500; i++) {
    const s = sortearShow(d.grupos, d.modelo, rnd);
    assert.ok(!s.slice(1, -1).some((m) => fim.has(m.chave)), s.map((m) => m.nome).join(' / '));
  }
});
