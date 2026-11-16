// Carimba a versão (hash do conteúdo) em cada arquivo do gerador citado no index.html: ?v=<hash> nos <script>,
// nos modulepreload, no fetch do musicas.json e num importmap pros imports entre módulos (./story.js etc.).
// Motivo: o Cloudflare segura .js no navegador por 4 h; com o endereço mudando a cada versão, sempre chega o novo.
// Rodar depois de mexer em qualquer .js ou no musicas.json: node scripts/setlist-ibirapuera/versao.mjs
// (o versao.test.mjs falha se esquecer).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PASTA = fileURLToPath(new URL('../../setlist-ibirapuera/', import.meta.url));
export const MODULOS = ['app.js', 'folha.js', 'salvar.js', 'sorteio.js', 'story.js', 'story-pincel.js', 'story-video.js', 'telas.js', 'lista.js', 'filtro.js'];
const ARQUIVOS = [...MODULOS, 'musicas.json'];

export function hashes(ler = (n) => readFileSync(PASTA + n)) {
  return Object.fromEntries(ARQUIVOS.map((n) => [n, createHash('sha1').update(ler(n)).digest('hex').slice(0, 8)]));
}

export function carimbar(html, h) {
  const nomes = MODULOS.map((n) => n.replace('.', '\\.')).join('|');
  let out = html.replace(new RegExp(`((?:href|src)=")(${nomes})(?:\\?v=[0-9a-f]+)?"`, 'g'), (_, a, n) => `${a}${n}?v=${h[n]}"`);
  out = out.replace(/fetch\('musicas\.json(?:\?v=[0-9a-f]+)?'\)/g, `fetch('musicas.json?v=${h['musicas.json']}')`);
  const mapa = `<script type="importmap">${JSON.stringify({ imports: Object.fromEntries(MODULOS.map((n) => [`./${n}`, `./${n}?v=${h[n]}`])) })}</script>`;
  out = out.replace(/<script type="importmap">.*?<\/script>\n?/s, '');
  return out.replace(/(<link rel="modulepreload")/, `${mapa}\n$1`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arq = PASTA + 'index.html';
  writeFileSync(arq, carimbar(readFileSync(arq, 'utf8'), hashes()));
  console.log('versões carimbadas no index.html', hashes());
}
