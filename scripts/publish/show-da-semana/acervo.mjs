// Show da Semana: lê o material que o projeto já tem pra montar um carrossel de show.
// Duas fontes de setlist: o setlist.fm espelhado em media/setlistfm (1400+ shows, separa show e bis)
// e dados/shows.js (shows que o site cobre, com pôster e fotos em media/<id>/, sem separar o bis).
import fs from "node:fs";
import path from "node:path";
import { lerColecao } from "../../seo/dados-site.mjs";

const ARTISTA = { pj: "Pearl Jam", ev: "Eddie Vedder" };

// "pj:1996-11-15" ou "pj-2005-12-02" -> { prefixo, artista, data }
export function lerChave(chave) {
  const m = String(chave).match(/^(pj|ev)[:-](\d{4}-\d{2}-\d{2})$/);
  if (!m) throw new Error(`chave inválida "${chave}": use pj:AAAA-MM-DD ou ev:AAAA-MM-DD`);
  return { prefixo: m[1], artista: ARTISTA[m[1]], data: m[2] };
}

export function showsDoSite(raiz) {
  return lerColecao(fs.readFileSync(path.join(raiz, "dados/shows.js"), "utf8"), "SHOWS");
}

// Setlist do setlist.fm: { show, bis, url, local, cidade, turne } ou null.
// Mais de um show no mesmo dia (raro) devolve o primeiro e avisa em `outros`.
export function setlistFm(raiz, artista, data) {
  const [a, m, d] = data.split("-");
  const arq = path.join(raiz, "media/setlistfm/by-year", `${a}.json`);
  if (!fs.existsSync(arq)) return null;
  const doAno = JSON.parse(fs.readFileSync(arq, "utf8")).shows || [];
  const achados = doAno.filter((s) => s.artist === artista && s.eventDate === `${d}-${m}-${a}`);
  if (!achados.length) return null;
  const s = achados[0];
  const show = [], bis = [];
  for (const set of s.sets || []) (set.encore ? bis : show).push(...(set.songs || []).map(nomeMusica));
  return {
    show, bis, url: s.url, local: s.venue,
    cidade: [s.city, s.country].filter(Boolean).join(", "),
    turne: s.tour || null, outros: achados.length - 1,
  };
}

function nomeMusica(m) {
  return m.cover ? `${m.name} (${m.cover})` : m.name;
}

// Pôster e fotos que já estão no repo pra shows do site.
export function midiaLocal(raiz, id) {
  const pasta = path.join(raiz, "media", id);
  if (!fs.existsSync(pasta)) return { poster: null, fotos: 0 };
  const nomes = fs.readdirSync(pasta);
  const poster = nomes.find((n) => /^poster.*\.(jpe?g|png)$/i.test(n));
  return {
    poster: poster ? `media/${id}/${poster}` : null,
    fotos: nomes.filter((n) => /^photo-\d+\.(jpe?g|png)$/i.test(n)).length,
  };
}

// Fôlego da série: quantos shows já têm material pronto e quantos dependem de pesquisa.
export function folego(raiz) {
  const site = showsDoSite(raiz).map((s) => ({ ...s, ...midiaLocal(raiz, s.id) }));
  const prontos = site.filter((s) => s.poster);
  const idx = JSON.parse(fs.readFileSync(path.join(raiz, "media/setlistfm/index.json"), "utf8"));
  return {
    comPosterNoRepo: prontos.length,
    doSiteSemPoster: site.length - prontos.length,
    setlistFm: idx.totalShows,
    prontos: prontos.map((s) => s.id),
  };
}
