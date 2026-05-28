// Dedupe contra historico postado/pendente no IG. Diferente de dedupe.mjs
// (que compara items DENTRO de um batch de fetch), aqui comparamos cada
// item recem-curado contra o que JA esta no feed nos ultimos N dias.
//
// Caso de uso: routine sonnet cura "Eddie Vedder anuncia turne solo"
// segunda-feira. Posta. Quarta-feira a Folha publica a mesma noticia
// (texto reescrito). Routine cura, mas dedupe.mjs nao pega porque sao
// batches diferentes. SEM esse modulo, vira post duplicado no feed.
//
// Algoritmo:
//   1. Pega items da queue: postados nos ultimos `historyDays` + pendentes
//   2. Hidrata title_pt + intro_pt de cada um (le items/<id>.json se preciso)
//   3. Normaliza texto (lowercase, sem acentos/stopwords) e gera shingles 4-grams
//   4. Pra cada candidato, calcula Jaccard contra todo o historico
//   5. Se best match >= threshold (default 0.55), candidato e bloqueado
//   6. Bloqueados vao pra _skipped-similar.json (tombstone visivel)

import fs from "node:fs/promises";
import path from "node:path";

const ITEMS_DIR = path.resolve("media/news/items");
const SKIPPED_PATH = path.resolve("media/news/_skipped-similar.json");

export const DEFAULT_HISTORY_DAYS = 7;
export const DEFAULT_THRESHOLD = 0.55;
const SHINGLE_SIZE = 4;

const STOPWORDS_PT = new Set([
  "o", "a", "os", "as", "de", "do", "da", "dos", "das",
  "e", "ou", "mas", "se", "que", "como", "porque",
  "em", "no", "na", "nos", "nas", "ao", "aos", "à", "às",
  "um", "uma", "uns", "umas",
  "com", "por", "para", "pelo", "pela", "pelos", "pelas",
  "mais", "menos", "ja", "já", "só", "so", "muito", "muita",
  "este", "esta", "esse", "essa", "isso", "isto", "aquele", "aquela",
  "the", "of", "an", "and", "or", "to", "in", "on", "at", "for", "with",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 1 && !STOPWORDS_PT.has(w))
    .join(" ");
}

function shinglize(text, n = SHINGLE_SIZE) {
  const words = text.split(/\s+/).filter(Boolean);
  const shingles = new Set();
  if (words.length === 0) return shingles;
  if (words.length < n) {
    shingles.add(words.join(" "));
    return shingles;
  }
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(" "));
  }
  return shingles;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

// Le title_pt + intro_pt de um item da fila. Le items/<id>.json se
// existir (fonte de body completo); cai pro proprio item se nao achar.
async function hydrateText(item, indexById) {
  let title = "";
  let intro = "";
  // Tenta index primeiro (mais leve, ja tem em memoria)
  const idx = indexById?.get(item.id);
  if (idx) {
    title = idx.title_pt || idx.titulo_pt || "";
    intro = idx.intro_pt || "";
  }
  // Body file tem intro tambem em alguns casos (fonte mais confiavel)
  try {
    const raw = await fs.readFile(path.join(ITEMS_DIR, `${item.id}.json`), "utf8");
    const body = JSON.parse(raw);
    if (body.title_pt && !title) title = body.title_pt;
    if (body.intro_pt && !intro) intro = body.intro_pt;
  } catch {}
  return `${title} ${intro}`.trim();
}

// Resolve historico relevante (postados ultimos N dias + pendentes ainda
// na fila), retorna shingles pre-calculados pra comparacao rapida.
async function buildHistoryShingles({ queue, indexById, historyDays, nowMs }) {
  const cutoff = nowMs - historyDays * 24 * 60 * 60 * 1000;
  const relevant = (queue.items || []).filter((q) => {
    if (q.postedAt) return new Date(q.postedAt).getTime() >= cutoff;
    return true; // pendentes sempre entram
  });
  const enriched = [];
  for (const q of relevant) {
    const text = await hydrateText(q, indexById);
    if (!text) continue;
    enriched.push({
      itemId: q.id,
      postedAt: q.postedAt,
      shingles: shinglize(normalize(text)),
      textPreview: text.slice(0, 120),
    });
  }
  return enriched;
}

// Para cada candidato, acha o melhor match no historico. Se match >=
// threshold, candidato e bloqueado. Retorna:
//   { allowed: [...], blocked: [{ candidate, matchedTo, similarity, textPreview }] }
//
// `candidates`: array de items recem-curados (com .id e .title_pt/.intro_pt)
// `queue`: objeto do readQueue()
// `indexById`: Map(id -> indexItem) opcional, pra pegar title/intro sem ler arquivo
export async function checkSimilarInHistory(candidates, {
  queue,
  indexById,
  historyDays = DEFAULT_HISTORY_DAYS,
  threshold = DEFAULT_THRESHOLD,
  nowMs = Date.now(),
} = {}) {
  if (!candidates || candidates.length === 0) return { allowed: [], blocked: [] };
  const history = await buildHistoryShingles({ queue, indexById, historyDays, nowMs });
  if (history.length === 0) {
    return { allowed: candidates, blocked: [] };
  }

  const allowed = [];
  const blocked = [];

  for (const cand of candidates) {
    const candText = `${cand.title_pt || cand.titulo_pt || ""} ${cand.intro_pt || ""}`.trim();
    if (!candText) {
      allowed.push(cand);
      continue;
    }
    const candShingles = shinglize(normalize(candText));
    let best = { itemId: null, similarity: 0, textPreview: "" };
    for (const h of history) {
      if (h.itemId === cand.id) continue; // nao compara com si mesmo
      const sim = jaccard(candShingles, h.shingles);
      if (sim > best.similarity) {
        best = { itemId: h.itemId, similarity: sim, textPreview: h.textPreview, postedAt: h.postedAt };
      }
    }
    if (best.similarity >= threshold) {
      blocked.push({
        candidate: cand,
        matchedTo: best.itemId,
        matchedPostedAt: best.postedAt,
        matchedPreview: best.textPreview,
        similarity: Number(best.similarity.toFixed(3)),
      });
    } else {
      allowed.push(cand);
    }
  }

  return { allowed, blocked };
}

// Anexa os bloqueados ao tombstone _skipped-similar.json. Idempotente
// por candidate.id (nao duplica se rodar varias vezes).
export async function recordSkipped(blocked, nowIso = new Date().toISOString()) {
  if (!blocked || blocked.length === 0) return 0;
  let doc = { skipped: [], updatedAt: null };
  try {
    const raw = await fs.readFile(SKIPPED_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.skipped)) doc = parsed;
  } catch {}
  const existing = new Set(doc.skipped.map((s) => s.itemId));
  let added = 0;
  for (const b of blocked) {
    if (!b.candidate?.id || existing.has(b.candidate.id)) continue;
    doc.skipped.push({
      itemId: b.candidate.id,
      title_pt: b.candidate.title_pt || b.candidate.titulo_pt || "",
      matchedTo: b.matchedTo,
      matchedPostedAt: b.matchedPostedAt || null,
      matchedPreview: b.matchedPreview || "",
      similarity: b.similarity,
      skippedAt: nowIso,
    });
    added++;
  }
  if (added > 0) {
    doc.updatedAt = nowIso;
    await fs.writeFile(SKIPPED_PATH, JSON.stringify(doc, null, 2));
  }
  return added;
}
