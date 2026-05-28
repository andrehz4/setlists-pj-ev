// Bot Telegram simples baseado em polling. Processa comandos enviados
// pelo Andre desde o ultimo cron. Latencia max = intervalo do cron
// (sem webhook, sem servidor dedicado). Comandos suportados:
//
//   /ban <itemId> [razao]    — adiciona item a denylist do IG
//   /unban <itemId>          — remove item da denylist
//   /denylist                — lista atual da denylist
//   /status                  — quota IG + tamanho da fila
//
// Cursor: media/news/_telegram-cursor.json guarda o last update_id
// processado, evita reprocessar comandos antigos a cada run.
//
// Seguranca: so processa mensagens do chatId autorizado (TELEGRAM_CHAT_ID).
// Outros chats sao silenciosamente ignorados.

import fs from "node:fs/promises";
import path from "node:path";
import { readDenylist, writeDenylist, addToDenylist, removeFromDenylist, isDenied, readQueue } from "./queue.mjs";

const CURSOR_PATH = path.resolve("media/news/_telegram-cursor.json");
const TELEGRAM_API = "https://api.telegram.org";

async function readCursor() {
  try {
    const raw = await fs.readFile(CURSOR_PATH, "utf8");
    const doc = JSON.parse(raw);
    return doc.lastUpdateId || 0;
  } catch {
    return 0;
  }
}

async function writeCursor(lastUpdateId) {
  await fs.writeFile(CURSOR_PATH, JSON.stringify({
    lastUpdateId,
    updatedAt: new Date().toISOString(),
  }, null, 2));
}

async function tgGet(token, method, params = {}) {
  const url = new URL(`${TELEGRAM_API}/bot${token}/${method}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { method: "GET" });
  return res.json();
}

async function tgSend(token, chatId, text, replyTo = null) {
  const params = new URLSearchParams({
    chat_id: String(chatId),
    parse_mode: "HTML",
    disable_web_page_preview: "true",
    text: text.length > 3900 ? text.slice(0, 3900) + "\n\n(truncado)" : text,
  });
  if (replyTo) params.set("reply_to_message_id", String(replyTo));
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch (e) {
    console.warn("[telegram-bot] sendMessage falhou:", e.message);
  }
}

function parseCommand(text) {
  if (!text || !text.startsWith("/")) return null;
  const m = text.match(/^\/(\w+)(?:@\S+)?(?:\s+(.*))?$/s);
  if (!m) return null;
  const cmd = m[1].toLowerCase();
  const rest = (m[2] || "").trim();
  const parts = rest.split(/\s+/).filter(Boolean);
  return { cmd, args: parts, rest };
}

async function handleBan(token, chatId, replyTo, args) {
  const itemId = args[0];
  const reason = args.slice(1).join(" ") || "via Telegram";
  if (!itemId) {
    await tgSend(token, chatId, "❌ uso: <code>/ban &lt;itemId&gt; [razao]</code>", replyTo);
    return;
  }
  const denylist = await readDenylist();
  if (isDenied(denylist, itemId)) {
    await tgSend(token, chatId, `ℹ️ <code>${itemId}</code> ja esta banido.`, replyTo);
    return;
  }
  let postId = null;
  try {
    const queue = await readQueue();
    const found = queue.items.find((q) => q.id === itemId);
    if (found?.postId) postId = found.postId;
  } catch {}
  addToDenylist(denylist, { itemId, postId, reason });
  await writeDenylist(denylist);
  await tgSend(token, chatId, `✅ <code>${itemId}</code> banido (postId=${postId || "?"}, reason="${reason}").\n\n⚠️ Lembra de dar commit+push do <code>_deleted-from-ig.json</code> pra propagar.`, replyTo);
}

async function handleUnban(token, chatId, replyTo, args) {
  const itemId = args[0];
  if (!itemId) {
    await tgSend(token, chatId, "❌ uso: <code>/unban &lt;itemId&gt;</code>", replyTo);
    return;
  }
  const denylist = await readDenylist();
  if (!isDenied(denylist, itemId)) {
    await tgSend(token, chatId, `ℹ️ <code>${itemId}</code> nao esta banido.`, replyTo);
    return;
  }
  removeFromDenylist(denylist, itemId);
  await writeDenylist(denylist);
  await tgSend(token, chatId, `✅ <code>${itemId}</code> removido da denylist.`, replyTo);
}

async function handleDenylist(token, chatId, replyTo) {
  const denylist = await readDenylist();
  if (denylist.deleted.length === 0) {
    await tgSend(token, chatId, "📋 Denylist vazia.", replyTo);
    return;
  }
  const lines = [`📋 <b>${denylist.deleted.length} item(s) banido(s)</b>`, ""];
  for (const d of denylist.deleted.slice(-15)) {
    lines.push(`<code>${d.itemId}</code> ${d.reason || "?"}`);
  }
  if (denylist.deleted.length > 15) {
    lines.push("", `(... mostrando os ultimos 15 de ${denylist.deleted.length})`);
  }
  await tgSend(token, chatId, lines.join("\n"), replyTo);
}

async function handleStatus(token, chatId, replyTo) {
  try {
    const queue = await readQueue();
    const denylist = await readDenylist();
    const pending = queue.items.filter((q) => !q.postedAt).length;
    const posted = queue.items.filter((q) => q.postedAt).length;
    const lines = [
      "📊 <b>Status do pipeline IG</b>",
      "",
      `Fila: <b>${queue.items.length}</b> items (${pending} pendentes, ${posted} postados na janela)`,
      `postCount global: <code>${queue.postCount}</code>`,
      `Denylist (deletados do IG): <b>${denylist.deleted.length}</b>`,
    ];
    await tgSend(token, chatId, lines.join("\n"), replyTo);
  } catch (e) {
    await tgSend(token, chatId, `❌ status falhou: ${e.message}`, replyTo);
  }
}

// Processa updates novos do Telegram desde o ultimo cursor. Retorna
// quantos updates foram processados. Silenciosamente ignora mensagens
// de chats nao autorizados.
export async function pollTelegramCommands({ token, authorizedChatId } = {}) {
  if (!token) token = process.env.TELEGRAM_BOT_TOKEN;
  if (!authorizedChatId) authorizedChatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !authorizedChatId) {
    return { processed: 0, skipped: "sem token ou chat id" };
  }

  const cursor = await readCursor();
  // offset = lastUpdateId + 1 retorna updates novos (Telegram boilerplate)
  const offset = cursor > 0 ? cursor + 1 : 0;

  let updates;
  try {
    const r = await tgGet(token, "getUpdates", { offset, timeout: 0, limit: 30 });
    if (!r.ok) {
      console.warn("[telegram-bot] getUpdates retornou ok=false:", r);
      return { processed: 0, skipped: "getUpdates falhou" };
    }
    updates = r.result || [];
  } catch (e) {
    console.warn("[telegram-bot] getUpdates erro:", e.message);
    return { processed: 0, skipped: e.message };
  }

  if (updates.length === 0) return { processed: 0 };

  let maxId = cursor;
  let processed = 0;
  for (const u of updates) {
    maxId = Math.max(maxId, u.update_id);
    const msg = u.message || u.edited_message;
    if (!msg) continue;
    // Ignora mensagens de chats nao autorizados
    if (String(msg.chat?.id) !== String(authorizedChatId)) continue;
    const cmd = parseCommand(msg.text || "");
    if (!cmd) continue;
    const chatId = msg.chat.id;
    const replyTo = msg.message_id;
    try {
      if (cmd.cmd === "ban") {
        await handleBan(token, chatId, replyTo, cmd.args);
      } else if (cmd.cmd === "unban") {
        await handleUnban(token, chatId, replyTo, cmd.args);
      } else if (cmd.cmd === "denylist") {
        await handleDenylist(token, chatId, replyTo);
      } else if (cmd.cmd === "status") {
        await handleStatus(token, chatId, replyTo);
      } else {
        // Comando desconhecido, ignora silenciosamente
        continue;
      }
      processed++;
    } catch (e) {
      console.warn(`[telegram-bot] handler /${cmd.cmd} falhou:`, e.message);
      await tgSend(token, chatId, `❌ erro em /${cmd.cmd}: ${e.message}`, replyTo);
    }
  }

  // Salva cursor mesmo se nada foi processado (pra "consumir" updates
  // antigos de chats nao autorizados ou comandos invalidos).
  if (maxId > cursor) await writeCursor(maxId);
  return { processed };
}
