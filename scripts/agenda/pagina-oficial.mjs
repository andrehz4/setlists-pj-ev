// Seção "Turnê oficial" da página /agenda/ (Pearl Jam e Eddie Vedder solo, de pearljam.com/tour), com
// contexto pra quem está chegando agora e JSON-LD MusicEvent de cada data.
import { esc, SITE_BASE } from "../seo/layout.mjs";

const PAIS = { Brazil: "Brasil", USA: "EUA", "United States": "EUA", Canada: "Canadá", Mexico: "México", Argentina: "Argentina",
  Chile: "Chile", Colombia: "Colômbia", Peru: "Peru", England: "Inglaterra", "United Kingdom": "Reino Unido", Germany: "Alemanha",
  Italy: "Itália", Spain: "Espanha", France: "França", Netherlands: "Holanda", Australia: "Austrália", "New Zealand": "Nova Zelândia" };
const pais = (p) => PAIS[p] || p;
const dataBr = (d) => d.split("-").reverse().join("/");
const onde = (s) => [s.casaNome, s.cidade, s.estado, pais(s.pais)].filter(Boolean).join(", ");

export function eventoOficialLd(s) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${s.artista}${s.evento ? `: ${s.evento}` : ""}${s.cidade ? ` em ${s.cidade}` : ""}`,
    startDate: s.data,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: s.casaNome || s.cidade,
      address: { "@type": "PostalAddress", addressLocality: s.cidade || undefined, addressRegion: s.estado || undefined, addressCountry: s.pais || undefined } },
    performer: { "@type": s.artista === "Pearl Jam" ? "MusicGroup" : "Person", name: s.artista },
    ...(s.ingresso ? { offers: { "@type": "Offer", url: s.ingresso, availability: "https://schema.org/InStock" } } : {}),
    url: `${SITE_BASE}/agenda/`,
  };
}

function linha(s) {
  const ingresso = s.ingresso ? ` <a href="${esc(s.ingresso)}" rel="nofollow noopener">ingressos</a>` : "";
  return `<li${s.brasil ? ' class="no-brasil"' : ""}><time datetime="${s.data}">${dataBr(s.data)}</time> `
    + `<strong>${esc(s.artista)}</strong>${s.evento ? ` no ${esc(s.evento)}` : ""}, ${esc(onde(s))}`
    + `${s.brasil ? " <small>(no Brasil!)</small>" : ""}${ingresso}</li>`;
}

export function secaoOficial(oficial = []) {
  const lista = oficial.length
    ? `<ul>${oficial.map(linha).join("\n")}</ul>`
    : "<p>Nenhuma data oficial anunciada no momento. Quando sair, aparece aqui no mesmo dia.</p>";
  return `<h2>Turnê oficial: Pearl Jam e Eddie Vedder</h2>
${lista}
<p><small>Datas de <a href="https://pearljam.com/tour" rel="nofollow noopener">pearljam.com/tour</a>, conferidas todo dia.</small></p>
<h3>Primeira vez num show? O básico</h3>
<p>Pearl Jam é a banda de Seattle que nasceu em 1990 e segue na estrada com Eddie Vedder, Stone Gossard, Jeff Ament,
Mike McCready e Matt Cameron. Eddie também faz shows solo, mais intimistas. A pré-venda de ingressos costuma abrir
primeiro pro Ten Club, o fã-clube oficial, e depois vem a venda geral no link oficial. O repertório muda a cada noite:
depois do show, o setlist sai no setlist.fm e aqui no site, na seção <a href="/show/">Shows</a>. Quer conhecer a banda?
Comece pela página <a href="/banda/">A banda</a> e pelos <a href="/disco/">discos</a>.</p>`;
}
