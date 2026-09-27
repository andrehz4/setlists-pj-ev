// Página de música (/musica/<slug>): interpretação em PT, notas de tradução, disco,
// estatística ao vivo e os shows deste arquivo em que ela tocou. Nunca a letra.
import { pagina, paragrafos, slug, esc, SITE_BASE } from "./layout.mjs";
import { tituloShow } from "./show-page.mjs";
import { tituloDisco } from "./disco-page.mjs";

const MESES = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
// "Jul. 14, 2022" (formato do SONGS_DB) -> "14/07/2022"
export function dataDb(s) {
  const m = String(s || "").match(/^([A-Z][a-z]{2})\.? (\d{1,2}), (\d{4})$/);
  return m && MESES[m[1]] ? `${m[2].padStart(2, "0")}/${String(MESES[m[1]]).padStart(2, "0")}/${m[3]}` : "";
}

const norm = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
const tituloDaChave = k => k.replace(/\b\w/g, c => c.toUpperCase());

// Junta títulos (shows + discos) com os textos (interpretações + notas). Só entra música com texto.
export function catalogoMusicas({ shows, albums, songsDb, interpretacoes, notas }) {
  const titulos = new Map();
  for (const a of albums) for (const t of a.songs) titulos.set(t.toLowerCase(), t);
  for (const s of shows) for (const t of s.songs) if (!titulos.has(t.toLowerCase())) titulos.set(t.toLowerCase(), t);
  const porNorm = new Map([...titulos.values()].map(t => [norm(t), t]));
  const chaves = new Set([...Object.keys(interpretacoes), ...Object.keys(notas)].filter(k => !k.startsWith("_")));
  const musicas = [];
  for (const k of chaves) {
    const titulo = titulos.get(k) || porNorm.get(norm(k)) || tituloDaChave(k);
    const interp = interpretacoes[k] || {};
    const texto = typeof interp === "object" ? interp.text_pt || "" : "";
    const nota = typeof notas[k] === "string" ? notas[k] : "";
    if (!texto && !nota) continue;
    musicas.push({
      titulo, slug: slug(titulo), texto, nota,
      porShow: (typeof interp === "object" && interp.byShow_pt) || {},
      album: albums.find(a => a.year > 0 && a.songs.some(t => t.toLowerCase() === titulo.toLowerCase())) || null,
      db: songsDb[norm(titulo)] || null,
      shows: shows.filter(s => s.songs.some(t => t.toLowerCase() === titulo.toLowerCase())),
    });
  }
  // Mesma música com chaves diferentes (ex.: "don't gimme no lip" e "dont gimme no lip"): junta numa página.
  const porSlug = new Map();
  for (const m of musicas) {
    const j = porSlug.get(m.slug);
    if (!j) { porSlug.set(m.slug, m); continue; }
    j.texto ||= m.texto;
    j.nota ||= m.nota;
    j.porShow = { ...m.porShow, ...j.porShow };
  }
  return [...porSlug.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt"));
}

export function tituloMusica(m) {
  const quem = m.album ? m.album.artist : "Pearl Jam";
  return m.db?.type === "Cover" ? `${m.titulo} (versão do ${quem}): significado e interpretação`
    : `${m.titulo}, do ${quem}: significado e interpretação`;
}

export function paginaMusica(m, catalogo) {
  const url = `${SITE_BASE}/musica/${m.slug}`;
  const resumo = (m.texto || m.nota).replace(/\s+/g, " ").slice(0, 155).trimEnd() + "…";
  const fatos = [];
  if (m.album) fatos.push(`Disco: <a href="/disco/${esc(m.album.id)}">${esc(tituloDisco(m.album))}</a> (${m.album.year})`);
  if (m.db?.timesPlayed) fatos.push(`Tocada ${m.db.timesPlayed} vezes ao vivo pelo Pearl Jam`);
  if (dataDb(m.db?.firstPlayed)) fatos.push(`estreia ao vivo em ${dataDb(m.db.firstPlayed)}`);
  if (dataDb(m.db?.lastPlayed)) fatos.push(`última vez em ${dataDb(m.db.lastPlayed)}`);
  const aoVivo = m.shows.map(s => `<li><a href="/show/${esc(s.id)}">${esc(tituloShow(s))}</a>`
    + `${m.porShow[s.id] ? `\n${paragrafos(m.porShow[s.id])}` : ""}</li>`).join("\n");
  const irmas = m.album ? catalogo.filter(x => x !== m && x.album?.id === m.album.id) : [];
  const corpo = [
    fatos.length ? `<p class="meta">${fatos.join(" · ")}</p>` : "",
    m.texto ? `<h2>Interpretação</h2>\n${paragrafos(m.texto)}` : "",
    m.nota ? `<h2>Notas de tradução</h2>\n${paragrafos(m.nota)}` : "",
    aoVivo ? `<h2>Ao vivo nos shows deste arquivo</h2>\n<ul>\n${aoVivo}\n</ul>` : "",
    irmas.length ? `<h2>Mais do disco ${esc(tituloDisco(m.album))}</h2>\n<ul class="cols">${irmas
      .map(x => `<li><a href="/musica/${esc(x.slug)}">${esc(x.titulo)}</a></li>`).join("")}</ul>` : "",
    `<a class="cta" href="/">Ouvir e ver as cifras no site</a>`,
  ].filter(Boolean).join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: m.titulo,
    url,
    description: resumo,
    ...(m.album ? {
      includedInAlbum: { "@type": "MusicAlbum", name: tituloDisco(m.album), url: `${SITE_BASE}/disco/${m.album.id}` },
    } : {}),
  };
  return pagina({ titulo: tituloMusica(m), h1: m.titulo, descricao: resumo, url, ld, trilha: [["Músicas", "/musica/"]], corpo });
}

const linkMusica = m => `<li><a href="/musica/${esc(m.slug)}">${esc(m.titulo)}</a></li>`;

export function paginaIndiceMusicas(catalogo) {
  const grupos = {};
  for (const m of catalogo) (grupos[m.titulo[0].toUpperCase().replace(/[^A-Z]/, "#")] ||= []).push(m);
  const corpo = `<p>${catalogo.length} músicas de Pearl Jam e Eddie Vedder com interpretação, notas de tradução `
    + `e histórico ao vivo.</p>\n` + Object.entries(grupos).sort().map(([l, lista]) =>
    `<h2>${l}</h2>\n<ul class="cols">${lista.map(linkMusica).join("")}</ul>`)
    .join("\n");
  return pagina({
    titulo: "Músicas do Pearl Jam: significado e interpretação", h1: "Músicas",
    descricao: `Significado, interpretação e histórico ao vivo de ${catalogo.length} músicas de Pearl Jam e Eddie Vedder.`,
    url: `${SITE_BASE}/musica/`, corpo,
  });
}
