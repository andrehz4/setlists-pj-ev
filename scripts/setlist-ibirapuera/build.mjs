// Gera setlist-ibirapuera/musicas.json (catálogo) e a lista das músicas que precisam de PNG na nossa fonte.
// Entradas locais (fora do git): índice do gerador oficial e estudo do setlist.fm. Rodar: node scripts/setlist-ibirapuera/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { montarCatalogo, chave } from './catalogo.mjs';
import { modeloDeShow } from './modelo.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const LETRA = `${RAIZ}/reels-especiais/letra-eddie`;
const s = fs.readFileSync(`${RAIZ}/dados/albums.js`, 'utf8');
const albums = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
const ids = new Map(JSON.parse(fs.readFileSync(`${LETRA}/musicas-oficiais.json`, 'utf8')).map((o) => [o.imageUrl, o]));
// índice das PNGs oficiais + IDs de YouTube/Spotify extraídos do bundle do gerador (docs/setlist-ibirapuera/REA-GERADOR-OFICIAL.md)
const oficial = JSON.parse(fs.readFileSync(`${LETRA}/indice.json`, 'utf8')).musicas.map((o) => ({ ...ids.get(o.url), ...o }));
const estudo = JSON.parse(fs.readFileSync(`${RAIZ}/reels-especiais/eddie-carreira/estudo.json`, 'utf8')).solo;
const solo = estudo.ranking;

const { carregar } = await import(`${RAIZ}/reels-especiais/eddie-carreira/agregar-lib.mjs`);
const recentes = carregar('eddie-vedder').shows.filter((s) => s.ano >= 2022);  // era Earthling: o show que vem aí
const modelo = modeloDeShow(recentes, chave);
const cat = montarCatalogo({ oficial, solo, albums });
const faltam = [];
for (const g of cat) for (const m of g.musicas) {
  // PNG oficial (glitch.ge) é copiado e hospedado aqui: o site nunca carrega imagem de fora (CSP img-src 'self').
  // Música oficial nova: baixe o PNG pra setlist-ibirapuera/img/oficial/ com o mesmo nome do arquivo.
  if (m.png?.startsWith('http')) m.png = `img/oficial/${m.png.split('/').pop()}`;
  if (m.png) continue;
  m.png = `img/${m.chave.replace(/ /g, '-')}.png`;
  faltam.push({ nome: m.nome, arq: m.png });
}
const OUT = `${RAIZ}/setlist-ibirapuera`;
fs.writeFileSync(`${OUT}/musicas.json`, JSON.stringify({ geradoEm: new Date().toISOString().slice(0, 10),
  showsSolo: estudo.total_shows_com_setlist, primeiroShow: estudo.primeiro_show, mediaPorShow: estudo.media_de_musicas_por_show, modelo, grupos: cat }));
fs.writeFileSync(`${LETRA}/ibira-faltam.json`, JSON.stringify(faltam, null, 1));
console.log(`${cat.reduce((n, g) => n + g.musicas.length, 0)} músicas, ${faltam.length} na nossa fonte`);
