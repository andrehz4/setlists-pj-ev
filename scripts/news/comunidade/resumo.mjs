// Resumo das fontes da comunidade (step summary do Actions) e alerta de Reddit fora no Telegram.
import { enviarTelegram } from "../../lib/telegram.mjs";
import { horaBRT } from "../../lib/brt.mjs";

export function buildSearchSummary(sourceResults) {
  if (!sourceResults || sourceResults.length === 0) return "Nenhuma fonte consultada.";
  const lines = [];
  const ok = sourceResults.filter(s => !s.error);
  const err = sourceResults.filter(s => s.error);
  if (ok.length) {
    lines.push("Reddit consultado com sucesso:");
    for (const s of ok) {
      const plural = s.count !== 1 ? "s" : "";
      lines.push("- **" + s.label + "**: " + s.count + " post" + plural + " encontrado" + plural);
    }
    lines.push("");
    lines.push("Nenhum passou nos filtros para publicacao nesta execucao.");
  }
  if (err.length) {
    if (lines.length) lines.push("");
    lines.push("Fontes com erro:");
    for (const s of err) {
      lines.push("- **" + s.label + "**: " + String(s.error).slice(0, 120));
    }
  }
  return lines.join("\n");
}

// Reddit devolveu 0 posts por erro de API: avisa (digest e/ou spotlight não foram coletados).
export async function alertarRedditFora(sourceResults) {
  const erros = sourceResults.filter((s) => s.error);
  if (erros.length === 0) return;
  const linhas = erros.map((s) => `• ${s.label}: <code>${String(s.error).slice(0, 200)}</code>`).join("\n");
  await enviarTelegram(`⚠️ <b>Community fetch falhou, ${horaBRT()} BRT</b>\n\nReddit retornou 0 posts por erro de API. Digest e/ou Spotlight nao foram coletados.\n\n${linhas}\n\nVerificar: REDDIT_PROXY_URL, status do Reddit.`, { prefixo: "[community]" });
}
