// Leitura de bruto/ e contagem por música (usado pelo agregar.mjs). Não chama a API.
import fs from "node:fs";
import path from "node:path";

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const BRUTO = path.join(AQUI, "bruto");
const PROPRIOS = new Set(["pearl jam", "eddie vedder"]); // "cover" de si mesmo não é cover
export const chave = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const iso = (d) => d.split("-").reverse().join("-"); // dd-MM-yyyy -> yyyy-MM-dd
export const pct = (n, t) => (t ? Math.round((n / t) * 1000) / 10 : 0);

export function carregar(slug) {
  const vistos = new Set();
  const shows = [];
  let vazios = 0, futuros = 0, paginas = 0;
  const hoje = new Date().toISOString().slice(0, 10);
  for (const arq of fs.readdirSync(BRUTO).filter((f) => f.startsWith(slug + "-p")).sort()) {
    paginas++;
    for (const s of JSON.parse(fs.readFileSync(path.join(BRUTO, arq), "utf8")).setlist || []) {
      if (vistos.has(s.id)) continue;
      vistos.add(s.id);
      const data = iso(s.eventDate);
      const sets = (s.sets?.set || []).map((st) => ({
        bis: !!st.encore,
        musicas: (st.song || []).filter((m) => m.name && !m.tape).map((m) => ({
          nome: m.name.trim(),
          cover: m.cover && !PROPRIOS.has(m.cover.name.toLowerCase()) ? m.cover.name : null,
          dePJ: m.cover?.name === "Pearl Jam",
        })),
      })).filter((st) => st.musicas.length);
      const musicas = sets.flatMap((st) => st.musicas);
      if (!musicas.length) { data > hoje ? futuros++ : vazios++; continue; }
      const c = s.venue?.city || {};
      shows.push({ id: s.id, data, ano: +data.slice(0, 4), local: s.venue?.name || "", cidade: c.name || "",
        pais: c.country?.code || "", paisNome: c.country?.name || "", turne: s.tour?.name || null,
        musicas, abertura: musicas[0], fecho: musicas[musicas.length - 1], url: s.url });
    }
  }
  shows.sort((a, b) => a.data.localeCompare(b.data));
  return { shows, vazios, futuros, paginas, listados: vistos.size };
}

export const onde = (s) => ({ data: s.data, cidade: s.cidade, pais: s.pais, local: s.local });

// Ranking: conta 1 vez por show (música repetida no mesmo show não soma).
export function ranking(shows) {
  const m = new Map();
  shows.forEach((s, i) => {
    const noShow = new Set();
    for (const mu of s.musicas) {
      const k = chave(mu.nome);
      if (!k || noShow.has(k)) continue;
      noShow.add(k);
      let r = m.get(k);
      if (!r) m.set(k, (r = { nomes: {}, vezes: 0, primeira: onde(s), cover: {}, dePJ: 0 }));
      r.nomes[mu.nome] = (r.nomes[mu.nome] || 0) + 1;
      r.vezes++; r.ultima = onde(s); r.ultimoIdx = i;
      if (mu.cover) r.cover[mu.cover] = (r.cover[mu.cover] || 0) + 1;
      if (mu.dePJ) r.dePJ++;
    }
  });
  const maior = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return [...m.entries()].map(([k, r]) => ({
    chave: k, musica: maior(r.nomes), vezes: r.vezes, pct: pct(r.vezes, shows.length),
    primeira: r.primeira, ultima: r.ultima, shows_desde_a_ultima: shows.length - 1 - r.ultimoIdx,
    cover_de: r.vezes && Object.values(r.cover).reduce((a, b) => a + b, 0) > r.vezes / 2 ? maior(r.cover) : null,
    do_pearl_jam: r.dePJ > r.vezes / 2,
  })).sort((a, b) => b.vezes - a.vezes || a.musica.localeCompare(b.musica));
}

export function pontas(shows, campo) {
  const m = new Map();
  for (const s of shows) {
    const k = chave(s[campo].nome);
    const r = m.get(k) || { musica: s[campo].nome, vezes: 0 };
    r.vezes++; m.set(k, r);
  }
  return [...m.values()].sort((a, b) => b.vezes - a.vezes).slice(0, 15).map((r) => ({ ...r, pct: pct(r.vezes, shows.length) }));
}
