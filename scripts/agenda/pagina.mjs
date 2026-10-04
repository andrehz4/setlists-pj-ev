// Página estática /agenda/ (o Google não lê o SPA): turnê oficial, calendário das bandas cover e perfis, com
// JSON-LD MusicEvent em cada show. Desenho do Claude Design (design-handoff/retorno/agenda/): CSS em
// agenda.css (classes ag-), calendário em pagina-mes.mjs, turnê em pagina-oficial.mjs. Evento fechado não entra.
import fs from "node:fs";
import { pagina, esc, SITE_BASE } from "../seo/layout.mjs";
import { diaBRT } from "../lib/brt.mjs";
import { secaoOficial, eventoOficialLd } from "./pagina-oficial.mjs";
import { calendario, proximo, ig, plural } from "./pagina-mes.mjs";

const CSS = fs.readFileSync(new URL("./agenda.css", import.meta.url), "utf8");
const FONTES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@1,900&family=Special+Elite&display=swap" rel="stylesheet">';
const CORES = ["azul", "vermelho", "preto", "ocre"];
const lugar = (s) => s.casaNome || s.casa || "local a confirmar";

export function eventoLd(s) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${s.nome}: tributo ao Pearl Jam${s.cidade ? ` em ${s.cidade}` : ""}`,
    startDate: s.hora ? `${s.data}T${s.hora}:00-03:00` : s.data,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: lugar(s),
      address: { "@type": "PostalAddress", addressLocality: s.cidade || undefined, addressRegion: s.uf || undefined, addressCountry: "BR" } },
    performer: { "@type": "MusicGroup", name: s.nome, sameAs: ig(s.banda) },
    image: [`${SITE_BASE}/og.jpg`],
    description: `${s.nome} toca Pearl Jam${s.cidade ? ` em ${s.cidade}${s.uf ? `/${s.uf}` : ""}` : ""}${s.casaNome || s.casa ? `, no ${s.casaNome || "@" + s.casa}` : ""}. Agenda de bandas cover do Só mais um fã de Pearl Jam.`,
    url: `${SITE_BASE}/agenda/`,
  };
}

// Cor fixa por banda, no ciclo da marca (mesma cor no calendário e no card da banda).
function coresDasBandas(bandas, shows) {
  const cor = {};
  let i = 0;
  for (const c of [...bandas.map((b) => b.conta), ...shows.map((s) => s.banda)]) if (!cor[c]) cor[c] = CORES[i++ % CORES.length];
  return cor;
}

const bandaHTML = (b, n, cor) => `<li class="ag-banda ag-bg-${cor[b.conta]}">
<p class="ag-banda-desde">desde <span>${esc(b.desde)}</span></p>
<h3 class="ag-banda-nome"><a href="${ig(b.conta)}" rel="nofollow">${esc(b.nome)}</a></h3>
<p class="ag-banda-cidade">${esc(b.cidade)}/${esc(b.uf)}</p>
<p class="ag-banda-resumo">${esc(b.resumo)}</p>
<p class="ag-banda-rodape"><span>${n ? plural(n, "show na agenda", "shows na agenda") : "sem datas no momento"}</span><a href="${ig(b.conta)}" rel="nofollow">@${esc(b.conta)}</a></p>
</li>`;

export function paginaAgenda({ shows, bandas, oficial = [], hoje = diaBRT() }) {
  const publicos = shows.filter((s) => !s.fechado && s.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || a.nome.localeCompare(b.nome));
  const ofi = oficial.filter((o) => o.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const cor = coresDasBandas(bandas, publicos);
  const cal = calendario(publicos, { hoje, cor });
  const porBanda = {};
  for (const s of publicos) porBanda[s.banda] = (porBanda[s.banda] || 0) + 1;
  const corpo = `<main class="ag">
<div class="ag-hero">
<div class="ag-hero-tit">
<p class="ag-assin">Só Mais um Fã de PEARL JAM</p>
<h1 class="ag-h1"><span class="ag-h1-a">Agenda<span class="ag-sr">:</span></span> <span class="ag-h1-b">Pearl Jam ao vivo no Brasil</span></h1>
</div>
<div class="ag-hero-txt">
<p class="ag-intro">Onde ver Pearl Jam ao vivo: a turnê oficial da banda e do Eddie Vedder, e a agenda das bandas cover e tributo pelo Brasil, lida dos perfis oficiais delas no Instagram. Confirme sempre no post da banda antes de sair de casa.</p>
<nav class="ag-atalhos" aria-label="Nesta página"><a href="#oficial">Turnê oficial</a><a href="#agenda">Bandas cover <span>${publicos.length}</span></a><a href="#bandas">As bandas</a></nav>
</div>
</div>
${proximo(publicos, hoje)}

${secaoOficial(ofi)}

<section class="ag-sec ag-agenda" id="agenda" aria-labelledby="ag-t-agenda">
<p class="ag-kicker">todo dia, dos perfis das bandas</p>
<h2 class="ag-h2" id="ag-t-agenda">Bandas cover e tributo no Brasil</h2>
${cal.html}
</section>

<section class="ag-sec" id="bandas" aria-labelledby="ag-t-bandas">
<p class="ag-kicker">quem toca</p>
<h2 class="ag-h2" id="ag-t-bandas">As bandas cover</h2>
<ul class="ag-bandas">
${bandas.map((b) => bandaHTML(b, porBanda[b.conta] || 0, cor)).join("\n")}
</ul>
</section>

<aside class="ag-cta">
<p class="ag-cta-tit">Toca Pearl Jam e quer aparecer aqui?</p>
<p class="ag-cta-txt">Fale com a gente pelo Instagram <a href="https://www.instagram.com/smufdpj/" rel="nofollow">@smufdpj</a>.</p>
</aside>
</main>`;
  const ufs = [...cal.ufs].sort();
  return pagina({
    titulo: "Shows de Pearl Jam no Brasil: agenda das bandas cover e turnê oficial",
    h1: "Agenda: Pearl Jam ao vivo no Brasil",
    descricao: `Onde tem show de Pearl Jam no Brasil: datas das bandas cover e tributo${ufs.length ? ` (${ufs.join(", ")})` : ""} e da turnê oficial do Pearl Jam e do Eddie Vedder, com casa, cidade e ingressos. Atualizada todo dia.`,
    url: `${SITE_BASE}/agenda/`,
    ld: [...ofi.map(eventoOficialLd), ...publicos.map(eventoLd)],
    cabeca: `${FONTES}\n<style>\n${CSS}\n${cal.css}\n</style>\n`,
    classeWrap: "ag-wrap",
    h1Proprio: true,
    corpo,
  });
}
