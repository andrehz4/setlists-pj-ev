// Logica de selecao de foto fallback da banda.
// Modulo isolado para facilitar testes sem carregar sharp/canvas.
import fs from "node:fs/promises";
import path from "node:path";

export const BAND_DIR = path.resolve("media/band");
const EMERGENCY_FALLBACK = path.resolve("media/news/img/_band-fallback-1.jpg");

export async function loadBandFallbacks(dir = BAND_DIR) {
  try {
    const entries = await fs.readdir(dir);
    const jpgs = entries
      .filter(f => /\.(jpg|jpeg)$/i.test(f))
      .sort()
      .map(f => path.join(dir, f));
    return jpgs.length > 0 ? jpgs : [EMERGENCY_FALLBACK];
  } catch {
    return [EMERGENCY_FALLBACK];
  }
}

export function pickFallback(fallbacks, id, dayOfYear = Math.floor(Date.now() / 86400000)) {
  const hex = String(id || "").replace(/[^0-9a-f]/gi, "")[0] || "0";
  return fallbacks[(parseInt(hex, 16) + dayOfYear) % fallbacks.length];
}
