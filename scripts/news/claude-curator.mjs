// Chamada ao Claude Haiku 4.5 com prompt de curador-fa.
// System prompt eh marcado com cache_control: ephemeral pra economizar tokens nas runs.

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;
const TEMPERATURE = 0.6;

const PROMPTS_DIR = path.resolve("scripts/news/prompts");

let _systemPrompt = null;
let _userTemplate = null;

async function loadPrompts() {
  if (!_systemPrompt) {
    _systemPrompt = await fs.readFile(path.join(PROMPTS_DIR, "system-curator-fa.txt"), "utf8");
  }
  if (!_userTemplate) {
    _userTemplate = await fs.readFile(path.join(PROMPTS_DIR, "user-template.txt"), "utf8");
  }
  return { system: _systemPrompt, userTemplate: _userTemplate };
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nao definida no env");
  _client = new Anthropic({ apiKey });
  return _client;
}

const VALID_TAGS = new Set(["turne", "lancamento", "ed-solo", "tenclub", "memoria", "br", "bootleg"]);

function validate(parsed) {
  if (typeof parsed !== "object" || !parsed) return false;
  if (typeof parsed.titulo_pt !== "string" || !parsed.titulo_pt.trim()) return false;
  if (parsed.titulo_pt.length > 90) return false;
  if (typeof parsed.intro_pt !== "string" || !parsed.intro_pt.trim()) return false;
  if (typeof parsed.corpo_pt !== "string" || parsed.corpo_pt.length < 100) return false;
  if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) return false;
  parsed.tags = parsed.tags.filter((t) => VALID_TAGS.has(t)).slice(0, 3);
  if (parsed.tags.length === 0) parsed.tags = ["memoria"];
  return true;
}

export async function curate({ title, sourceLabel, articleText, url, pubDate }) {
  const { system, userTemplate } = await loadPrompts();
  const userText = fillTemplate(userTemplate, { sourceLabel, url, title, pubDate, articleText: articleText || "(texto nao disponivel)" });

  const client = getClient();
  let resp;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
    });
  } catch (e) {
    console.warn(`[claude] erro: ${e.message}`);
    return "SKIP";
  }

  const text = resp.content?.[0]?.text?.trim() || "";
  if (!text) return "SKIP";
  if (text.toUpperCase() === "SKIP" || text.toUpperCase().startsWith("SKIP")) return "SKIP";

  // Limpa fences eventuais
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn(`[claude] JSON invalido: ${e.message}; primeiros 200 chars: ${cleaned.slice(0, 200)}`);
    return "SKIP";
  }

  if (!validate(parsed)) {
    console.warn("[claude] output invalido apos parse:", JSON.stringify(parsed).slice(0, 200));
    return "SKIP";
  }

  return parsed;
}
