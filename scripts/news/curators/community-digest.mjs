// Curator do digest da comunidade r/pearljam (via Gemini, structured JSON).
// Recebe um array de posts normalizados (de reddit-community.mjs) e produz
// UMA materia sintetizando o pulso do dia.
//
// Output: mesmo shape dos demais curators (titulo_pt/intro_pt/corpo_pt/tags)
// ou "SKIP" se o dia foi fraco.

import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateCurated } from "./_shared.mjs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TEMPERATURE = 0.7;
const MAX_OUTPUT_TOKENS = 4000;

const PROMPT_PATH = path.resolve("scripts/news/prompts/system-community-digest.txt");

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao definida no env");
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

let _systemPrompt = null;
async function loadSystemPrompt() {
  if (!_systemPrompt) {
    _systemPrompt = await fs.readFile(PROMPT_PATH, "utf8");
  }
  return _systemPrompt;
}

export const NAME = "community-digest";
export const LABEL = `Community Digest (${MODEL})`;

// Formata posts em JSON compacto pro LLM consumir.
function buildUserText(posts, periodLabel) {
  const lines = [
    `Janela: ${periodLabel}`,
    `Total de posts considerados: ${posts.length}`,
    "",
    "Posts (ordenados por score, do maior pro menor):",
    "",
  ];
  posts.forEach((p, i) => {
    lines.push(`--- Post ${i + 1} ---`);
    lines.push(`Autor: ${p.author}`);
    lines.push(`Título: ${p.title}`);
    lines.push(`Flair: ${p.flair || "(sem flair)"}`);
    lines.push(`Score: ${p.score} | Comentários: ${p.num_comments}`);
    lines.push(`Publicado: ${p.created_iso}`);
    if (p.selftext && p.selftext.trim()) {
      lines.push(`Texto do post:`);
      lines.push(p.selftext.trim());
    }
    lines.push("");
  });
  lines.push("Escreva o digest do dia conforme o sistema. Retorne JSON.");
  return lines.join("\n");
}

export async function curate({ posts, periodLabel = "ultimas 24 horas" }) {
  if (!Array.isArray(posts) || posts.length === 0) return "SKIP";

  const system = await loadSystemPrompt();
  const userText = buildUserText(posts, periodLabel);

  const responseSchema = {
    type: "object",
    properties: {
      skip: { type: "boolean" },
      titulo_pt: { type: "string" },
      intro_pt: { type: "string" },
      corpo_pt: { type: "string" },
      tags: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "turne", "lancamento", "tenclub", "memoria", "br", "bootleg", "comunidade",
            "eddie", "mike", "stone", "jeff", "matt", "boom", "josh",
          ],
        },
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
    systemInstruction: system,
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
    console.warn(`[community-digest] erro: ${e.message}`);
    return "SKIP";
  }

  const text = resp.response?.text?.()?.trim() || "";
  if (!text) return "SKIP";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.warn(`[community-digest] JSON invalido: ${e.message}; primeiros 200: ${text.slice(0, 200)}`);
    return "SKIP";
  }
  if (parsed.skip === true) return "SKIP";

  const standardized = {
    titulo_pt: parsed.titulo_pt,
    intro_pt: parsed.intro_pt,
    corpo_pt: parsed.corpo_pt,
    tags: parsed.tags,
  };
  return validateCurated(JSON.stringify(standardized));
}
