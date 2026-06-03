// Utilitario one-shot (NAO faz parte do pipeline de noticias): baixa o historico
// COMPLETO de shows do Pearl Jam E do Eddie Vedder solo no setlist.fm e salva
// versionado POR ANO, pra a gente decidir depois o uso (timeline, stats, validar).
//
// Rodar: SETLISTFM_API_KEY=xxx node scripts/news/setlistfm-dump.mjs
// Saida:
//   media/setlistfm/index.json          (meta: artistas, totais, anos)
//   media/setlistfm/by-year/<ano>.json  (shows daquele ano, ambos artistas)
//
// Respeita o rate limit (2/s): ~600ms entre paginas. Termos do setlist.fm:
// nao-comercial + atribuicao (campo url por show + attribution no index).

import fs from "node:fs/promises";
import path from "node:path";
import got from "got";

const KEY = process.env.SETLISTFM_API_KEY;
if (!KEY) {
  console.error("Falta SETLISTFM_API_KEY. Rode: SETLISTFM_API_KEY=xxx node scripts/news/setlistfm-dump.mjs");
  process.exit(1);
}

const ARTISTS = [
  { name: "Pearl Jam", mbid: "83b9cbe7-9857-49e2-ab8e-b57b01038103" },
  { name: "Eddie Vedder", mbid: "1a60d6dd-9d3e-40fc-a66d-3184f9ee0d61" },
];
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const DIR = path.resolve("media/setlistfm");
const BY_YEAR = path.join(DIR, "by-year");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function normalizeShow(sl, artist) {
  const songCount = (sl.sets?.set || []).reduce((n, set) => n + (set.song?.length || 0), 0);
  return {
    artist,
    id: sl.id,
    eventDate: sl.eventDate || null, // DD-MM-YYYY
    year: sl.eventDate ? sl.eventDate.split("-")[2] : "unknown",
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

async function fetchPage(mbid, p) {
  return got(`https://api.setlist.fm/rest/1.0/artist/${mbid}/setlists?p=${p}`, {
    headers: { "x-api-key": KEY, Accept: "application/json", "User-Agent": BROWSER_UA },
    timeout: { request: 25000 },
    retry: { limit: 2 },
  }).json();
}

async function fetchArtist(artist) {
  const first = await fetchPage(artist.mbid, 1);
  const total = first.total || 0;
  const perPage = first.itemsPerPage || 20;
  const pages = Math.ceil(total / perPage);
  console.log(`[dump] ${artist.name}: ${total} shows | ${pages} paginas`);
  const raw = [...(first.setlist || [])];
  for (let p = 2; p <= pages; p++) {
    await sleep(600);
    try {
      const res = await fetchPage(artist.mbid, p);
      raw.push(...(res.setlist || []));
      if (p % 10 === 0 || p === pages) console.log(`[dump]   ${artist.name} pagina ${p}/${pages}`);
    } catch (e) {
      console.warn(`[dump]   ${artist.name} pagina ${p} falhou: ${e.message}`);
    }
  }
  return raw.map((sl) => normalizeShow(sl, artist.name));
}

function ymd(eventDate) {
  return eventDate ? eventDate.split("-").reverse().join("") : "0";
}

async function main() {
  const all = [];
  const artistMeta = [];
  for (const artist of ARTISTS) {
    const shows = await fetchArtist(artist);
    artistMeta.push({ name: artist.name, mbid: artist.mbid, total: shows.length });
    all.push(...shows);
    await sleep(600);
  }

  // agrupa por ano
  const byYear = {};
  for (const s of all) (byYear[s.year] ||= []).push(s);
  for (const year of Object.keys(byYear)) {
    byYear[year].sort((a, b) => ymd(b.eventDate).localeCompare(ymd(a.eventDate)));
  }

  // limpa e reescreve a pasta by-year (evita ano orfao em re-run)
  await fs.rm(BY_YEAR, { recursive: true, force: true });
  await fs.mkdir(BY_YEAR, { recursive: true });
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
  for (const year of years) {
    await fs.writeFile(path.join(BY_YEAR, `${year}.json`), JSON.stringify({ year, shows: byYear[year] }, null, 2));
  }

  // index com contagens por ano e por artista
  const yearIndex = years.map((year) => {
    const shows = byYear[year];
    const porArtista = {};
    for (const s of shows) porArtista[s.artist] = (porArtista[s.artist] || 0) + 1;
    return { year, total: shows.length, porArtista };
  });
  const index = {
    source: "setlist.fm",
    attribution: "Setlists via setlist.fm. Pearl Jam: https://www.setlist.fm/setlists/pearl-jam-23d6b80b.html | Eddie Vedder: https://www.setlist.fm/setlists/eddie-vedder-3bd6bd5b.html",
    artists: artistMeta,
    totalShows: all.length,
    years: yearIndex,
  };
  await fs.writeFile(path.join(DIR, "index.json"), JSON.stringify(index, null, 2));

  // remove o monolito antigo (substituido pela estrutura por ano)
  await fs.rm(path.join(DIR, "pearl-jam-shows.json"), { force: true });

  console.log(`[dump] OK: ${all.length} shows | ${years.length} anos | ${BY_YEAR}`);
  console.log(`[dump] por artista: ${artistMeta.map((a) => `${a.name}=${a.total}`).join(", ")}`);
}

main().catch((e) => {
  console.error("[dump] erro fatal:", e.message);
  process.exit(1);
});
