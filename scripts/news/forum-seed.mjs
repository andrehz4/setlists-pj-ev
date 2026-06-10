// Seeder semanal do forum: cria 1 topico de discussao a partir das noticias
// da semana (index.json), postado pelo usuario-bot via POST /forum/bot/topics.
//
// Motivacao: o forum esta tecnicamente pronto mas vazio; um topico semanal
// com as manchetes da pauta da algo pra quem chega comentar.
//
// Guarda-chuvas de seguranca:
//  - sem FORUM_BOT_KEY no env: skip gracioso (exit 0), nada quebra
//  - stamp em media/news/_forum-seed-stamp.json: nunca posta 2x na mesma
//    semana ISO, mesmo se o cron disparar de novo
//  - sem noticia na janela de 7 dias: skip (nao posta topico vazio)
//
// Rodar manual: FORUM_BOT_KEY=... node scripts/news/forum-seed.mjs

import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = process.env.FORUM_API_BASE || "https://perpetual-energy-production-1a69.up.railway.app";
const ORIGIN = process.env.FORUM_ORIGIN || "https://setlists-pj-ev.pages.dev";
const BOT_KEY = process.env.FORUM_BOT_KEY || "";
const INDEX_PATH = path.resolve("media/news/index.json");
const STAMP_PATH = path.resolve("media/news/_forum-seed-stamp.json");
const MAX_ITEMS = 5;

// Semana ISO (AAAA-WNN) pra idempotencia do stamp.
function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}

async function main() {
  if (!BOT_KEY) {
    console.log("[forum-seed] FORUM_BOT_KEY ausente, skip gracioso (cadastre o secret pra ativar)");
    return;
  }
  const week = isoWeek();
  const stamp = await readJson(STAMP_PATH, { lastWeek: null, lastTopicId: null });
  if (stamp.lastWeek === week) {
    console.log(`[forum-seed] topico da semana ${week} ja postado (${stamp.lastTopicId}), skip`);
    return;
  }

  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const recent = (indexDoc.items || [])
    .filter((it) => it && it.title_pt && new Date(it.pubDate || 0).getTime() >= cutoff)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, MAX_ITEMS);
  if (recent.length === 0) {
    console.log("[forum-seed] nenhuma noticia na janela de 7 dias, skip");
    return;
  }

  const lead = recent[0];
  const title = `Pauta da semana: ${(lead.title_ig || lead.title_pt).slice(0, 95)}`.slice(0, 120);
  const lines = [
    "O que rolou na semana, direto da pauta do site:",
    "",
    ...recent.map((it, i) => `${i + 1}. **${it.title_pt}**${it.intro_pt ? ` — ${it.intro_pt.slice(0, 140)}` : ""}`),
    "",
    `Matérias completas em ${ORIGIN} (aba Notícias).`,
    "",
    "Qual dessas te pegou? O que ficou de fora que merecia conversa?",
  ];
  const body = lines.join("\n").slice(0, 4000);

  const res = await fetch(`${API_BASE}/forum/bot/topics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": ORIGIN,
      "X-Bot-Key": BOT_KEY,
    },
    body: JSON.stringify({ title, body, category: "noticias" }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`POST /forum/bot/topics ${res.status}: ${detail.slice(0, 300)}`);
  }
  const topic = await res.json();
  await fs.writeFile(STAMP_PATH, JSON.stringify({ lastWeek: week, lastTopicId: topic.id, at: new Date().toISOString() }, null, 2));
  console.log(`[forum-seed] topico criado: ${topic.id} ("${title}")`);
}

main().catch((e) => {
  console.error("[forum-seed] FATAL:", e.message);
  process.exit(1);
});
