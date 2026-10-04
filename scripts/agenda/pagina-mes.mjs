// Calendário das bandas cover na /agenda/ (desenho do Claude Design, design-handoff/retorno/agenda/): mês com 6+
// shows vira grade de calendário no desktop; filtro por estado só com CSS (:has), sem JS.
import { esc } from "../seo/layout.mjs";

export const DDS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const DDSL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const MESC = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dt = (iso) => { const [a, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(a, m - 1, d)); };
export const dow = (iso) => dt(iso).getUTCDay();
export const ig = (u) => `https://www.instagram.com/${u}/`;
export const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const pad = (n) => String(n).padStart(2, "0");
const fmtHora = (h) => { const [H, M] = h.split(":"); return `${+H}h${M && M !== "00" ? M : ""}`; };
export const rel = (hoje, iso) => { const n = Math.round((dt(iso) - dt(hoje)) / 864e5); return n === 0 ? "hoje" : n === 1 ? "amanhã" : ""; };

function local(s) {
  if (s.casa) return `<a class="ag-casa" href="${ig(s.casa)}" rel="nofollow">${s.casaNome ? `${esc(s.casaNome)} (@${esc(s.casa)})` : `@${esc(s.casa)}`}</a>`;
  if (s.casaNome) return `<span class="ag-casa">${esc(s.casaNome)}</span>`;
  return `<span class="ag-casa ag-casa--tbd">local a confirmar</span>`;
}

function showHTML(s, cor, hoje) {
  const r = rel(hoje, s.data);
  const cidade = [s.cidade, s.uf].filter(Boolean).join("/");
  const tags = [r && `<span class="ag-tag ag-tag--rel">${r}</span>`, s.hora && `<span class="ag-tag ag-tag--hora">${fmtHora(s.hora)}</span>`,
    s.observacao && `<span class="ag-tag">${esc(s.observacao)}</span>`].filter(Boolean).join("");
  const post = s.detalhe || s.fonte;
  return `<li class="ag-show ag-c-${cor[s.banda]}" data-uf="${esc(s.uf || "")}">
<p class="ag-show-banda"><a href="${ig(s.banda)}" rel="nofollow">${esc(s.nome)}</a></p>
<p class="ag-show-local">${local(s)}${cidade ? `<span class="ag-sep" aria-hidden="true"> · </span><span class="ag-cidade">${esc(cidade)}</span>` : ""}</p>
<p class="ag-show-extra">${tags}${post ? `<a class="ag-post" href="${esc(post)}" rel="nofollow">post da banda<span aria-hidden="true"> ↗</span></a>` : ""}</p>
</li>`;
}

function diaHTML(iso, sh, { hoje, cor }) {
  const cls = ["ag-dia"];
  if (iso === hoje) cls.push("ag-dia--hoje");
  if (!sh) {
    if (iso < hoje) cls.push("ag-dia--passado");
    cls.push("ag-dia--vazio");
    return `<li class="${cls.join(" ")}" aria-hidden="true"><span class="ag-dia-num">${+iso.slice(8)}</span></li>`;
  }
  return `<li class="${cls.join(" ")}" id="ag-${iso}">
<time class="ag-data" datetime="${iso}"><span class="ag-data-dds">${DDS[dow(iso)]}</span> <span class="ag-data-num">${iso.slice(8)}</span> <span class="ag-data-mes">${MESC[+iso.slice(5, 7) - 1]}</span></time>
<ul class="ag-shows">
${sh.map((s) => showHTML(s, cor, hoje)).join("\n")}
</ul>
</li>`;
}

function mesHTML(k, lista, ctx) {
  const [a, m] = k.split("-").map(Number);
  const grade = lista.length >= 6;
  const porDia = {};
  for (const s of lista) (porDia[s.data] ||= []).push(s);
  const dias = grade
    ? Array.from({ length: new Date(Date.UTC(a, m, 0)).getUTCDate() }, (_, i) => `${k}-${pad(i + 1)}`)
    : Object.keys(porDia);
  // Grade: células vazias completam a 1ª e a última semana (senão ficam sem as linhas da grade).
  const fora = '<li class="ag-dia ag-dia--vazio ag-dia--fora" aria-hidden="true"></li>';
  const antes = grade ? fora.repeat(dow(dias[0])) : "";
  const depois = grade ? fora.repeat(6 - dow(dias[dias.length - 1])) : "";
  const lis = antes + dias.map((iso) => diaHTML(iso, porDia[iso], { ...ctx, grade })).join("\n") + depois;
  const semana = grade ? `<ol class="ag-semana" aria-hidden="true">${DDS.map((d) => `<li>${d}</li>`).join("")}</ol>` : "";
  return `<section class="ag-mes${grade ? " ag-mes--grade" : ""}" aria-labelledby="ag-m-${k}">
<div class="ag-mes-topo"><h3 class="ag-mes-nome" id="ag-m-${k}">${MES[m - 1]} de ${a}</h3><p class="ag-mes-qtd">${plural(lista.length, "show", "shows")}</p></div>
${semana}
<ol class="ag-dias">
${lis}
</ol>
</section>`;
}

// shows: públicos, de hoje em diante, ordenados. Devolve { html, css } (css = regras do filtro por UF).
export function calendario(shows, { hoje, cor }) {
  const ufs = {};
  for (const s of shows) if (s.uf) ufs[s.uf] = (ufs[s.uf] || 0) + 1;
  const ufLista = Object.keys(ufs).sort((a, b) => ufs[b] - ufs[a] || a.localeCompare(b));
  const porMes = new Map();
  for (const s of shows) { const k = s.data.slice(0, 7); if (!porMes.has(k)) porMes.set(k, []); porMes.get(k).push(s); }
  const filtro = ufLista.length > 1 ? `<fieldset class="ag-filtro">
<legend class="ag-filtro-tit">Estado</legend>
<div class="ag-filtro-op">
<input class="ag-uf-in" type="radio" name="ag-uf" id="ag-uf-todos" checked><label for="ag-uf-todos">Todos <span>${shows.length}</span></label>
${ufLista.map((u) => `<input class="ag-uf-in" type="radio" name="ag-uf" id="ag-uf-${u}"><label for="ag-uf-${u}">${u} <span>${ufs[u]}</span></label>`).join("\n")}
</div>
</fieldset>` : "";
  const css = ufLista.map((u) => {
    const h = `.ag-agenda:has(#ag-uf-${u}:checked)`;
    return `${h} .ag-show:not([data-uf="${u}"]),${h} .ag-mes:not(:has([data-uf="${u}"])),${h} .ag-mes:not(.ag-mes--grade) .ag-dia:not(:has([data-uf="${u}"])){display:none}
@media (max-width:899px){${h} .ag-dia:not(:has([data-uf="${u}"])){display:none}}`;
  }).join("\n");
  const meses = [...porMes].map(([k, l]) => mesHTML(k, l, { hoje, cor })).join("\n");
  return { html: `${filtro}\n${meses || '<p class="ag-vazio">Nenhum show cover agendado no momento.</p>'}`, css, ufs: ufLista };
}

export function proximo(shows, hoje) {
  const p = shows[0];
  if (!p) return "";
  const quando = rel(hoje, p.data) || `${DDS[dow(p.data)]} ${p.data.slice(8)}/${p.data.slice(5, 7)}`;
  const onde = [p.cidade, p.uf].filter(Boolean).join("/");
  return `<p class="ag-prox"><span class="ag-prox-tag">Próximo show cover</span> <a href="#ag-${p.data}">${quando}: ${esc(p.nome)}${onde ? ` em ${esc(onde)}` : ""}</a></p>`;
}
