// Turnê oficial na /agenda/ (Pearl Jam e Eddie Vedder, de pearljam.com/tour): show no Brasil vira cartaz com
// botão de ingresso por data; fora do Brasil, lista "Pelo mundo". Mais o bloco pra quem vai pela primeira vez
// e o JSON-LD de cada data. Desenho do Claude Design (design-handoff/retorno/agenda/).
import { esc, SITE_BASE } from "../seo/layout.mjs";
import { DDSL, MESC, dow } from "./pagina-mes.mjs";

const PAIS = { Brazil: "Brasil", USA: "EUA", "United States": "EUA", Canada: "Canadá", Mexico: "México", Argentina: "Argentina",
  Chile: "Chile", Colombia: "Colômbia", Peru: "Peru", England: "Inglaterra", "United Kingdom": "Reino Unido", Germany: "Alemanha",
  Italy: "Itália", Spain: "Espanha", France: "França", Netherlands: "Holanda", Australia: "Austrália", "New Zealand": "Nova Zelândia" };
const pais = (p) => PAIS[p] || p;
const ISO = { Brazil: "BR", Brasil: "BR", USA: "US", "United States": "US", Canada: "CA", Mexico: "MX", Argentina: "AR", Chile: "CL",
  Colombia: "CO", Peru: "PE", England: "GB", "United Kingdom": "GB", Germany: "DE", Italy: "IT", Spain: "ES", France: "FR",
  Netherlands: "NL", Australia: "AU", "New Zealand": "NZ" };
const maiusculas = (s) => (s || "").replace(/[^A-Z]/g, "").length;

export function eventoOficialLd(s) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${s.artista}${s.evento ? `: ${s.evento}` : ""}${s.cidade ? ` em ${s.cidade}` : ""}`,
    startDate: s.data,
    endDate: s.data,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: s.casaNome || s.cidade,
      address: { "@type": "PostalAddress", addressLocality: s.cidade || undefined, addressRegion: s.estado || undefined, addressCountry: ISO[s.pais] || s.pais || undefined } },
    performer: { "@type": s.artista === "Pearl Jam" ? "MusicGroup" : "Person", name: s.artista },
    organizer: { "@type": "Organization", name: s.evento || s.artista, url: s.ingresso || s.fonte },
    ...(s.ingresso ? { offers: { "@type": "Offer", url: s.ingresso, availability: "https://schema.org/InStock" } } : {}),
    image: [`${SITE_BASE}/og.jpg`],
    description: `${s.artista}${s.evento ? ` no ${s.evento}` : ""}${s.cidade ? `, ${s.cidade}` : ""}. Data oficial de pearljam.com/tour.`,
    url: `${SITE_BASE}/agenda/`,
  };
}

const ingresso = (x) => `<li class="ag-ing">
<time class="ag-ing-data" datetime="${x.data}"><span class="ag-ing-dds">${DDSL[dow(x.data)]}</span> <span class="ag-ing-dia">${x.data.slice(8)}</span> <span class="ag-ing-mes">${MESC[+x.data.slice(5, 7) - 1]} ${x.data.slice(0, 4)}</span></time>
${x.ingresso ? `<a class="ag-btn" href="${esc(x.ingresso)}" rel="nofollow noopener">Ingressos<span class="ag-sr"> para ${x.data.slice(8)}/${x.data.slice(5, 7)}</span></a>` : `<span class="ag-btn ag-btn--off">Venda em breve</span>`}
</li>`;

// Datas da mesma atração no mesmo lugar viram um cartaz só, com um botão por noite.
function cartaz(itens) {
  const o = itens[0];
  const evento = itens.map((x) => x.evento).sort((a, b) => maiusculas(b) - maiusculas(a))[0];
  return `<article class="ag-cartaz">
<div class="ag-cartaz-info">
<p class="ag-carimbo">No Brasil!</p>
<h3 class="ag-cartaz-artista">${esc(o.artista)}</h3>
${evento ? `<p class="ag-cartaz-evento">${esc(evento)}</p>` : ""}
<p class="ag-cartaz-local">${esc([o.casaNome, o.cidade].filter(Boolean).join(" · "))}</p>
</div>
<ul class="ag-ingressos">
${itens.map(ingresso).join("\n")}
</ul>
</article>`;
}

const foraLinha = (o) => `<li><time datetime="${o.data}">${o.data.split("-").reverse().join("/")}</time> <strong>${esc(o.artista)}</strong> `
  + `${esc([o.evento, o.casaNome, o.cidade, pais(o.pais)].filter(Boolean).join(", "))}`
  + `${o.ingresso ? ` <a href="${esc(o.ingresso)}" rel="nofollow noopener">ingressos</a>` : ""}</li>`;

export function secaoOficial(oficial = []) {
  const grupos = new Map();
  for (const o of oficial.filter((x) => x.brasil)) {
    const k = [o.artista, o.casaNome, o.cidade].join("|");
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(o);
  }
  const fora = oficial.filter((x) => !x.brasil);
  const foraHTML = fora.length ? `<h3 class="ag-of-tit">Pelo mundo</h3>\n<ul class="ag-of-lista">\n${fora.map(foraLinha).join("\n")}\n</ul>` : "";
  const conteudo = oficial.length ? [...grupos.values()].map(cartaz).join("\n") + foraHTML
    : '<p class="ag-vazio">Nenhuma data oficial anunciada no momento. Quando sair, aparece aqui no mesmo dia.</p>';
  return `<section class="ag-sec" id="oficial" aria-labelledby="ag-t-oficial">
<p class="ag-kicker">na estrada</p>
<h2 class="ag-h2" id="ag-t-oficial">Turnê oficial: Pearl Jam e Eddie Vedder</h2>
${conteudo}
</section>`;
}

// Bloco pra quem vai pela primeira vez (fica no fim da página, antes da chamada pras bandas).
export function secaoBasico() {
  return `<section class="ag-sec ag-basico" id="primeira-vez" aria-labelledby="ag-t-basico">
<h2 class="ag-h2 ag-h2--p" id="ag-t-basico">Primeira vez num show? O básico</h2>
<ol class="ag-basico-lista">
<li><p class="ag-basico-tit">A banda</p><p>Pearl Jam é a banda de Seattle que nasceu em 1990 e segue na estrada com Eddie Vedder, Stone Gossard, Jeff Ament, Mike McCready e Matt Cameron. Eddie também faz shows solo, mais intimistas.</p></li>
<li><p class="ag-basico-tit">Ingressos</p><p>A pré-venda de ingressos costuma abrir primeiro pro Ten Club, o fã-clube oficial, e depois vem a venda geral no link oficial.</p></li>
<li><p class="ag-basico-tit">O repertório</p><p>O repertório muda a cada noite: depois do show, o setlist sai no setlist.fm e aqui no site, na seção <a href="/show/">Shows</a>.</p></li>
</ol>
<p class="ag-basico-mais">Quer conhecer a banda? Comece pela página <a href="/banda/">A banda</a> e pelos <a href="/disco/">discos</a>.</p>
</section>`;
}
