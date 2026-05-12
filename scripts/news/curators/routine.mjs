// Curador modo "routine": NAO chama API.
// Em vez de curar agora, marca o item como pendente em media/news/_pending.json.
// A Claude routine (agendada via /schedule no Claude Code) le esse arquivo,
// curatela cada item nativamente usando o system prompt, e chama
// `node scripts/news/merge-curated.mjs` pra escrever no index.json final.

export const NAME = "routine";
export const LABEL = "Claude Routine (manual)";

// Esse curador sempre retorna PENDING. O orquestrador detecta isso e
// joga o item bruto em _pending.json em vez de no index.json final.
export async function curate(item) {
  return "PENDING";
}
