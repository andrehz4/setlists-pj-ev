// Helpers compartilhados entre todos os intro-styles.
// state padrao: { day, monthShort, monthLong, year, dayOfWeekShort,
// dayOfWeekLong, edition, itemCount, tarjaColor, W, H }

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export function easeOutCubic(t) { const x = clamp01(t); return 1 - Math.pow(1 - x, 3); }
export function easeOutBack(t) { const x = clamp01(t); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
export function easeInOutQuad(t) { const x = clamp01(t); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
export function progress(t, start, dur) { return clamp01((t - start) / dur); }

export function escapeXml(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

export const MONTH_NUM = { JAN:"01", FEV:"02", MAR:"03", ABR:"04", MAI:"05", JUN:"06", JUL:"07", AGO:"08", SET:"09", OUT:"10", NOV:"11", DEZ:"12" };
