// Curador via Anthropic API (Claude Haiku 4.5).
// System prompt com cache_control ephemeral pra economizar tokens.

import Anthropic from "@anthropic-ai/sdk";
import { loadPrompts, fillTemplate, validateCurated } from "./_shared.mjs";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;
const TEMPERATURE = 0.6;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nao definida no env");
  _client = new Anthropic({ apiKey });
  return _client;
}

export const NAME = "anthropic";
export const LABEL = "Claude Haiku 4.5";

export async function curate({ title, sourceLabel, articleText, url, pubDate }) {
  const { system, userTemplate } = await loadPrompts();
  const userText = fillTemplate(userTemplate, {
    sourceLabel,
    url,
    title,
    pubDate,
    articleText: articleText || "(texto nao disponivel)",
  });

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
    console.warn(`[anthropic] erro: ${e.message}`);
    return "SKIP";
  }

  const text = resp.content?.[0]?.text?.trim() || "";
  return validateCurated(text);
}
