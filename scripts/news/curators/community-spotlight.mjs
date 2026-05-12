// Curator do spotlight de fan content do r/pearljam (via Gemini, structured JSON).
// Recebe UM post normalizado (de reddit-community.mjs) e produz uma materia curta
// celebrando o trabalho do fa.
//
// Output: mesmo shape dos demais curators ou "SKIP" (se for menor, meme ou ambíguo).

import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateCurated } from "./_shared.mjs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TEMPERATURE = 0.7;
const MAX_OUTPUT_TOKENS = 3000;

const PROMPT_PATH = path.resolve("scripts/news/prompts/system-community-spotlight.txt");

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

export const NAME = "community-spotlight";
export const LABEL = `Community Spotlight (${MODEL})`;

function buildUserText(post) {
  const lines = [
    "POST a celebrar:",
    `Autor: ${post.author}`,
    `URL do post: ${post.permalink}`,
    `Título original (inglês): ${post.title}`,
    `Flair: ${post.flair || "(sem flair)"}`,
    `Score: ${post.score} | Comentários: ${post.num_comments}`,
    `Publicado: ${post.created_iso}`,
    `Imagem cover: ${post.cover_image || "(sem imagem)"}`,
  ];
  if (post.selftext && post.selftext.trim()) {
    lines.push("");
    lines.push("Texto que o fã escreveu junto do post:");
    lines.push(post.selftext.trim());
  }
  lines.push("");
  lines.push("Escreva a matéria spotlight conforme o sistema. NÃO esqueça o crédito obrigatório no último parágrafo em itálico:");
  lines.push(`_Arte original por ${post.author} no r/pearljam. Post: ${post.permalink}._`);
  lines.push("");
  lines.push("Retorne JSON.");
  return lines.join("\n");
}

export async function curate({ post }) {
  if (!post) return "SKIP";

  const system = await loadSystemPrompt();
  const userText = buildUserText(post);

  const responseSchema = {
    type: "object",
    properties: {
      skip: { type: "boolean" },
      titulo_pt: { type: "string" },
      intro_pt: { type: "string" },
      corpo_pt: { type: "string" },
      tags: {
        type: "array",
        items: { type: "string", enum: ["turne", "lancamento", "ed-solo", "tenclub", "memoria", "br", "bootleg", "comunidade"] },
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
    console.warn(`[community-spotlight] erro: ${e.message}`);
    return "SKIP";
  }

  const text = resp.response?.text?.()?.trim() || "";
  if (!text) return "SKIP";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.warn(`[community-spotlight] JSON invalido: ${e.message}; primeiros 200: ${text.slice(0, 200)}`);
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
