// Registry de styles do story diario. Cada style cobre INTRO e OUTRO.
//
// Como adicionar style novo:
//   1. Cria arquivo story-styles/<nome>.mjs que default-exporta:
//        export default {
//          intro: ({ tRel, state }) => "<svg>...</svg>",
//          outro: ({ tRel, state }) => "<svg>...</svg>",
//        }
//   2. Importa aqui e adiciona em STYLES
//   3. Veja BRIEFING.md pra spec completa do que cada style precisa entregar
//
// Pra trocar style:
//   INTRO_STYLE=brutalist npm run publish:story:dry
// (env mantem nome INTRO_STYLE por compat com runs anteriores)

import brutalist from "./brutalist.mjs";
import editorialBadge from "./editorial-badge.mjs";

export const STYLES = {
  brutalist,
  "editorial-badge": editorialBadge,
};

export const DEFAULT_STYLE = "editorial-badge";

export function pickStyle(name) {
  return STYLES[name] || STYLES[DEFAULT_STYLE];
}

export function listStyles() {
  return Object.keys(STYLES);
}
