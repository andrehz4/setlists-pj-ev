// Catálogo do gerador do Ibirapuera: grupos, PNG oficial casado por nome/apelido e o JSON publicado coerente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { montarCatalogo, chave } from './catalogo.mjs';

const albums = [
  { artist: 'Eddie Vedder', title: 'Earthling (EV, 2022)', songs: ['Invincible'] },
  { artist: 'Pearl Jam', title: 'Ten', songs: ['Porch', 'Black'] },
  { artist: 'Ambos', title: 'Covers & tributos', songs: ['Hey Jude'] },
];
const oficial = [{ nome: 'Porch', url: 'https://x/porch.png' }, { nome: 'Black', url: 'https://x/black.png' },
  { nome: 'Elderly Woman...', url: 'https://x/ew.png' }];
const solo = [
  { musica: 'Porch', vezes: 192, cover_de: null, do_pearl_jam: true },
  { musica: 'Invincible', vezes: 30, cover_de: null, do_pearl_jam: false },
  { musica: 'Hey Jude', vezes: 5, cover_de: 'The Beatles', do_pearl_jam: false },
  { musica: 'Elderly Woman Behind the Counter in a Small Town', vezes: 50, cover_de: null, do_pearl_jam: true },
];

test('agrupa solo, Pearl Jam por disco e covers, sem repetir música', () => {
  const cat = montarCatalogo({ oficial, solo, albums });
  const por = Object.fromEntries(cat.map((g) => [g.grupo, g.musicas.map((m) => m.nome)]));
  assert.deepEqual(por.Earthling, ['Invincible']);
  assert.deepEqual(por.Ten, ['Porch', 'Black']);
  assert.deepEqual(por.Covers, ['Hey Jude']);
  assert.equal(cat.flatMap((g) => g.musicas).length, 5);
});

test('casa o PNG oficial mesmo quando o gerador abrevia o nome', () => {
  const todas = montarCatalogo({ oficial, solo, albums }).flatMap((g) => g.musicas);
  assert.equal(todas.find((m) => m.nome.startsWith('Elderly')).png, 'https://x/ew.png');
  assert.equal(chave('Elderly Woman...'), chave('Elderly Woman Behind the Counter in a Small Town'));
});

test('musicas.json publicado: toda música tem PNG existente e nome único', () => {
  const dir = path.resolve(import.meta.dirname, '../../setlist-ibirapuera');
  const { grupos } = JSON.parse(fs.readFileSync(`${dir}/musicas.json`, 'utf8'));
  const chaves = new Set();
  for (const m of grupos.flatMap((g) => g.musicas)) {
    assert.ok(!chaves.has(m.chave), `repetida: ${m.nome}`);
    chaves.add(m.chave);
    if (!m.png.startsWith('https://')) assert.ok(fs.existsSync(`${dir}/${m.png}`), `sem PNG: ${m.nome}`);
  }
  for (const f of ['cab-sp1', 'cab-sp2', 'cab-ibira', 'traco-bis']) assert.ok(fs.existsSync(`${dir}/img/${f}.png`));
});
