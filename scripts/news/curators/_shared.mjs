// Util compartilhada entre curators: carrega prompts, valida output JSON.

import fs from "node:fs/promises";
import path from "node:path";

const PROMPTS_DIR = path.resolve("scripts/news/prompts");

let _systemPrompt = null;
let _userTemplate = null;

export async function loadPrompts() {
  if (!_systemPrompt) {
    _systemPrompt = await fs.readFile(path.join(PROMPTS_DIR, "system-curator-fa.txt"), "utf8");
  }
  if (!_userTemplate) {
    _userTemplate = await fs.readFile(path.join(PROMPTS_DIR, "user-template.txt"), "utf8");
  }
  return { system: _systemPrompt, userTemplate: _userTemplate };
}

export function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

const VALID_TAGS = new Set(["turne", "lancamento", "ed-solo", "tenclub", "memoria", "br", "bootleg"]);

// Sanitiza travessao (em-dash U+2014, en-dash U+2013, figure-dash U+2012,
// horizontal-bar U+2015, minus sign U+2212) substituindo por pontuacao PT-BR
// adequada. Travessao eh proibido em qualquer conteudo do site (regra global).
export function stripDashes(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/\s+[—–‒―−]\s+/g, ", ")   // " — " separador de clausula
    .replace(/\s+[—–‒―−]/g, ",")        // " —" no fim
    .replace(/[—–‒―−]\s+/g, ", ")       // "— " no comeco
    .replace(/[—–‒―−]/g, "-");          // remanescente colado → hifen
}

// Trunca string num boundary de palavra + "..." se exceder maxChars.
// Usado pra garantir que intro_pt nao explode o layout do card mesmo quando
// o LLM ignora a regra de comprimento.
export function truncateAtWord(s, maxChars) {
  if (typeof s !== "string" || s.length <= maxChars) return s;
  const cut = s.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
  return safe.replace(/[.,;:!?]+$/, "") + "...";
}

// Recebe string crua do LLM, retorna objeto curado ou "SKIP".
export function validateCurated(rawText) {
  const text = (rawText || "").trim();
  if (!text) return "SKIP";
  if (text.toUpperCase() === "SKIP" || text.toUpperCase().startsWith("SKIP")) return "SKIP";

  // Limpa fences eventuais
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn(`[curator] JSON invalido: ${e.message}; primeiros 200 chars: ${cleaned.slice(0, 200)}`);
    return "SKIP";
  }

  if (typeof parsed !== "object" || !parsed) return "SKIP";
  if (typeof parsed.titulo_pt !== "string" || !parsed.titulo_pt.trim()) return "SKIP";
  if (parsed.titulo_pt.length > 90) return "SKIP";
  if (typeof parsed.intro_pt !== "string" || !parsed.intro_pt.trim()) return "SKIP";
  if (typeof parsed.corpo_pt !== "string" || parsed.corpo_pt.length < 100) return "SKIP";
  if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) return "SKIP";

  // Sanitiza travessao (regra global do site, nao pode passar nem se o LLM teimar)
  parsed.titulo_pt = stripDashes(parsed.titulo_pt);
  parsed.intro_pt = stripDashes(parsed.intro_pt);
  parsed.corpo_pt = stripDashes(parsed.corpo_pt);

  // Garante que intro_pt cabe no card sem quebrar layout (~2 linhas no card).
  // Se o LLM gerou prosa longa, trunca no boundary de palavra + "..." limpo.
  parsed.intro_pt = truncateAtWord(parsed.intro_pt, 140);

  parsed.tags = parsed.tags.filter((t) => VALID_TAGS.has(t)).slice(0, 3);
  if (parsed.tags.length === 0) parsed.tags = ["memoria"];

  return parsed;
}

// Dispatcher: carrega o backend selecionado.
export async function loadCurator(name) {
  switch ((name || "").toLowerCase()) {
    case "anthropic":
    case "claude":
      return import("./anthropic.mjs");
    case "gemini":
    case "google":
      return import("./gemini.mjs");
    case "routine":
    case "manual":
      return import("./routine.mjs");
    default:
      throw new Error(`curator desconhecido: '${name}'. Use: anthropic | gemini | routine`);
  }
}
