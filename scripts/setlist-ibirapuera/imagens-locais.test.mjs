// O gerador do Ibirapuera só carrega imagem do próprio site: os PNGs oficiais e o papel do gerador oficial (glitch.ge)
// foram copiados pra setlist-ibirapuera/img/oficial/ e a CSP da pasta trava img-src em 'self'. Falhou? Alguma URL de
// imagem externa voltou (ex.: o build.mjs regenerou o catálogo apontando pro glitch.ge).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PASTA } from './versao.mjs';

const EXTERNA = /https?:\/\/[^'"`\s)]+\.(?:png|jpe?g|gif|webp|svg|avif)\b/i;

test('musicas.json só aponta pra imagem local, e o arquivo existe', () => {
  const d = JSON.parse(fs.readFileSync(PASTA + 'musicas.json', 'utf8'));
  for (const g of d.grupos) for (const m of g.musicas) {
    assert.doesNotMatch(m.png, /^(https?:)?\/\//, `${m.nome} aponta pra fora: ${m.png}`);
    assert.ok(fs.existsSync(PASTA + m.png), `sem arquivo: ${m.png}`);
  }
});

test('nenhum .js do gerador cita imagem externa', () => {
  for (const arq of fs.readdirSync(PASTA).filter((f) => f.endsWith('.js'))) {
    const s = fs.readFileSync(PASTA + arq, 'utf8');
    assert.doesNotMatch(s, EXTERNA, `${arq} cita imagem externa`);
    assert.doesNotMatch(s, /glitch\.ge/, `${arq} ainda cita o glitch.ge`);
  }
});

test('os PNGs oficiais copiados são PNG de verdade', () => {
  const dir = PASTA + 'img/oficial/';
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) {
    assert.deepEqual([...fs.readFileSync(dir + f).subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], f);
  }
});
