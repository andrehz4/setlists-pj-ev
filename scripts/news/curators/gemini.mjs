// Curador via Google Gemini API (Gemini 2.0 Flash, free tier rapido).
// Free tier: 15 RPM, 1500 req/dia, mais que suficiente pra 10 noticias/dia.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadPrompts, fillTemplate, validateCurated } from "./_shared.mjs";

const MODEL = "gemini-2.0-flash";
const TEMPERATURE = 0.6;
const MAX_OUTPUT_TOKENS = 800;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao definida no env");
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export const NAME = "gemini";
export const LABEL = "Gemini 2.0 Flash";

export async function curate({ title, sourceLabel, articleText, url, pubDate }) {
  const { system, userTemplate } = await loadPrompts();
  const userText = fillTemplate(userTemplate, {
    sourceLabel,
    url,
    title,
    pubDate,
    articleText: articleText || "(texto nao disponivel)",
  });

  const genai = getClient();
  const model = genai.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "text/plain",
    },
  });

  let resp;
  try {
    resp = await model.generateContent(userText);
  } catch (e) {
    console.warn(`[gemini] erro: ${e.message}`);
    return "SKIP";
  }

  const text = resp.response?.text?.()?.trim() || "";
  return validateCurated(text);
}
