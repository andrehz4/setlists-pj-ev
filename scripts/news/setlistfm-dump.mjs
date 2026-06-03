// Utilitario one-shot (NAO faz parte do pipeline de noticias): baixa o historico
// COMPLETO de shows do Pearl Jam no setlist.fm e salva normalizado num JSON, pra
// a gente decidir depois o que fazer (timeline, stats, validar o arquivo, etc).
//
// Rodar: SETLISTFM_API_KEY=xxx node scripts/news/setlistfm-dump.mjs
// Saida: media/setlistfm/pearl-jam-shows.json
//
// Respeita o rate limit (2/s): ~600ms entre paginas. ~57 paginas, ~40s total.
// Termos do setlist.fm: nao-comercial + atribuicao. Este dump e material de trabalho;
// se um dia for publicado no site, garantir o link de atribuicao por show (campo url).

import fs from "node:fs/promises";
import path from "node:path";
import got from "got";

const KEY = process.env.SETLISTFM_API_KEY;
if (!KEY) {
  console.error("Falta SETLISTFM_API_KEY no ambiente. Rode: SETLISTFM_API_KEY=xxx node scripts/news/setlistfm-dump.mjs");
  process.exit(1);
}

const MBID = "83b9cbe7-9857-49e2-ab8e-b57b01038103"; // Pearl Jam
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = path.resolve("media/setlistfm/pearl-jam-shows.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Achata os sets em um array limpo de musicas com flags uteis.
function normalizeSets(sets) {
  return (sets?.set || []).map((set) => ({
    encore: set.encore || null,
    name: set.name || null,
    songs: (set.song || []).map((s) => ({
      name: s.name || "",
      ...(s.tape ? { tape: true } : {}),
      ...(s.info ? { info: s.info } : {}),
      ...(s.cover?.name ? { cover: s.cover.name } : {}),
      ...(s.with?.name ? { with: s.with.name } : {}),
    })),
  }));
}

function normalizeShow(sl) {
  const songCount = (sl.sets?.set || []).reduce((n, set) => n + (set.song?.length || 0), 0);
  return {
    id: sl.id,
    versionId: sl.versionId || null,
    eventDate: sl.eventDate || null, // DD-MM-YYYY
    lastUpdated: sl.lastUpdated || null,
    tour: sl.tour?.name || null,
    venue: sl.venue?.name || null,
    city: sl.venue?.city?.name || null,
    state: sl.venue?.city?.state || null,
    country: sl.venue?.city?.country?.name || null,
    coords: sl.venue?.city?.coords || null,
    url: sl.url || null,
    songCount,
    sets: normalizeSets(sl.sets),
  };
}

async function fetchPage(p) {
  return got(`https://api.setlist.fm/rest/1.0/artist/${MBID}/setlists?p=${p}`, {
    headers: { "x-api-key": KEY, Accept: "application/json", "User-Agent": BROWSER_UA },
    timeout: { request: 25000 },
    retry: { limit: 2 },
  }).json();
}

async function main() {
  const first = await fetchPage(1);
  const total = first.total || 0;
  const perPage = first.itemsPerPage || 20;
  const pages = Math.ceil(total / perPage);
  console.log(`[dump] total de shows: ${total} | ${perPage}/pagina | ${pages} paginas`);

  const shows = [...(first.setlist || [])];
  for (let p = 2; p <= pages; p++) {
    await sleep(600); // rate limit 2/s, com margem
    try {
      const res = await fetchPage(p);
      const batch = res.setlist || [];
      shows.push(...batch);
      if (p % 5 === 0 || p === pages) console.log(`[dump] pagina ${p}/${pages} (${shows.length}/${total})`);
      if (!batch.length) break;
    } catch (e) {
      console.warn(`[dump] pagina ${p} falhou: ${e.message} (seguindo)`);
    }
  }

  const normalized = shows.map(normalizeShow);
  // ordena por data (mais recente primeiro); shows sem data vao pro fim
  normalized.sort((a, b) => {
    const da = a.eventDate ? a.eventDate.split("-").reverse().join("") : "0";
    const db = b.eventDate ? b.eventDate.split("-").reverse().join("") : "0";
    return db.localeCompare(da);
  });

  const out = {
    artist: "Pearl Jam",
    mbid: MBID,
    source: "setlist.fm",
    attribution: "Setlists via setlist.fm (https://www.setlist.fm/setlists/pearl-jam-23d6b80b.html)",
    fetchedTotal: normalized.length,
    apiTotal: total,
    shows: normalized,
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(`[dump] salvo: ${OUT} | ${normalized.length} shows`);
}

main().catch((e) => {
  console.error("[dump] erro fatal:", e.message);
  process.exit(1);
});
