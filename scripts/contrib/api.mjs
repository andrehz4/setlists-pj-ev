// Conversa com as rotas do robô no backend (/contrib/bot/*) e com o Telegram do Andre.

const API = process.env.CONTRIB_API || "https://perpetual-energy-production-1a69.up.railway.app";
const ORIGEM = "https://setlists-pj-ev.pages.dev";
const DRY = process.argv.includes("--dry");

export async function bot(caminho, corpo) {
  const r = await fetch(API + "/contrib/bot" + caminho, {
    method: corpo ? "POST" : "GET",
    headers: {
      "X-Bot-Key": process.env.CONTRIB_BOT_KEY || "",
      Origin: ORIGEM,
      ...(corpo ? { "Content-Type": "application/json" } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!r.ok) throw Object.assign(new Error(`${caminho}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`), { status: r.status });
  return r.json();
}

export async function telegram(texto) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat || DRY) return console.log("[telegram]", texto);
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
  }).catch((e) => console.warn("[telegram] falhou:", e.message));
}

// Registra a falha no backend e decide o aviso: só na 1ª falha e na desistência (sem spam).
export async function falhou(envio, etapa, erro) {
  const msg = String(erro?.message || erro).slice(0, 500);
  let r = { tentativas: 1, desistiu: false };
  try { r = await bot(`/falha/${envio.id}`, { etapa, erro: msg }); }
  catch (e) { console.warn("[falha] backend não registrou:", e.message); }
  const titulo = `"${envio.title}"`;
  if (r.desistiu) {
    await telegram(`⛔ Desisti de ${etapa === "curadoria" ? "curar" : "publicar"} ${titulo} depois de ${r.tentativas} tentativas. A pessoa foi avisada pra reenviar.\nÚltimo erro: ${msg}`);
  } else if (r.tentativas === 1) {
    await telegram(`⚠️ Falha na ${etapa} de ${titulo}: ${msg}\nTento de novo sozinho (até ${r.limite || "algumas"} vezes) e só aviso de novo se desistir.`);
  }
  return r;
}
