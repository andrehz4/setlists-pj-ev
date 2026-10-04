// "Alô, pessoal DO RJ / DE SP / DA BA": artigo certo por estado, e a ordem dos shows do dia por estado.
const COM_DO = new Set(["RJ", "PR", "RS", "MS", "CE", "ES", "PA", "AM", "AC", "AP", "MA", "PI", "RN", "TO", "DF"]);
const COM_DA = new Set(["BA", "PB"]);
export const preposicao = (uf) => (COM_DO.has(uf) ? "do" : COM_DA.has(uf) ? "da" : "de");
export const saudacao = (uf) => `ALÔ, PESSOAL ${preposicao(uf).toUpperCase()} ${uf}!`;

// Shows públicos de um dia, agrupados por UF (sem UF fica de fora: não dá pra saudar a região).
export function showsDoDiaPorUf(shows, dia) {
  const grupos = new Map();
  for (const s of shows) {
    if (s.data !== dia || s.fechado || !s.uf) continue;
    if (!grupos.has(s.uf)) grupos.set(s.uf, []);
    grupos.get(s.uf).push(s);
  }
  return [...grupos].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

// Contas pra marcar: a banda e a casa (quando a casa tem @).
export const contasDoShow = (s) => [s.banda, s.casa].filter(Boolean);
export const horaCurta = (h) => (h ? h.replace(":00", "h").replace(":", "h") : null);
