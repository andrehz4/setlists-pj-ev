// Balanço do show de 20/11 (Ibirapuera) contra o histórico solo do setlist.fm + previsão pro domingo 22/11.
// Lê ../eddie-carreira/bruto/eddie-vedder-p*.json e hoje.json (setlist de 20/11). Saída: analise.json
import fs from "node:fs";
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const dt = (d) => { const [a, b, c] = d.split("-"); return new Date(`${c}-${b}-${a}T12:00:00Z`); };
const B = "../eddie-carreira/bruto/";
const shows = fs.readdirSync(B).filter((f) => f.startsWith("eddie-vedder")).flatMap((f) => JSON.parse(fs.readFileSync(B + f)).setlist || [])
  .map((s) => ({ id: s.id, data: dt(s.eventDate), cidade: s.venue?.city?.name, local: s.venue?.name, tour: s.tour?.name,
    musicas: (s.sets?.set || []).flatMap((x) => x.song || []).filter((m) => !m.tape && m.name).map((m) => m.name) }))
  .filter((s) => s.musicas.length && s.data < new Date("2026-11-20")).sort((a, b) => a.data - b.data);
const hoje = JSON.parse(fs.readFileSync("hoje.json"));
const N = shows.length, cont = {}, nome = {};
for (const s of shows) for (const m of new Set(s.musicas.map(norm))) cont[m] = (cont[m] || 0) + 1;
for (const s of shows) for (const m of s.musicas) nome[norm(m)] ??= m;
const pct = (m) => +(100 * (cont[norm(m)] || 0) / N).toFixed(1);
const hojeN = new Set(hoje.map(norm));
// Pares de noites na mesma cidade com até 3 dias de intervalo
const pares = [];
for (let i = 1; i < shows.length; i++) {
  const a = shows[i - 1], b = shows[i], dias = (b.data - a.data) / 864e5;
  if (a.cidade === b.cidade && dias <= 3 && dias > 0) {
    const A = new Set(a.musicas.map(norm)), Bs = b.musicas.map(norm);
    const rep = Bs.filter((m) => A.has(m)).length;
    pares.push({ cidade: a.cidade, d1: a.data.toISOString().slice(0, 10), d2: b.data.toISOString().slice(0, 10), n2: Bs.length, rep, pct: +(100 * rep / Bs.length).toFixed(0) });
  }
}
const recentes = pares.filter((p) => p.d1 >= "2011-01-01");
const media = (arr) => +(arr.reduce((s, p) => s + p.pct, 0) / arr.length).toFixed(0);
// Turnê 2026: frequência nos shows de 2026
const s26 = shows.filter((s) => s.data >= new Date("2026-01-01")), c26 = {};
for (const s of s26) for (const m of new Set(s.musicas.map(norm))) c26[m] = (c26[m] || 0) + 1;
// Mantém nas 2 noites: quanto cada música de hoje se repetiu na 2a noite dos pares recentes
const fica = {};
for (const p of recentes) {
  const a = shows.find((s) => s.data.toISOString().slice(0, 10) === p.d1 && s.cidade === p.cidade), b = shows.find((s) => s.data.toISOString().slice(0, 10) === p.d2 && s.cidade === p.cidade);
  const Bset = new Set(b.musicas.map(norm));
  for (const m of new Set(a.musicas.map(norm))) { fica[m] ??= [0, 0]; fica[m][1]++; if (Bset.has(m)) fica[m][0]++; }
}
const out = {
  shows_base: N, ultimo: shows.at(-1).data.toISOString().slice(0, 10), shows_2026: s26.length,
  hoje: hoje.map((m) => ({ musica: m, pct_carreira: pct(m), vezes: cont[norm(m)] || 0, em_2026: `${c26[norm(m)] || 0}/${s26.length}`,
    repete_2a_noite: fica[norm(m)] ? `${fica[norm(m)][0]}/${fica[norm(m)][1]}` : "sem dado" })),
  pares_total: pares.length, pares_desde_2011: recentes.length, repeticao_media_desde_2011: media(recentes), pares_recentes: recentes.slice(-8),
  candidatos_fora_hoje_2026: Object.entries(c26).filter(([m]) => !hojeN.has(m)).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([m, v]) => ({ musica: nome[m], em_2026: `${v}/${s26.length}`, pct_carreira: +(100 * (cont[m] || 0) / N).toFixed(1) })),
  candidatos_fora_hoje_carreira: Object.entries(cont).filter(([m]) => !hojeN.has(m)).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([m, v]) => ({ musica: nome[m], pct: +(100 * v / N).toFixed(1) })),
};
fs.writeFileSync("analise.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
