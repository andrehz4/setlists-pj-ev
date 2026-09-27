// Páginas de disco (/disco/<id>, com o ensaio completo de media/albums/<id>.md),
// índice /disco/ e a página /banda/ com os integrantes.
import { pagina, esc, SITE_BASE } from "./layout.mjs";

// Markdown mínimo dos ensaios: títulos, parágrafos, listas, citações, **negrito**, *itálico*.
// O "# " do topo vira o h1 da página, então aqui ele é descartado.
export function mdParaHtml(md) {
  const inline = t => esc(t).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const saida = [];
  let lista = null;
  const fechaLista = () => { if (lista) { saida.push(`<ul>${lista.join("")}</ul>`); lista = null; } };
  for (const bloco of String(md || "").replace(/\r/g, "").split(/\n{2,}/)) {
    const b = bloco.trim();
    if (!b) continue;
    const linhas = b.split("\n");
    if (linhas.every(l => /^\s*[-*] /.test(l))) {
      lista = lista || [];
      for (const l of linhas) lista.push(`<li>${inline(l.replace(/^\s*[-*] /, ""))}</li>`);
      continue;
    }
    fechaLista();
    if (/^# /.test(b)) continue;
    const h = b.match(/^(#{2,4}) (.+)$/);
    if (h) saida.push(`<h${h[1].length === 2 ? 2 : 3}>${inline(h[2])}</h${h[1].length === 2 ? 2 : 3}>`);
    else if (linhas.every(l => l.startsWith(">"))) {
      saida.push(`<blockquote>${inline(linhas.map(l => l.replace(/^>\s?/, "")).join(" "))}</blockquote>`);
    }
    else saida.push(`<p>${inline(linhas.join(" "))}</p>`);
  }
  fechaLista();
  return saida.join("\n");
}

// "Into the Wild (EV, 2007)" -> "Into the Wild"; o ano já aparece do lado no título da página.
export const tituloDisco = a => a.title.replace(/\s*\((EV, )?\d{4}\)$/, "");

const capaUrl = (a, capas) => (capas.has(a.id) ? `/media/albums/${a.id}.jpg` : null);

export function paginaDisco(a, { ensaios, capas }, catalogo) {
  const url = `${SITE_BASE}/disco/${a.id}`;
  const comPagina = new Map(catalogo.map(m => [m.titulo.toLowerCase(), m]));
  const faixas = a.songs.map(t => {
    const m = comPagina.get(t.toLowerCase());
    return `<li>${m ? `<a href="/musica/${esc(m.slug)}">${esc(t)}</a>` : esc(t)}</li>`;
  }).join("");
  const ensaio = ensaios[a.id] || "";
  const primeiroParagrafo = (ensaio.split(/\n{2,}/).find(p => !/^#/.test(p.trim())) || "").replace(/[*#>]/g, "").trim();
  const padrao = `${tituloDisco(a)}, disco de ${a.artist} lançado em ${a.year}, com ${a.songs.length} faixas.`;
  const desc = (primeiroParagrafo || padrao)
    .replace(/\s+/g, " ").slice(0, 155).trimEnd() + "…";
  const capa = capaUrl(a, capas);
  const corpo = [
    capa ? `<img class="capa" src="${capa}" alt="Capa do disco ${esc(tituloDisco(a))}">` : "",
    `<p class="meta">${esc(a.artist)} · ${a.year} · ${a.songs.length} faixas</p>`,
    `<h2>Faixas</h2>\n<ol class="set">${faixas}</ol>`,
    ensaio ? `<h2>Análise do disco</h2>\n${mdParaHtml(ensaio)}` : "",
  ].filter(Boolean).join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: tituloDisco(a),
    byArtist: { "@type": a.artist === "Pearl Jam" ? "MusicGroup" : "Person", name: a.artist },
    datePublished: String(a.year),
    numTracks: a.songs.length,
    ...(capa ? { image: SITE_BASE + capa } : {}),
    track: a.songs.map((t, i) => ({ "@type": "MusicRecording", name: t, position: i + 1 })),
    url,
  };
  return pagina({
    titulo: `${tituloDisco(a)} (${a.year}), ${a.artist}: faixas e análise do disco`, h1: `${tituloDisco(a)} (${a.year})`,
    descricao: desc, url, ld, trilha: [["Discos", "/disco/"]], corpo, imagem: capa ? SITE_BASE + capa : undefined,
  });
}

export function paginaIndiceDiscos(albums) {
  const lista = [...albums].sort((x, y) => x.year - y.year)
    .map(a => `<li><a href="/disco/${esc(a.id)}">${esc(tituloDisco(a))}</a> (${a.year}, ${esc(a.artist)})</li>`).join("\n");
  return pagina({
    titulo: "Discografia do Pearl Jam e Eddie Vedder com análise de cada disco", h1: "Discos",
    descricao: `Os ${albums.length} discos de Pearl Jam e Eddie Vedder, com faixas e análise completa de cada um.`,
    url: `${SITE_BASE}/disco/`, corpo: `<ul>\n${lista}\n</ul>`,
  });
}

export function paginaBanda(membros) {
  const corpo = membros.map(m => `<h2>${esc(m.name)}</h2>
<p class="meta">${[m.role, ...Object.values(m.bio)].map(esc).join(" · ")}</p>
<p>${esc(String(m.text).replace(/<[^>]+>/g, ""))}</p>`).join("\n");
  return pagina({
    titulo: "Integrantes do Pearl Jam: quem é quem na banda", h1: "A banda",
    descricao: `Quem é quem no Pearl Jam: ${membros.map(m => m.name).join(", ")}.`,
    url: `${SITE_BASE}/banda/`, corpo,
    ld: { "@context": "https://schema.org", "@type": "MusicGroup", name: "Pearl Jam",
      member: membros.map(m => ({ "@type": "Person", name: m.name, roleName: m.role })) },
  });
}
