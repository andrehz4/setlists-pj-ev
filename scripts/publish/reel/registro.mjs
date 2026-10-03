// Idempotência do reel (1 por semana ISO) em _reel-log.json, espelho best-effort no Facebook e aviso no
// Telegram. FB só com PUBLISH_FB=1 + secrets; falha nele só loga (o IG já publicou).
import fs from "node:fs/promises";
import path from "node:path";
import { lerEstado, comLista } from "../../lib/estado.mjs";
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { ESTADO, linkNoticia } from "../../config.mjs";
import { publishVideoReel } from "../facebook.mjs";

const LOG_PATH = ESTADO.logReel;

// Corrompido derruba: log vazio em silêncio quebrava a idempotência (post duplicado).
export const readLog = () => lerEstado(LOG_PATH, { entries: [] }, { valida: comLista("entries") });

export async function writeLog(log) {
  if (log.entries.length > 60) log.entries = log.entries.slice(-60);
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));
}

export async function espelharNoFacebook(videoUrl, caption) {
  if (!(process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN)) return null;
  try {
    const fb = await publishVideoReel({ videoUrl, description: caption });
    console.log(`[reel] FB OK fbPostId=${fb.postId}`);
    return fb.postId;
  } catch (e) {
    console.error(`[reel] FB FALHA (IG ja publicou, seguindo): ${typeof e.toDetailString === "function" ? e.toDetailString() : e.message}`);
    return null;
  }
}

export async function avisarReel({ items, postId, track, weekKey, rangeLabel, avisoVoz = "" }) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const lines = [`🎞 <b>Reel semanal publicado (${weekKey})</b>`, `<i>postId: <code>${postId}</code> · trilha: ${track.name} · ${rangeLabel}</i>`];
  if (avisoVoz) lines.push(`🎙 ${escHtml(avisoVoz)}`);
  lines.push("");
  items.forEach((it, i) => {
    lines.push(`${i + 1}. <b>${escHtml(it.title_pt || "(sem titulo)")}</b>`);
    lines.push(`   ↳ ${linkNoticia(it.id)}`);
  });
  await enviarTelegram(lines.join("\n"), { prefixo: "[reel]" });
}
