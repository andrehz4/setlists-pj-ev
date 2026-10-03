// Envio pro Telegram do Andre, único pro projeto (antes eram 8 cópias). Nunca derruba a run:
// falha de rede ou de API vira aviso no log e o retorno é false.
const LIMITE = 3900; // a API corta em 4096; folga pro "(truncado)"

export const escHtml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// enviarTelegram(texto, { html, prefixo, token, chat })
//   html: true usa parse_mode HTML (escape o que vier de fora com escHtml).
//   token/chat: padrão TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID. Sem eles, só loga e devolve false.
export async function enviarTelegram(texto, opts = {}) {
  const {
    html = true,
    prefixo = "[telegram]",
    token = process.env.TELEGRAM_BOT_TOKEN,
    chat = process.env.TELEGRAM_CHAT_ID,
  } = opts;
  if (!token || !chat) {
    console.log(`${prefixo} sem TELEGRAM_*, não enviado`);
    return false;
  }
  const corpo = texto.length > LIMITE ? texto.slice(0, LIMITE) + "\n\n(truncado)" : texto;
  const params = { chat_id: chat, disable_web_page_preview: "true", text: corpo };
  if (html) params.parse_mode = "HTML";
  const base = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
  try {
    const res = await fetch(`${base}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    const json = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
    if (!json.ok) {
      console.warn(`${prefixo} telegram falhou:`, json.description || json);
      return false;
    }
    console.log(`${prefixo} telegram enviado`);
    return true;
  } catch (e) {
    console.warn(`${prefixo} telegram erro: ${e.message}`);
    return false;
  }
}
