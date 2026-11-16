// O index.html do gerador tem que citar a versão ATUAL de cada .js e do musicas.json (senão o navegador
// pode usar o arquivo velho do cache). Falhou? Rode: node scripts/setlist-ibirapuera/versao.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASTA, MODULOS, hashes, carimbar } from './versao.mjs';

test('index.html do gerador está com as versões carimbadas em dia', () => {
  const html = readFileSync(PASTA + 'index.html', 'utf8');
  assert.equal(html, carimbar(html, hashes()), 'rode node scripts/setlist-ibirapuera/versao.mjs');
});

test('carimbar põe ?v em script, preload, fetch e importmap, e é idempotente', () => {
  const h = Object.fromEntries([...MODULOS, 'musicas.json'].map((n) => [n, 'abc12345']));
  const html = '<link rel="modulepreload" href="app.js">\n<script>fetch(\'musicas.json\')</script>\n<script type="module" src="telas.js"></script>';
  const um = carimbar(html, h);
  assert.match(um, /href="app\.js\?v=abc12345"/);
  assert.match(um, /src="telas\.js\?v=abc12345"/);
  assert.match(um, /fetch\('musicas\.json\?v=abc12345'\)/);
  assert.match(um, /"\.\/story\.js":"\.\/story\.js\?v=abc12345"/);
  assert.equal(carimbar(um, h), um);
});
