// Mensagens do publish do feed pro Telegram do Andre (resultado dos lotes).
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { horaBRT } from "../../lib/brt.mjs";
import { linkNoticia } from "../../config.mjs";
import { APP_LEVEL_CODES, COOLDOWN_APP_LEVEL_MS, COOLDOWN_CONTENT_MS } from "./config.mjs";

export const avisar = (texto) => enviarTelegram(texto, { prefixo: "[publish]" });
const temTelegram = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

export async function notifyTelegram(results) {
  if (!temTelegram()) return;
  const success = results.filter((r) => r.succeeded > 0 && r.postId);
  const failed = results.filter((r) => r.succeeded === 0 && r.error);
  if (success.length > 0) await avisar(mensagemSucesso(success));
  if (failed.length > 0) await avisar(mensagemFalha(failed));
}

function mensagemSucesso(success) {
  const totalItems = success.reduce((s, r) => s + r.items.length, 0);
  const lines = [`✅ <b>Publicado no @smufdpj, ${horaBRT()} BRT</b>`, ""];
  for (const batch of success) {
    const label = batch.type === "spotlight" ? "Spotlight da comunidade" : "Notícias regulares";
    lines.push(`<b>${batch.items.length} ${batch.items.length === 1 ? "post" : "posts"} (${label})</b>`);
    lines.push(`<i>postId: <code>${batch.postId}</code></i>`);
    lines.push("");
    batch.items.forEach((it, i) => {
      const tagsStr = it.tags.length ? `  <i>tags: ${it.tags.join(", ")}</i>` : "";
      lines.push(`${i + 1}. <b>${escHtml(it.title_pt || "(sem titulo)")}</b>${tagsStr}`);
      lines.push(`   ↳ ${linkNoticia(it.id)}`);
    });
    lines.push("");
  }
  lines.push(`Total: ${totalItems} item(s) no feed agora.`);
  return lines.join("\n");
}

function mensagemFalha(failed) {
  const lines = [`❌ <b>Falha ao publicar no @smufdpj, ${horaBRT()} BRT</b>`, ""];
  for (const batch of failed) {
    const tag = batch.isRateLimit ? " ⏱ <i>rate limit</i>" : "";
    lines.push(`<b>tipo: ${batch.type}</b>${tag}, ${batch.attempted} item(s) tentado(s)`);
    lines.push(`<code>${escHtml(batch.error || "erro desconhecido")}</code>`);
    const meta = [];
    if (batch.errorCode != null) meta.push(`code=${batch.errorCode}`);
    if (batch.errorSubcode != null) meta.push(`subcode=${batch.errorSubcode}`);
    if (batch.fbtraceId) meta.push(`fbtrace=<code>${escHtml(batch.fbtraceId)}</code>`);
    if (meta.length) lines.push(meta.join(" "));
    lines.push("");
  }
  const rateLimited = failed.some((r) => r.isRateLimit);
  const tokenError = failed.some((r) => /blocked|token|expired|oauth/i.test(r.error || ""));
  if (rateLimited && failed.some((r) => APP_LEVEL_CODES.has(r.errorCode))) {
    lines.push("⏱ <b>Rate limit DA APP (code 4).</b> Limite de chamadas da aplicacao inteira no Graph API, independente da cota de 50/24h.");
    lines.push(`Cooldown global armado por ${COOLDOWN_APP_LEVEL_MS / 3600000}h: proximos crons saem cedo sem tocar a API ate liberar.`);
    lines.push("Se persistir, cheque restricao/tier da app no Meta Developer Portal.");
  } else if (rateLimited) {
    lines.push("⏱ <b>Rate limit IG (content publishing).</b> Cota de publishes na janela rolling de 24h saturou.");
    lines.push(`Cooldown global armado por ${COOLDOWN_CONTENT_MS / 3600000}h: proximos crons saem cedo ate liberar.`);
  } else if (tokenError) {
    lines.push("⚠️ Provavel token expirado. Reautorize em Meta Developer Portal e atualize o secret:");
    lines.push("<code>gh secret set IG_ACCESS_TOKEN --repo andrehz4/setlists-pj-ev</code>");
  }
  return lines.join("\n");
}
