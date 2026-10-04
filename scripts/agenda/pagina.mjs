// Página estática /agenda/ (o Google não lê o SPA): shows das bandas cover por mês, com JSON-LD MusicEvent
// em cada show (resultado de evento na busca) e o perfil de cada banda. Visual provisório: o desenho final
// vem do Claude Design. Evento fechado não entra.
import { pagina, esc, SITE_BASE } from "../seo/layout.mjs";
import { secaoOficial, eventoOficialLd } from "./pagina-oficial.mjs";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const ig = (h) => `https://www.instagram.com/${h}/`;
const dataBr = (d) => { const [a, m, dia] = d.split("-"); return `${dia}/${m}`; };
const diaSemana = (d) => SEMANA[new Date(`${d}T12:00:00-03:00`).getUTCDay()];
const lugar = (s) => s.casaNome || s.casa || "local a confirmar";
const cidadeUf = (s) => [s.cidade, s.uf].filter(Boolean).join("/");

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
    url: `${SITE_BASE}/agenda/`,
  };
}

function linha(s) {
  const casa = s.casa ? `<a href="${ig(s.casa)}" rel="nofollow">@${esc(s.casa)}</a>` : esc(lugar(s));
  const extra = [s.hora && `${s.hora.replace(":00", "h").replace(":", "h")}`, s.observacao].filter(Boolean).join(" · ");
  return `<li><time datetime="${s.data}">${diaSemana(s.data)} ${dataBr(s.data)}</time> `
    + `<a href="${ig(s.banda)}" rel="nofollow"><strong>${esc(s.nome)}</strong></a> em ${casa}`
    + `${cidadeUf(s) ? `, ${esc(cidadeUf(s))}` : ""}${extra ? ` <small>(${esc(extra)})</small>` : ""}`
    + ` <a href="${esc(s.detalhe || s.fonte)}" rel="nofollow">post da banda</a></li>`;
}

export function paginaAgenda({ shows, bandas, oficial = [] }) {
  const publicos = shows.filter((s) => !s.fechado);
  const porMes = new Map();
  for (const s of publicos) {
    const k = s.data.slice(0, 7);
    if (!porMes.has(k)) porMes.set(k, []);
    porMes.get(k).push(s);
  }
  const meses = [...porMes].map(([k, lista]) => {
    const [a, m] = k.split("-");
    return `<h3>${MESES[+m - 1]} de ${a}</h3>\n<ul>${lista.map(linha).join("\n")}</ul>`;
  }).join("\n");
  const perfis = bandas.map((b) => `<h3 class="banda"><a href="${ig(b.conta)}" rel="nofollow">${esc(b.nome)}</a> `
    + `<small>${esc(b.cidade)}/${esc(b.uf)}, desde ${b.desde}</small></h3>\n<p>${esc(b.resumo)}</p>`).join("\n");
  const cidades = [...new Set(publicos.map((s) => s.uf).filter(Boolean))].sort();
  const corpo = `<p>Onde ver Pearl Jam ao vivo: a turnê oficial da banda e do Eddie Vedder, e a agenda das bandas cover e
tributo pelo Brasil, lida dos perfis oficiais delas no Instagram. Confirme sempre no post da banda antes de sair de casa.</p>
${secaoOficial(oficial)}
<h2>Bandas cover e tributo no Brasil</h2>
${meses || "<p>Nenhum show anunciado no momento.</p>"}
<h2>As bandas cover</h2>
${perfis}
<p><small>Toca Pearl Jam e quer aparecer aqui? Fale com a gente pelo Instagram @smufdpj.</small></p>`;
  return pagina({
    titulo: "Agenda de shows: turnê do Pearl Jam e bandas cover no Brasil",
    h1: "Agenda: Pearl Jam ao vivo no Brasil",
    descricao: `Turnê oficial do Pearl Jam e do Eddie Vedder e shows das bandas cover e tributo de Pearl Jam pelo Brasil${cidades.length ? ` (${cidades.join(", ")})` : ""}: datas, cidades e casas, atualizados todo dia.`,
    url: `${SITE_BASE}/agenda/`,
    ld: [...oficial.map(eventoOficialLd), ...publicos.map(eventoLd)],
    corpo,
  });
}
