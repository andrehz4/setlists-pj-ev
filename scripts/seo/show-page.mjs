// Página estática de um show (/show/<id>) e índice /show/: setlist completo, local, turnê e notas.
// Pensada pra busca "setlist <banda> <cidade> <ano>", que antes não tinha onde cair.
import { pagina, esc, slug, SITE_BASE } from "./layout.mjs";

export const cidadeCurta = c => String(c || "").replace(/, [A-Z]{2}$/, "").replace(/, [A-Z]{2}$/, "");
export const dataBr = d => String(d || "").split("-").reverse().join("/");

// "no Rio de Janeiro", "em São Paulo": cidades que pedem artigo
const COM_ARTIGO = { "Rio de Janeiro": "no" };
export const naCidade = c => `${COM_ARTIGO[cidadeCurta(c)] || "em"} ${cidadeCurta(c)}`;

export function tituloShow(s) {
  return `${s.artist} ${naCidade(s.city)}, ${dataBr(s.date)}: setlist completo`;
}

const lista = (titulo, itens) => (itens && itens.length
  ? `<h2>${titulo}</h2>\n<ul class="cols">${itens.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "");

export function paginaShow(show, todos, midia = {}, comPagina = new Set()) {
  const url = `${SITE_BASE}/show/${show.id}`;
  const desc = `Setlist completo de ${show.artist} no show de ${show.venue}, ${cidadeCurta(show.city)}, `
    + `${dataBr(show.date)} (${show.tour}): ${show.songs.length} músicas, de ${show.songs[0]} a ${show.songs.at(-1)}.`;
  const m = midia[show.id] || {};
  const fotos = Array.from({ length: Math.min(m.photos || 0, 4) }, (_, i) => `/media/${show.id}/photo-${i + 1}-thumb.jpg`);
  const quando = `<time datetime="${esc(show.date)}">${dataBr(show.date)}</time>`;
  const meta = [esc(show.venue), esc(cidadeCurta(show.city)), quando, esc(show.tour), `${show.songs.length} músicas`]
    .join(" · ");
  const musica = t => (comPagina.has(slug(t)) ? `<a href="/musica/${slug(t)}">${esc(t)}</a>` : esc(t));
  const outros = todos.filter(s => s.id !== show.id)
    .map(s => `<li><a href="/show/${esc(s.id)}">${esc(`${s.artist}, ${cidadeCurta(s.city)}, ${dataBr(s.date)}`)}</a></li>`);
  const corpo = [
    `<p class="meta">${meta}</p>`,
    show.note ? `<p>${esc(show.note)}</p>` : "",
    typeof show.notes_audio === "string" ? `<p>${esc(show.notes_audio)}</p>` : "",
    `<h2>Setlist</h2>\n<ol class="set">${show.songs.map(x => `<li>${musica(x)}</li>`).join("")}</ol>`,
    lista("Passagem de som", show.soundcheck),
    lista("Ficaram de fora (tocadas em outros shows da turnê)", show.not_played),
    fotos.length ? `<h2>Fotos</h2>\n<div class="fotos">${fotos.map((f, i) =>
      `<img src="${f}" alt="${esc(`${show.artist} em ${show.venue}, foto ${i + 1}`)}" loading="lazy">`).join("")}</div>` : "",
    `<p class="meta">Fonte do setlist: ${esc(show.source)}</p>`,
    `<a class="cta" href="/">Ver fotos, áudio e interpretações no site</a>`,
    `<h2>Outros shows</h2>\n<ul>\n${outros.join("\n")}\n</ul>`,
  ].filter(Boolean).join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${show.artist}: ${show.venue}, ${dataBr(show.date)}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: show.venue, address: show.city },
    performer: { "@type": show.artist === "Pearl Jam" ? "MusicGroup" : "Person", name: show.artist },
    image: [`${SITE_BASE}/og.jpg`],
    description: desc,
    url,
  };
  return pagina({ titulo: tituloShow(show), descricao: desc, url, ld, trilha: [["Shows", "/show/"]], corpo });
}

export function paginaIndiceShows(shows) {
  const porAno = {};
  const ordenados = [...shows].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of ordenados) (porAno[s.date.slice(0, 4)] ||= []).push(s);
  const item = s => `<li><a href="/show/${esc(s.id)}">${esc(tituloShow(s))}</a></li>`;
  const blocos = Object.entries(porAno).sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ano, l]) => `<h2>${ano}</h2>\n<ul>\n${l.map(item).join("\n")}\n</ul>`);
  const desc = `Setlists completos de ${shows.length} shows de Pearl Jam e Eddie Vedder presenciados ao vivo, de 2005 a 2024.`;
  return pagina({
    titulo: "Setlists de Pearl Jam e Eddie Vedder ao vivo", h1: "Shows", descricao: desc,
    url: `${SITE_BASE}/show/`, corpo: `<p>${esc(desc)}</p>\n${blocos.join("\n")}`,
  });
}
