// Rascunho da narração com a voz Siri padrão do Mac (say sem -v, igual ao rascunho da audiodescrição do Terra Gentil), só pra ouvir ritmo e texto antes do ElevenLabs.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = new URL('.', import.meta.url).pathname;
const md = readFileSync(dir + '../roteiro-blaymorphed.md', 'utf8');
const PRON = [['Blaymorphed', 'Blêi mórft'], ['setlists', 'sét-lists'], ['setlist', 'sét-list'], ['Stones Bar', 'Istôuns Bar'], ['story', 'istóri']];
const cenas = [];
let atual = null;
for (const l of md.split('\n')) {
  const c = l.match(/^### Cena (\d+)/);
  if (c) { atual = { n: c[1], txt: [] }; cenas.push(atual); continue; }
  if (l.startsWith('## ')) atual = null;
  if (atual && l.startsWith('> ')) atual.txt.push(l.slice(2));
}
const lista = [];
for (const { n, txt } of cenas) {
  let t = txt.join(' ');
  for (const [a, b] of PRON) t = t.replaceAll(a, b);
  const arq = `${dir}cena-${n.padStart(2, '0')}.aiff`;
  writeFileSync(dir + 'texto.txt', t);
  execFileSync('say', ['-f', dir + 'texto.txt', '-o', arq]);
  lista.push(`file '${arq}'`, `file '${dir}pausa.aiff'`);
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', '0.8', dir + 'pausa.aiff']);
writeFileSync(dir + 'lista.txt', lista.join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', dir + 'lista.txt', '-ar', '44100', '-c:a', 'aac', '-b:a', '128k', dir + 'narracao-siri.m4a']);
console.log(`${cenas.length} cenas`);
