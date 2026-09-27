// Página estática de um show (/show/<id>): setlist completo, local, turnê e notas.
// Pensada pra busca "setlist <banda> <cidade> <ano>", que hoje não tem onde cair.
import { SITE_BASE, esc } from "../news/news-page.mjs";

const NOME = "Só mais um fã de Pearl Jam";

export const cidadeCurta = c => String(c || "").replace(/, [A-Z]{2}$/, "").replace(/, [A-Z]{2}$/, "");
export const dataBr = d => String(d || "").split("-").reverse().join("/");

// "no Rio de Janeiro", "em São Paulo": cidades que pedem artigo
const COM_ARTIGO = { "Rio de Janeiro": "no" };
export const naCidade = c => `${COM_ARTIGO[cidadeCurta(c)] || "em"} ${cidadeCurta(c)}`;

export function tituloShow(s) {
  return `${s.artist} ${naCidade(s.city)}, ${dataBr(s.date)}: setlist completo`;
}

const lista = (titulo, itens) => (itens && itens.length
  ? `<h2>${titulo}</h2>\n<ul class="cols">${itens.map(x => `<li>${esc(x)}</li>`).join("")}</ul>\n` : "");

export function paginaShow(show, todos, midia = {}) {
  const url = `${SITE_BASE}/show/${show.id}`;
  const titulo = tituloShow(show);
  const desc = `Setlist completo de ${show.artist} no show de ${show.venue}, ${cidadeCurta(show.city)}, `
    + `${dataBr(show.date)} (${show.tour}): ${show.songs.length} músicas, de ${show.songs[0]} a ${show.songs.at(-1)}.`;
  const m = midia[show.id] || {};
  const fotos = Array.from({ length: Math.min(m.photos || 0, 4) }, (_, i) => `/media/${show.id}/photo-${i + 1}-thumb.jpg`);
  const artista = { "@type": show.artist === "Pearl Jam" ? "MusicGroup" : "Person", name: show.artist };
  const ld = [{
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${show.artist}: ${show.venue}, ${dataBr(show.date)}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: show.venue, address: show.city },
    performer: artista,
    image: [`${SITE_BASE}/og.jpg`],
    description: desc,
    url,
  }, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: NOME, item: `${SITE_BASE}/` },
      { "@type": "ListItem", position: 2, name: "Shows", item: `${SITE_BASE}/show/` },
      { "@type": "ListItem", position: 3, name: titulo, item: url },
    ],
  }];
  const quando = `<time datetime="${esc(show.date)}">${dataBr(show.date)}</time>`;
  const meta = [esc(show.venue), esc(cidadeCurta(show.city)), quando, esc(show.tour), `${show.songs.length} músicas`]
    .join(" · ");
  const outros = todos.filter(s => s.id !== show.id)
    .map(s => `<li><a href="/show/${esc(s.id)}">${esc(`${s.artist}, ${cidadeCurta(s.city)}, ${dataBr(s.date)}`)}</a></li>`);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)} | ${NOME}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NOME}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE_BASE}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>
body{margin:0;background:#f4eee2;color:#1d1a16;font:18px/1.6 Georgia,"Times New Roman",serif}
.wrap{max-width:760px;margin:0 auto;padding:20px 16px 48px}
header a,nav a,footer a{color:#a8322b;text-decoration:none;font:600 13px/1.4 system-ui,sans-serif;letter-spacing:.04em}
nav{margin:14px 0 6px;font:13px system-ui,sans-serif;color:#6d655b}
h1{font-size:clamp(26px,5vw,38px);line-height:1.15;margin:8px 0 12px}
h2{font:700 15px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#6d655b;margin-top:28px}
.meta{font:15px/1.5 system-ui,sans-serif;color:#6d655b}
ol.set{padding-left:28px;columns:2 240px;column-gap:28px}ol.set li{margin:3px 0;break-inside:avoid}
ul.cols{columns:2 240px;column-gap:28px}
.fotos{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.fotos img{width:100%;height:auto;border-radius:4px;display:block}
.cta{display:inline-block;margin:24px 0;padding:11px 18px;background:#a8322b;color:#fff;border-radius:4px;
text-decoration:none;font:600 15px system-ui,sans-serif}
aside li{margin:6px 0}aside a{color:#1d1a16}
footer{margin-top:40px;border-top:1px solid #d9cfbf;padding-top:14px}
</style>
</head>
<body>
<div class="wrap">
<header><a href="/">${NOME.toUpperCase()}</a></header>
<nav><a href="/">Início</a> › <a href="/show/">Shows</a></nav>
<article>
<h1>${esc(titulo)}</h1>
<p class="meta">${meta}</p>
${show.note ? `<p>${esc(show.note)}</p>\n` : ""}\
${typeof show.notes_audio === "string" ? `<p>${esc(show.notes_audio)}</p>\n` : ""}\
<h2>Setlist</h2>
<ol class="set">${show.songs.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
${lista("Passagem de som", show.soundcheck)}\
${lista("Ficaram de fora (tocadas em outros shows da turnê)", show.not_played)}\
${fotos.length ? `<h2>Fotos</h2>\n<div class="fotos">${fotos.map((f, i) =>
    `<img src="${f}" alt="${esc(`${show.artist} em ${show.venue}, foto ${i + 1}`)}" loading="lazy">`).join("")}</div>\n` : ""}\
<p class="meta">Fonte do setlist: ${esc(show.source)}</p>
</article>
<a class="cta" href="/">Ver fotos, áudio e interpretações no site</a>
<aside><h2>Outros shows</h2><ul>
${outros.join("\n")}
</ul></aside>
<footer><a href="/">Setlists, cifras e notícias de Pearl Jam e Eddie Vedder</a></footer>
</div>
</body>
</html>
`;
}
