// Utilitarios de semana do reel semanal: chave ISO (idempotencia do
// _reel-log) e rotulo do intervalo exibido na peca/caption.

const MONTH_PT = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

// Chave ISO da semana (ex 2026-W24), calculada em UTC sobre a data recebida
// (o orquestrador ja passa a data convertida pra BRT).
export function isoWeekKey(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// "06 A 12 JUN" (ou "28 MAI A 03 JUN" cruzando mes): janela dos 7 dias
// que o reel cobre, terminando na data recebida.
export function weekRangeLabel(brtNow) {
  const end = brtNow;
  const start = new Date(brtNow.getTime() - 6 * 24 * 60 * 60 * 1000);
  const dd = (d) => String(d.getUTCDate()).padStart(2, "0");
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return sameMonth
    ? `${dd(start)} A ${dd(end)} ${MONTH_PT[end.getUTCMonth()]}`
    : `${dd(start)} ${MONTH_PT[start.getUTCMonth()]} A ${dd(end)} ${MONTH_PT[end.getUTCMonth()]}`;
}
