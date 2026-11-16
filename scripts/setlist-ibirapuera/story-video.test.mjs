// Story em vídeo: só oferece onde o navegador grava MP4 (o Instagram não aceita o WebM do Chrome antigo) e some
// com ?sem-video. Roda o módulo de verdade com um navegador de mentira (sem DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASTA } from './versao.mjs';

let suporta = [];
Object.assign(globalThis, {
  location: { search: '' },
  document: { querySelector: () => null },
  HTMLCanvasElement: class { captureStream() {} },
  MediaRecorder: { isTypeSupported: (t) => suporta.includes(t) },
});
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 (iPhone) Safari' }, configurable: true });
const { formato } = await import(PASTA + 'story-video.js');

test('grava MP4 quando o navegador sabe (Safari iOS, Chrome novo)', () => {
  suporta = ['video/mp4'];
  assert.equal(formato(), 'video/mp4');
  suporta = ['video/mp4;codecs=avc1', 'video/mp4'];
  assert.equal(formato(), 'video/mp4;codecs=avc1');
});

test('só WebM ou sem MediaRecorder: não oferece o vídeo (fica só a foto)', () => {
  suporta = ['video/webm;codecs=vp9', 'video/webm'];
  assert.equal(formato(), null);
  const mr = globalThis.MediaRecorder;
  delete globalThis.MediaRecorder;
  assert.equal(formato(), null);
  globalThis.MediaRecorder = mr;
});

test('?sem-video desliga o botão', () => {
  suporta = ['video/mp4'];
  globalThis.location.search = '?sem-video';
  assert.equal(formato(), null);
  globalThis.location.search = '';
});

test('o botão nasce escondido no HTML (só aparece se o navegador grava MP4)', () => {
  const html = readFileSync(PASTA + 'index.html', 'utf8');
  assert.match(html, /<button id="story-video"[^>]*\bhidden\b/);
  assert.match(html, /<script type="module" src="story-video\.js\?v=[0-9a-f]+"><\/script>/);
});
