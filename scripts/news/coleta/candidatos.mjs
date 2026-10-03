// Candidatos novos: busca todas as fontes, filtra relevância, tira o que já foi visto ou está pendente
// e remove réplicas de agência entre portais BR.
import { SOURCES } from "../sources.mjs";
import { isRelevant, canonicalize, sha10 } from "../relevance.mjs";
import { dedupeByContent } from "../dedupe.mjs";
import { fetchFeedItems } from "./fontes-feed.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pool de 4 (era sequencial com sleep de 400 ms entre ~40 fontes: ~15 s parados por run). Cada worker
// mantém 150 ms de cortesia entre os próprios fetches. O resultado é processado NA ORDEM de SOURCES,
// então o conteúdo (e o dedupe que depende dele) sai igual ao do laço antigo.
async function buscarTodas() {
  const FETCH_POOL = 4;
  const fetchResults = new Array(SOURCES.length);
  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= SOURCES.length) break;
      try {
        fetchResults[i] = await fetchFeedItems(SOURCES[i]);
      } catch (e) {
        fetchResults[i] = { items: [], error: e.message };
      }
      await sleep(150);
    }
  }
  await Promise.all(Array.from({ length: Math.min(FETCH_POOL, SOURCES.length) }, worker));
  return fetchResults;
}

// Devolve { all, deduped, sourceResults, warnings }.
export async function coletarCandidatos({ seen, pendentes }) {
  const fetchResults = await buscarTodas();
  const all = [];
  const sourceResults = [];
  const warnings = [];
  const pendentesIds = new Set(pendentes.map((p) => p.id));
  SOURCES.forEach((src, i) => {
    const r = fetchResults[i] || { items: [], error: "sem resultado" };
    const items = Array.isArray(r.items) ? r.items : [];
    const error = r.error || (Array.isArray(r.items) ? null : "coletor devolveu formato inesperado");
    sourceResults.push({ label: src.label, count: items.length, error });
    if (error) warnings.push(`${src.label}: ${error}`);
    for (const it of items) {
      if (!it.link || !it.title) continue;
      const url = canonicalize(it.link);
      if (!it.alwaysRelevant && !isRelevant(`${it.title} ${it.snippet}`)) continue;
      const h = sha10(url);
      if (seen[h] || pendentesIds.has(h)) continue;
      all.push({ ...it, url, hash: h });
    }
  });
  console.log(`[news] candidatos novos pos-filtros: ${all.length}`);

  // Réplicas de wire/press release que portais BR (Folha, Globo, Terra...) publicam quase idênticas
  // com minutos de diferença: fica a de texto mais longo.
  const { survivors: deduped, removed } = dedupeByContent(all, { threshold: 0.65, groupFilter: "br" });
  if (removed.length > 0) {
    console.log(`[news] dedupe BR: ${removed.length} replica(s) removidas`);
    for (const r of removed) {
      console.log(`  - removido: [${r.item.sourceLabel}] ${r.item.title.slice(0, 60)}`);
      console.log(`    em favor de: [${r.replacedBy.sourceLabel}] ${r.replacedBy.title.slice(0, 60)} (sim=${r.similarity})`);
    }
  }
  deduped.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return { all, deduped, sourceResults, warnings };
}
