// PROVA DA DATA: show só entra no site e nos posts se a data dele estiver ESCRITA no post de origem ("27/11", "27.11",
// "dia 27", "27 de novembro", "27. SEXTA" ou "SEX 27" com o mês no texto) ou na leitura da arte desse post. Data
// deduzida ("sábado tem", primeira data de um post com vários dias) fica segurada e vai pro Telegram com o link.
// Liberar à mão: id do show em media/agenda/aprovados.json. Caso real 23/11/2026: Blaymorphed inventada na quinta 26.
// Desliga com AGENDA_PROVA=0. Funções puras, testadas em scripts/regressao/agenda-prova-da-data.test.mjs.
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const plano = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function dataEscrita(texto, dataIso) {
  const t = plano(texto);
  const [, mm, dd] = dataIso.split("-").map(Number);
  const d = `0?${dd}`, m = `0?${mm}`, mes = MESES[mm - 1];
  if (new RegExp(`(?<!\\d)${d}\\s*[/.-]\\s*${m}(?!\\d)`).test(t)) return true;
  if (new RegExp(`(?<!\\d)${d}\\s*(?:de\\s+)?(?:${mes}|${mes.slice(0, 3)})\\b`).test(t)) return true; // "31 de janeiro", "31 JAN"
  if (new RegExp(`\\b(?:${mes}|${mes.slice(0, 3)})\\.?\\s+${d}(?!\\d)`).test(t)) return true; // "JAN 31"
  const comMes = new RegExp(`\\b(${mes}|${mes.slice(0, 3)})\\b`).test(t);
  if (!comMes) return false;
  return new RegExp(`\\bdia\\s+${d}(?!\\d)`).test(t)
    || new RegExp(`(?:^|\\n)[^\\w\\n]{0,4}${d}\\s*(?:[.)|:–-]|\\s+(?:seg|ter|qua|qui|sex|sab|dom))`).test(t)
    || new RegExp(`\\b(?:seg|ter|qua|qui|sex|sab|dom)[a-z-]*\\.?\\s+${d}(?!\\d|\\s*[/.]\\s*\\d)`).test(t);
}

// post de origem = {legenda, arte:[{data}]}. Sem post achado = sem prova.
export const temProva = (s, post) => Boolean(post) && (dataEscrita(post.legenda, s.data) || (post.arte || []).some((a) => a.data === s.data));

export function separarSemProva(agenda, postsPorLink, aprovados = new Set(), env = process.env) {
  if (env.AGENDA_PROVA === "0") return { ok: agenda, semProva: [] };
  const semProva = agenda.filter((s) => !aprovados.has(s.id) && !temProva(s, postsPorLink.get(s.fonte)));
  return { ok: agenda.filter((s) => !semProva.includes(s)), semProva };
}
