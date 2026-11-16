// Bug (16/11/2026): quem chegava ao gerador do Ibirapuera pelo link da bio do Instagram caía no navegador interno,
// onde vídeo não baixa. O recado mandava abrir no Chrome/Safari, mas lá fora o sorteio se perdia: a pessoa tinha que
// sortear de novo e saía OUTRA setlist. Agora o estado vai no link (?s=<código>) e o navegador de fora reabre a mesma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { codificar, decodificar } from '../../setlist-ibirapuera/link-setlist.js';
import { destino } from '../../setlist-ibirapuera/abrir-fora.js';
import { sortearShow } from '../../setlist-ibirapuera/sorteio.js';

const raiz = new URL('../../setlist-ibirapuera/', import.meta.url);
const { grupos, modelo } = JSON.parse(readFileSync(new URL('musicas.json', raiz), 'utf8'));
const resumo = (l) => l.map((m) => m.chave + (m.bis ? '|bis' : ''));
const IG_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S911B; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 Instagram 350.0.0.0';
const IG_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0.0.0';

test('erro antigo: sortear de novo lá fora dá outra setlist', () => {
  const a = sortearShow(grupos, modelo), b = sortearShow(grupos, modelo);
  assert.notDeepEqual(resumo(a), resumo(b));
});

test('ida e volta: o link devolve a mesma noite, o mesmo nome, as duas listas e os traços de bis', () => {
  for (let i = 0; i < 50; i++) {
    const estado = { show: 1 + (i % 2), nome: 'André', listas: { 1: sortearShow(grupos, modelo), 2: sortearShow(grupos, modelo) } };
    const codigo = codificar(estado, grupos);
    assert.match(codigo, /^[A-Za-z0-9_-]+$/, 'o código tem que caber na URL sem escapar nada');
    assert.ok(codigo.length < 500, `código comprido demais: ${codigo.length}`);
    const volta = decodificar(codigo, grupos);
    assert.equal(volta.show, estado.show);
    assert.equal(volta.nome, 'André');
    assert.deepEqual(resumo(volta.listas[1]), resumo(estado.listas[1]));
    assert.deepEqual(resumo(volta.listas[2]), resumo(estado.listas[2]));
    assert.deepEqual(volta.listas[estado.show][0], estado.listas[estado.show][0], 'a música volta inteira (png, vezes, pct)');
  }
});

test('lista montada à mão, com uma noite vazia e dois traços de bis, também volta igual', () => {
  const todas = grupos.flatMap((g) => g.musicas);
  const l1 = [todas[3], todas[40], todas[400], todas[7]].map((m, i) => ({ ...m, bis: i === 0 || i === 2 }));
  const volta = decodificar(codificar({ show: 1, listas: { 1: l1, 2: [] } }, grupos), grupos);
  assert.deepEqual(resumo(volta.listas[1]), resumo(l1));
  assert.deepEqual(volta.listas[2], []);
  assert.equal(volta.nome, '');
});

test('nome do link passa pelo filtro: palavrão e golpe não chegam ao título', () => {
  const listas = { 1: sortearShow(grupos, modelo), 2: [] };
  assert.equal(decodificar(codificar({ show: 1, nome: 'p u t a', listas }, grupos), grupos).nome, '');
  // Código forjado à mão (sem passar pelo codificar): o filtro roda de novo na volta.
  const forjar = (nome) => Buffer.from(`1~${new Set(grupos.flatMap((g) => g.musicas).map((m) => m.chave)).size.toString(36)}~1~${nome}~0.1~`).toString('base64url');
  assert.equal(decodificar(forjar('Hitler'), grupos).nome, '');
  assert.equal(decodificar(forjar('<img src=x>'), grupos).nome, 'img srcx');
  assert.equal(decodificar(forjar('Ganhe-ingresso-pix'), grupos).nome, 'Ganhe');
});

test('código quebrado, repetido, fora do catálogo ou de outro catálogo é ignorado (devolve null)', () => {
  const b64 = (t) => Buffer.from(t).toString('base64url');
  const n = new Set(grupos.flatMap((g) => g.musicas).map((m) => m.chave)).size.toString(36);
  for (const ruim of ['', 'x', '!!!', 'a'.repeat(2000), b64('2~' + n + '~1~~0.1~'), b64(`1~${n}~3~~0.1~`), b64(`1~${n}~1~~0.0~`),
    b64(`1~${n}~1~~zzzz~`), b64(`1~1~1~~0~`), b64(`1~${n}~1~~~`), b64(`1~${n}~1~~${Array.from({ length: 25 }, (_, i) => i.toString(36)).join('.')}~`)]) {
    assert.equal(decodificar(ruim, grupos), null, `aceitou: ${ruim.slice(0, 40)}`);
  }
  assert.equal(decodificar(null, grupos), null);
});

test('Android no Instagram: intent que abre o Chrome com o mesmo link (e o próprio link de reserva)', () => {
  const link = 'https://somaisumfadepearljam.com.br/setlist-ibirapuera/?s=abc_-123';
  const d = destino(link, IG_ANDROID);
  assert.equal(d.url, 'intent://somaisumfadepearljam.com.br/setlist-ibirapuera/?s=abc_-123#Intent;scheme=https;package=com.android.chrome;'
    + `S.browser_fallback_url=${encodeURIComponent(link)};end`);
});

test('iPhone no Instagram: x-safari-https com o mesmo link; outro aparelho fica só com a instrução', () => {
  const link = 'https://somaisumfadepearljam.com.br/setlist-ibirapuera/?s=abc_-123';
  assert.equal(destino(link, IG_IPHONE).url, 'x-safari-' + link);
  assert.equal(destino(link, 'Mozilla/5.0 (Macintosh)').url, null);
});

test('o gerador usa o link: app.js restaura, telas.js vai pro resultado e o botão do vídeo sai do app', () => {
  const ler = (n) => readFileSync(new URL(n, raiz), 'utf8');
  assert.match(ler('app.js'), /if \(ligar\(estado, grupos\)\) pedirEscrita\(\)/);
  assert.match(ler('telas.js'), /location\.hash === '#sortear' \|\| CODIGO\) ir\('resultado', false\)/);
  assert.match(ler('story-video.js'), /tipo === 'app' \? abrirFora\(/);
  assert.doesNotMatch(ler('story-video.js'), /tipo !== 'app'/, 'no Instagram o vídeo também é o botão principal');
});
