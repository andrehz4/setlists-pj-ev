// Monta o catálogo do gerador do Ibirapuera: solo do Eddie (setlist.fm) + músicas do gerador oficial, em grupos.
// Puro (testado): montarCatalogo({ oficial, solo, albums }) -> [{ grupo, musicas: [{ nome, chave, png, vezes }] }]
const APELIDO = { 'elderly woman behind the counter in a small town': 'elderly woman',
  'youve got to hide your love away': 'youve got to hide your' };  // nomes que o gerador oficial abrevia
export const chave = (s) => { const k = chave0(s); return APELIDO[k] || k; };
const chave0 = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/\.\.\.$/, '').replace(/[^a-z0-9]+/g, ' ').trim();

const EV_EXTRA = 'Outras do Eddie';
const PJ_EXTRA = 'Outras do Pearl Jam';
const COVERS = 'Covers';

export function montarCatalogo({ oficial, solo, albums }) {
  const grupoDe = new Map();
  for (const a of albums) {
    const nome = a.artist === 'Eddie Vedder' ? a.title.replace(/ \(EV, \d+\)/, '') : a.title;
    if (a.artist === 'Ambos') continue;
    for (const m of a.songs) if (!grupoDe.has(chave(m))) grupoDe.set(chave(m), { grupo: nome, ev: a.artist === 'Eddie Vedder' });
  }
  const ofi = new Map(oficial.map((o) => [chave(o.nome), o]));
  const musicas = new Map();
  const poe = (nome, extra) => {
    const k = chave(nome);
    const o = ofi.get(k) || {};
    const atual = musicas.get(k) || { nome, chave: k, png: o.url || null, yt: o.youtubeID || null, sp: o.spotifyID || null, vezes: 0 };
    musicas.set(k, { ...atual, ...extra });
  };
  for (const s of solo) poe(s.musica, { vezes: s.vezes, cover: !!s.cover_de, pj: !!s.do_pearl_jam, coverDe: s.cover_de || null });
  for (const o of oficial) if (!musicas.has(chave(o.nome))) poe(o.nome, { pj: true });
  const grupos = new Map();
  for (const m of musicas.values()) {
    const g = grupoDe.get(m.chave);
    const nome = m.cover ? COVERS : g ? g.grupo : m.pj ? PJ_EXTRA : EV_EXTRA;
    if (!grupos.has(nome)) grupos.set(nome, []);
    grupos.get(nome).push({ nome: m.nome, chave: m.chave, png: m.png, vezes: m.vezes, ...(m.coverDe ? { de: m.coverDe } : {}),
      ...(m.yt ? { yt: m.yt } : {}), ...(m.sp ? { sp: m.sp } : {}) });
  }
  const ordem = [...albums.filter((a) => a.artist === 'Eddie Vedder').map((a) => a.title.replace(/ \(EV, \d+\)/, '')), EV_EXTRA,
    ...albums.filter((a) => a.artist === 'Pearl Jam').map((a) => a.title), PJ_EXTRA, COVERS];
  return ordem.filter((g) => grupos.has(g)).map((g) => ({
    grupo: g, ev: ordem.indexOf(g) <= ordem.indexOf(EV_EXTRA),
    musicas: grupos.get(g).sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome)),
  }));
}
