// Botão Compartilhar (WhatsApp) do gerador: texto por noite, link do WhatsApp e a escolha entre mandar a imagem ou só o texto.
// Roda o módulo de verdade com um navegador de mentira (sem document, então ele não monta botão nenhum).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASTA } from './versao.mjs';

Object.assign(globalThis, { location: { search: '', hash: '' } });
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 (iPhone) Safari' }, configurable: true });
const { texto, linkWhats, caminho } = await import(PASTA + 'compartilhar.js');

test('texto traz o dia da noite escolhida e o link do gerador', () => {
  assert.equal(texto(1), 'Esse vai ser o meu setlist no show do Eddie Vedder no Ibirapuera, dia 20/11! Qual vai ser o seu? Faz o seu aqui: https://somaisumfadepearljam.com.br/setlist-ibirapuera');
  assert.equal(texto(2), 'Esse vai ser o meu setlist no show do Eddie Vedder no Ibirapuera, dia 22/11! Qual vai ser o seu? Faz o seu aqui: https://somaisumfadepearljam.com.br/setlist-ibirapuera');
  assert.ok(!texto(1).includes('22/11') && !texto(2).includes('20/11'));
  assert.ok(!/[—–]/.test(texto(1)), 'sem travessão');
});

test('link do WhatsApp leva o texto inteiro codificado', () => {
  const link = linkWhats(texto(2));
  assert.ok(link.startsWith('https://wa.me/?text='));
  assert.equal(new URL(link).searchParams.get('text'), texto(2));
  assert.ok(!link.includes(' ') && link.includes('22%2F11'));
});

test('manda a imagem só onde o celular aceita arquivo e fora do navegador do Instagram', () => {
  assert.equal(caminho({ podeArquivo: true, dentro: false }), 'arquivo');
  assert.equal(caminho({ podeArquivo: true, dentro: true }), 'whats');
  assert.equal(caminho({ podeArquivo: false, dentro: false }), 'whats');
  assert.equal(caminho({ podeArquivo: false, dentro: true }), 'whats');
});
