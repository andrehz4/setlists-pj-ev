// Turnê oficial (Pearl Jam e Eddie Vedder solo) lida de pearljam.com/tour, que traz os shows num JSON
// embutido (<script id="data">). Função pura + leitura. Se o site mudar o formato, devolve erro claro e a
// coleta mantém a lista de antes (não derruba a agenda das bandas cover).
import { UA_ROBO } from "../config.mjs";

export const URL_TURNE = "https://pearljam.com/tour";
const MES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// "Nov. 20, 2026" / "Sept. 3, 2026" / "June 5, 2026" -> "2026-11-20"
export function dataOficial(txt) {
  const m = String(txt || "").match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/);
  const mes = m && MES[m[1].toLowerCase()];
  return mes ? `${m[3]}-${String(mes).padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
}

const artistaDa = (turne) => (/eddie\s+vedder/i.test(turne) ? "Eddie Vedder" : "Pearl Jam");

export function extrairOficial(html, hoje = "0000-00-00") {
  const m = String(html).match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("pearljam.com/tour sem o bloco <script id=\"data\"> (formato mudou?)");
  const turnes = JSON.parse(m[1])?.shows?.tour;
  if (!Array.isArray(turnes)) throw new Error("pearljam.com/tour: JSON sem shows.tour");
  const shows = [];
  for (const t of turnes) for (const s of t.shows || []) {
    const data = dataOficial(s.date);
    if (!data || data < hoje) continue;
    shows.push({
      id: `oficial-${s.id}`, data, artista: artistaDa(t.title || s.title), turne: t.title || s.title || "",
      evento: s.name || "", casaNome: s.venue_name || "", cidade: s.city || "", estado: s.state || "",
      pais: s.country || "", brasil: /^brazil|^brasil/i.test(s.country || ""),
      ingresso: s.ticket || s.ticket_info_url || null, fonte: URL_TURNE,
    });
  }
  return shows.sort((a, b) => a.data.localeCompare(b.data));
}

export async function lerOficial(hoje, { fetchImpl = fetch } = {}) {
  const r = await fetchImpl(URL_TURNE, { headers: { "User-Agent": UA_ROBO }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`pearljam.com/tour HTTP ${r.status}`);
  return extrairOficial(await r.text(), hoje);
}
