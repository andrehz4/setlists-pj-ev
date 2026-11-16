// Gera setlist-ibirapuera/musicas.json (catálogo) e a lista das músicas que precisam de PNG na nossa fonte.
// Entradas locais (fora do git): índice do gerador oficial e estudo do setlist.fm. Rodar: node scripts/setlist-ibirapuera/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { montarCatalogo } from './catalogo.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const LETRA = `${RAIZ}/reels-especiais/letra-eddie`;
const s = fs.readFileSync(`${RAIZ}/dados/albums.js`, 'utf8');
const albums = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
const ids = new Map(JSON.parse(fs.readFileSync(`${LETRA}/musicas-oficiais.json`, 'utf8')).map((o) => [o.imageUrl, o]));
// índice das PNGs oficiais + IDs de YouTube/Spotify extraídos do bundle do gerador (docs/setlist-ibirapuera/REA-GERADOR-OFICIAL.md)
const oficial = JSON.parse(fs.readFileSync(`${LETRA}/indice.json`, 'utf8')).musicas.map((o) => ({ ...ids.get(o.url), ...o }));
const solo = JSON.parse(fs.readFileSync(`${RAIZ}/reels-especiais/eddie-carreira/estudo.json`, 'utf8')).solo.ranking;

const cat = montarCatalogo({ oficial, solo, albums });
const faltam = [];
for (const g of cat) for (const m of g.musicas) {
  if (m.png) continue;
  m.png = `img/${m.chave.replace(/ /g, '-')}.png`;
  faltam.push({ nome: m.nome, arq: m.png });
}
const OUT = `${RAIZ}/setlist-ibirapuera`;
fs.writeFileSync(`${OUT}/musicas.json`, JSON.stringify({ geradoEm: new Date().toISOString().slice(0, 10), grupos: cat }));
fs.writeFileSync(`${LETRA}/ibira-faltam.json`, JSON.stringify(faltam, null, 1));
console.log(`${cat.reduce((n, g) => n + g.musicas.length, 0)} músicas, ${faltam.length} na nossa fonte`);
