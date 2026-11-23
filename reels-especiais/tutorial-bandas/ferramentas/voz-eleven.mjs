// Narração final no ElevenLabs: voz Jessica (a mesma do reel da agenda), contas em rodízio, cache por voz+texto.
// Lê as falas do roteiro e grava voz-eleven/cena-NN.mp3. tempos.mjs e audio.mjs usam esses arquivos quando existem.
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { gravarFalas } from '../../../scripts/publish/agenda-reel/voz.mjs';
const R = new URL('..', import.meta.url).pathname;
const md = readFileSync(R + 'roteiro-blaymorphed.md', 'utf8');
const falas = []; let cur = null;
for (const l of md.split('\n')) {
  const m = l.match(/^### Cena (\d+)/);
  if (m) { cur = { chave: m[1].padStart(2, '0'), texto: '' }; falas.push(cur); continue; }
  if (l.startsWith('## ')) cur = null;
  if (cur && l.startsWith('> ')) cur.texto += (cur.texto ? ' ' : '') + l.slice(2).trim();
}
mkdirSync(R + 'voz-eleven/cache', { recursive: true });
const r = await gravarFalas(falas, { tmpDir: R + 'voz-eleven/cache' });
console.log(r.aviso);
if (!r.falas) process.exit(1);
for (const f of r.falas) { copyFileSync(f.arquivo, `${R}voz-eleven/cena-${f.chave}.mp3`); console.log(f.chave, f.dur.toFixed(1), 's'); }
