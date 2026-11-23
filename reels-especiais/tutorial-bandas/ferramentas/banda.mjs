// Qual banda está sendo montada (variável BANDA=<slug>, padrão blaymorphed) e onde ficam as coisas dela.
// A Blaymorphed usa as pastas de sempre (assets/, gravacoes/, voz-eleven/); as outras, uma subpasta com o slug.
// Dados por banda em bandas/<slug>.json; as falas que não estão lá vêm do roteiro da Blaymorphed.
import { readFileSync } from 'node:fs';
export const RAIZ = new URL('..', import.meta.url).pathname;
export const SLUG = process.env.BANDA || 'blaymorphed';
const base = SLUG === 'blaymorphed';
export const B = JSON.parse(readFileSync(`${RAIZ}bandas/${SLUG}.json`, 'utf8'));
B.base = base;
B.sem = B.sem || [];
B.A = base ? 'assets/' : `assets/${SLUG}/`; // caminho relativo usado no HTML
B.ASS = RAIZ + B.A; // absoluto
B.G = base ? `${RAIZ}gravacoes/` : `${RAIZ}gravacoes/${SLUG}/`;
B.V = base ? `${RAIZ}voz-eleven/` : `${RAIZ}voz-eleven/${SLUG}/`;
B.HTML = base ? 'index.html' : `tutorial-${SLUG}.html`;
B.URL = `https://somaisumfadepearljam.com.br/setlist/${SLUG}/`;

// Falas (texto da legenda) do roteiro da Blaymorphed, trocadas pelas da banda quando existirem.
export function falasDoRoteiro() {
  const md = readFileSync(RAIZ + 'roteiro-blaymorphed.md', 'utf8');
  const f = {}; let cur = null;
  for (const l of md.split('\n')) {
    const m = l.match(/^### Cena (\d+)/);
    if (m) { cur = +m[1]; f[cur] = ''; continue; }
    if (l.startsWith('## ')) cur = null;
    if (cur && l.startsWith('> ')) f[cur] += (f[cur] ? ' ' : '') + l.slice(2).trim();
  }
  return f;
}
export function falas() {
  const f = falasDoRoteiro();
  for (const [n, t] of Object.entries(B.falas || {})) f[n] = t;
  for (const n of B.sem) delete f[n];
  return f;
}
// Cena com fala própria da banda (gravada em voz-eleven/<slug>/) ou herdada da Blaymorphed.
export const falaPropria = (n) => B.base || Boolean(B.falas?.[n]);
