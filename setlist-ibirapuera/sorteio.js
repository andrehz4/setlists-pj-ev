// Sorteio com cara de show real: abertura e encerramento sorteados entre os que o Eddie de fato usa (era Earthling),
// bis com as músicas que costumam ir no bis, e o meio pelo peso de quantas vezes ele tocou solo.
// sortearShow(grupos, modelo, rnd = Math.random) -> [{ ...musica, bis? }] (o traço de bis vai na última do set principal)
const pesoSolo = (m) => Math.sqrt(m.vezes || 0);

function sorteia(lista, peso, rnd) {
  const total = lista.reduce((s, x) => s + peso(x), 0);
  if (!total) return null;
  let r = rnd() * total;
  for (const x of lista) if ((r -= peso(x)) <= 0) return x;
  return lista[lista.length - 1];
}

export function sortearShow(grupos, modelo, rnd = Math.random) {
  const todas = new Map(grupos.flatMap((g) => g.musicas).map((m) => [m.chave, m]));
  const usadas = new Set();
  const pega = (cands, peso) => {
    const livres = cands.filter((m) => m && !usadas.has(m.chave));
    const m = sorteia(livres, peso, rnd);
    if (m) usadas.add(m.chave);
    return m ? { ...m } : null;
  };
  const doModelo = (lista) => lista.map((x) => todas.get(x.chave) && { ...todas.get(x.chave), _p: x.pct }).filter(Boolean);
  const principal = Math.max(8, Math.min(modelo?.principal || 14, 18));
  const noBis = Math.max(2, Math.min(modelo?.noBis || 4, 6));

  const abre = pega(doModelo(modelo?.abre || []), (m) => m._p);
  const fecha = pega(doModelo(modelo?.fecha || []), (m) => m._p);
  const bis = [];
  for (let i = 0; i < noBis - 1; i++) bis.push(pega(doModelo(modelo?.bis || []), (m) => m._p));
  const solo = [...todas.values()].filter((m) => m.vezes > 0);
  const meio = [];
  while (meio.length < principal - 1) {
    const m = pega(solo, pesoSolo);
    if (!m) break;
    meio.push(m);
  }
  const set = [abre, ...meio].filter(Boolean);
  if (set.length) set[set.length - 1].bis = true;
  return [...set, ...bis.filter(Boolean), fecha].filter(Boolean).slice(0, 24).map(({ _p, ...m }) => m);
}
