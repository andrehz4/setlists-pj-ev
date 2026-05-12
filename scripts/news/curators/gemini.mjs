// Curador via Google Gemini API.
// Default: gemini-2.5-flash (estavel, free tier cobre 500 req/dia >> 10/dia que usamos).
// Override via env GEMINI_MODEL (ex: gemini-2.5-pro, gemini-2.5-flash-lite, gemini-3-flash-preview).
// Tabela completa de precos: https://ai.google.dev/pricing
//
// Nota: gemini-2.0-flash sera desativado em 2026-06-01. Nao usar.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadPrompts, fillTemplate, validateCurated } from "./_shared.mjs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TEMPERATURE = 0.6;
const MAX_OUTPUT_TOKENS = 4000;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao definida no env");
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export const NAME = "gemini";
export const LABEL = `Gemini (${MODEL})`;

export async function curate({ title, sourceLabel, articleText, url, pubDate }) {
  const { system, userTemplate } = await loadPrompts();
  const userText = fillTemplate(userTemplate, {
    sourceLabel,
    url,
    title,
    pubDate,
    articleText: articleText || "(texto nao disponivel)",
  });

  // JSON mode estruturado: Gemini garante schema + escapa newlines corretamente.
  // Sem isso, o modelo serializava \n literal dentro do corpo_pt e quebrava o JSON.parse.
  // O campo `skip` (boolean) faz papel da string "SKIP" do anthropic — JSON mode nao
  // suporta "responda string OU objeto", entao usamos sempre objeto com flag.
  const responseSchema = {
    type: "object",
    properties: {
      skip: { type: "boolean", description: "true se a noticia for irrelevante/lixo (rumor sem fonte, clickbait, conteudo nao-PJ)" },
      titulo_pt: { type: "string" },
      intro_pt: { type: "string" },
      corpo_pt: { type: "string" },
      tags: {
        type: "array",
        items: { type: "string", enum: ["turne", "lancamento", "ed-solo", "tenclub", "memoria", "br", "bootleg"] },
        minItems: 1,
        maxItems: 3,
      },
    },
    required: ["skip"],
    propertyOrdering: ["skip", "titulo_pt", "intro_pt", "corpo_pt", "tags"],
  };

  const genai = getClient();
  const model = genai.getGenerativeModel({
    model: MODEL,
    systemInstruction: system + "\n\nNOTA TECNICA: Output via Gemini structured JSON. Use o campo `skip: true` em vez de retornar string 'SKIP'. Quando `skip: true`, deixe os outros campos vazios. Quando `skip: false`, preencha titulo_pt/intro_pt/corpo_pt/tags conforme as regras.",
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      responseSchema,
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
  if (!text) return "SKIP";

  // Com JSON mode, o output ja vem JSON valido. Mas vamos parsear aqui mesmo
  // pra checar o flag `skip` antes de delegar ao validador compartilhado.
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.warn(`[gemini] JSON mode falhou: ${e.message}; primeiros 200: ${text.slice(0, 200)}`);
    return "SKIP";
  }
  if (parsed.skip === true) return "SKIP";

  // Converte pro shape que o validator espera (sem o campo `skip`)
  const standardized = {
    titulo_pt: parsed.titulo_pt,
    intro_pt: parsed.intro_pt,
    corpo_pt: parsed.corpo_pt,
    tags: parsed.tags,
  };
  return validateCurated(JSON.stringify(standardized));
}
