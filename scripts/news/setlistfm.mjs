// Handler da fonte setlist.fm: setlists dos shows do Pearl Jam viram itens de noticia.
// Modulo separado do fetch-news.mjs (que auto-executa main() ao importar) pra ser testavel.
//
// API: GET api.setlist.fm/rest/1.0/artist/{mbid}/setlists?p=1
//   - header x-api-key (secret SETLISTFM_API_KEY)
//   - Accept: application/json
//   - ATENCAO: o setlist.fm devolve 403 pra User-Agent de bot. Precisa parecer browser.
//   - rate limit 2 req/s, 1440/dia (1 req por rodada e suficiente: pagina 1 = 20 shows recentes)
// Termos: exigem link de atribuicao ao setlist.fm (vai no preText + no link do item).

import got from "got";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// So shows dos ultimos N dias viram noticia. Fora de turne a fonte fica dormente (0 itens).
export const SETLIST_NEW_DAYS = 45;

// "18-05-2025" (DD-MM-YYYY do setlist.fm) -> Date em UTC. Retorna null se invalido.
export function parseSetlistDate(ddmmyyyy) {
  if (!ddmmyyyy || typeof ddmmyyyy !== "string") return null;
  const [d, m, y] = ddmmyyyy.split("-").map(Number);
  if (!d || !m || !y) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

// Setlist cru -> texto editorial pra curadoria (vai como preText, pula o scrape).
export function formatSetlistText(sl) {
  const venue = sl?.venue?.name || "local nao informado";
  const city = sl?.venue?.city?.name || "";
  const state = sl?.venue?.city?.state || "";
  const country = sl?.venue?.city?.country?.name || "";
  const tour = sl?.tour?.name || "";
  const loc = [city, state, country].filter(Boolean).join(", ");
  const lines = [];
  lines.push(`Pearl Jam ao vivo em ${venue}${loc ? `, ${loc}` : ""}.`);
  if (tour) lines.push(`Turne: ${tour}.`);
  lines.push(`Data do show: ${sl?.eventDate || "?"}.`);
  lines.push("");
  let total = 0;
  for (const set of sl?.sets?.set || []) {
    lines.push(`${set.encore ? `Bis ${set.encore}` : "Show principal"}:`);
    for (const [i, s] of (set.song || []).entries()) {
      total++;
      const tags = [];
      if (s.tape) tags.push("fita/intro");
      if (s.cover?.name) tags.push(`cover de ${s.cover.name}`);
      if (s.info) tags.push(s.info);
      lines.push(`${i + 1}. ${s.name || "(sem titulo)"}${tags.length ? ` (${tags.join("; ")})` : ""}`);
    }
    lines.push("");
  }
  lines.push(`Total: ${total} musica(s).`);
  lines.push(`Fonte: setlist.fm (${sl?.url || ""})`); // atribuicao exigida pelos termos
  return lines.join("\n").trim();
}

// Setlist cru -> item no formato do pipeline (mesmo shape dos outros handlers).
export function setlistToItem(sl, src) {
  const venue = sl?.venue?.name || "";
  const city = sl?.venue?.city?.name || "";
  const country = sl?.venue?.city?.country?.name || "";
  const loc = [city, country].filter(Boolean).join(", ");
  const dt = parseSetlistDate(sl?.eventDate);
  const text = formatSetlistText(sl);
  return {
    sourceId: src.id,
    sourceLabel: src.label,
    group: src.group,
    title: `Pearl Jam ao vivo: ${venue}${loc ? `, ${loc}` : ""} (${sl?.eventDate || ""})`,
    link: sl?.url || "",
    pubDate: (dt || new Date()).toISOString(),
    snippet: text.slice(0, 800),
    alwaysRelevant: true,
    kind: "setlistfm",
    preText: text, // pula o scrape do extract.mjs
    preImg: null, // setlist.fm nao tem foto; fallback de foto por assunto resolve downstream
  };
}

// Filtra os setlists recentes com musicas registradas e mapeia pra itens.
export function selectRecentSetlists(setlists, src, opts = {}) {
  const newDays = opts.newDays ?? SETLIST_NEW_DAYS;
  const now = opts.now ?? Date.now();
  const cutoff = now - newDays * 24 * 60 * 60 * 1000;
  return (setlists || [])
    .filter((sl) => {
      const dt = parseSetlistDate(sl.eventDate);
      return dt && dt.getTime() >= cutoff;
    })
    .filter((sl) => (sl?.sets?.set || []).some((set) => (set.song || []).length))
    .map((sl) => setlistToItem(sl, src));
}

// Busca os setlists recentes do PJ. Skip gracioso se a API key estiver ausente.
export async function fetchSetlistfmItems(src, opts = {}) {
  const KEY = process.env.SETLISTFM_API_KEY;
  if (!KEY) {
    console.warn(`[setlistfm] SETLISTFM_API_KEY ausente, pulando ${src.id}`);
    return { items: [], error: null };
  }
  try {
    const res = await got(src.url, {
      headers: { "x-api-key": KEY, Accept: "application/json", "User-Agent": BROWSER_UA },
      timeout: { request: 20000 },
      retry: { limit: 1 },
    }).json();
    return { items: selectRecentSetlists(res.setlist, src, opts), error: null };
  } catch (e) {
    console.warn(`[setlistfm] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}
