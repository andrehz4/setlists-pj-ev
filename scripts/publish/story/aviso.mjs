// Aviso do story publicado no Telegram do Andre.
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { horaBRT } from "../../lib/brt.mjs";
import { linkNoticia } from "../../config.mjs";

export async function notifyTelegramStory({ items, postId, track, dateKey, avisoVoz = "" }) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const lines = [`🎬 <b>Story publicado, ${horaBRT()} BRT</b>`, `<i>postId: <code>${postId}</code> · trilha: ${track.name}</i>`];
  if (avisoVoz) lines.push(`🎙 ${escHtml(avisoVoz)}`);
  lines.push("", `<b>${items.length} ${items.length === 1 ? "manchete" : "manchetes"} do dia ${dateKey}</b>`, "");
  items.forEach((it, i) => {
    lines.push(`${i + 1}. <b>${escHtml(it.title_pt || it.title || "(sem titulo)")}</b>`);
    lines.push(`   ↳ ${linkNoticia(it.id)}`);
  });
  await enviarTelegram(lines.join("\n"), { prefixo: "[story]" });
}
