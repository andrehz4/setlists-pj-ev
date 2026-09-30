// Cores dos slides de citação por cor do ciclo (CYCLE_COLORS), tiradas do
// Claude Design (2026-09-30): fundo escuro, destaque (cor viva), claro (texto
// secundário na cor do dia, legível no fundo) e apagado (rodapé).

import { capsuleColors } from "../slide-image.mjs";

const TABELA = {
  "#0a0a0a": { bg: "#15171d", accent: "#e04b53", claro: "#e04b53", apagado: "#8d9099" },
  "#e10600": { bg: "#1a0506", accent: "#e10600", claro: "#ff4136", apagado: "#a08a8a" },
  "#a87f2c": { bg: "#1b170f", accent: "#a87f2c", claro: "#d4a94e", apagado: "#8f8878" },
  "#2a5b9e": { bg: "#0a1220", accent: "#2a5b9e", claro: "#8fb3e6", apagado: "#7d8aa0" },
};

function mistura(a, b, t) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const pa = n(a), pb = n(b);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export function paleta(cor = "#0a0a0a") {
  const k = String(cor).toLowerCase();
  if (TABELA[k]) return TABELA[k];
  // cor nova no ciclo: deriva do mesmo jeito que o slide antigo
  const { bg, accent } = capsuleColors(cor);
  return { bg, accent, claro: mistura(accent, "#ffffff", 0.45), apagado: mistura(bg, "#ffffff", 0.55) };
}
