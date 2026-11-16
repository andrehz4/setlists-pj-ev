// Modelo de show real a partir dos setlists solo recentes (setlist.fm): quem abre, quem fecha, o que costuma ir no bis
// e o tamanho de cada parte. Puro (testado): modeloDeShow(shows, chave) -> { shows, abre, fecha, bis, principal, noBis }
const conta = (lista) => {
  const m = new Map();
  for (const k of lista) m.set(k, (m.get(k) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
};
const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

export function modeloDeShow(shows, chave) {
  const n = shows.length;
  const peso = ([k, v]) => ({ chave: k, pct: Math.round((v / n) * 1000) / 10 });
  const comBis = shows.filter((s) => s.sets.some((st) => st.bis));
  const bis = conta(comBis.flatMap((s) => s.sets.filter((st) => st.bis).flatMap((st) => st.musicas.map((m) => chave(m.nome)))));
  return {
    shows: n,
    abre: conta(shows.map((s) => chave(s.musicas[0].nome))).slice(0, 12).map(peso),
    fecha: conta(shows.map((s) => chave(s.musicas[s.musicas.length - 1].nome))).slice(0, 12).map(peso),
    bis: bis.slice(0, 30).map(peso),
    principal: mediana(shows.map((s) => s.sets.filter((st) => !st.bis).reduce((t, st) => t + st.musicas.length, 0))),
    noBis: mediana(comBis.map((s) => s.sets.filter((st) => st.bis).reduce((t, st) => t + st.musicas.length, 0))),
  };
}
