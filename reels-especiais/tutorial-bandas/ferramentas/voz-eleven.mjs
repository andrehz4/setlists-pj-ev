// Narração final no ElevenLabs: voz Jessica (a mesma do reel da agenda), contas em rodízio, cache por voz+texto.
// Lê as falas do roteiro e grava voz-eleven/cena-NN.mp3. tempos.mjs e audio.mjs usam esses arquivos quando existem.
// Outra banda (BANDA=<slug>): grava só as falas próprias dela em voz-eleven/<slug>/. Uma fala pode vir em partes
// (bandas/<slug>.json "voz"): "@07:0:12.24" reaproveita um trecho da fala da Blaymorphed, o resto é texto novo.
import { copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gravarFalas } from '../../../scripts/publish/agenda-reel/voz.mjs';
import { B, RAIZ as R, falas as lerFalas, falaPropria } from './banda.mjs';
const F = lerFalas();
const cenas = Object.keys(F).map(Number).filter(falaPropria);
const partes = (n) => B.voz?.[n] || [B.vozTexto?.[n] || F[n]];
const pedidos = [];
for (const n of cenas) partes(n).forEach((p, i) => { if (!p.startsWith('@')) pedidos.push({ chave: `${n}-${i}`, texto: p }); });
mkdirSync(R + 'voz-eleven/cache', { recursive: true }); mkdirSync(B.V, { recursive: true });
const r = await gravarFalas(pedidos, { tmpDir: R + 'voz-eleven/cache' });
console.log(r.aviso);
if (!r.falas) process.exit(1);
const arq = Object.fromEntries(r.falas.map((f) => [f.chave, f.arquivo]));
for (const n of cenas) {
  const k = String(n).padStart(2, '0'), saida = `${B.V}cena-${k}.mp3`, ps = partes(n);
  if (ps.length === 1) { copyFileSync(arq[`${n}-0`], saida); console.log(k, 'ok'); continue; }
  // Junta as partes: trecho recortado da Blaymorphed + falas novas, tudo em 44,1 kHz mono.
  const ins = ps.flatMap((p, i) => {
    if (!p.startsWith('@')) return ['-i', arq[`${n}-${i}`]];
    const [c, a, b] = p.slice(1).split(':');
    return ['-ss', a, '-to', b, '-i', `${R}voz-eleven/cena-${c}.mp3`];
  });
  const fc = ps.map((_, i) => `[${i}:a]aresample=44100,pan=mono|c0=c0[a${i}]`).join(';') + ';' + ps.map((_, i) => `[a${i}]`).join('') + `concat=n=${ps.length}:v=0:a=1[o]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, '-map', '[o]', '-b:a', '128k', saida]);
  console.log(k, 'ok (partes)');
}
