// Selecao das noticias do reel semanal + atribuicao de formato de cena,
// seguindo a programacao editorial do design aprovado (MOTION-SPEC):
//   - abre com bloco CINETICO (a manchete mais forte da semana)
//   - digests/spotlights da comunidade viram bloco PAPEL (max 2)
//   - item sem foto vira CINETICO (fundo e clipe/fantasma, nunca foto)
//   - o resto vira CARD, intercalado pra nao repetir formato em sequencia
//
// Janela por fetchedAt (entrada no pipeline), igual ao story-select.

import fs from "node:fs/promises";
import path from "node:path";

const INDEX_PATH = path.resolve("media/news/index.json");

const COMMUNITY_KINDS = new Set(["community-spotlight", "community-digest"]);
const STRONG_TAGS = new Set(["turne", "lancamento", "br"]);

function itemTimestamp(it) {
  return new Date(it.fetchedAt || it.pubDate || 0).getTime();
}

async function hasUsableImg(it) {
  if (!it.img || typeof it.img !== "string") return false;
  if (/^https?:/.test(it.img)) return true;
  try {
    const st = await fs.stat(path.join(process.cwd(), it.img.replace(/^\//, "")));
    return st.isFile() && st.size > 1024;
  } catch {
    return false;
  }
}

// Forca da manchete pro slot de abertura: tag forte > recencia.
function openerScore(it) {
  const tags = Array.isArray(it.tags) ? it.tags : [];
  return (tags.some((t) => STRONG_TAGS.has(t)) ? 1e15 : 0) + itemTimestamp(it);
}

// Intercala cards com papeis/cineticos extras evitando formatos iguais
// adjacentes (cards sao a "liga" entre os formatos especiais).
function interleave(opener, cards, papers, kinetics) {
  const specials = [];
  const maxLen = Math.max(papers.length, kinetics.length);
  for (let i = 0; i < maxLen; i++) {
    if (papers[i]) specials.push(papers[i]);
    if (kinetics[i]) specials.push(kinetics[i]);
  }
  const out = [opener];
  const c = [...cards];
  const s = [...specials];
  // padrao alvo: kinetic, card, special, card, special, card... cards sobram no fim
  while (c.length || s.length) {
    if (c.length) out.push(c.shift());
    if (s.length) out.push(s.shift());
  }
  return out;
}

export async function selectReelItems({ now = Date.now(), days = 7, max = 8, min = 3, indexPath = INDEX_PATH } = {}) {
  const doc = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const recent = (doc.items || []).filter((it) => itemTimestamp(it) >= cutoff);
  recent.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));

  // dedupe por id + cap de 2 itens de comunidade (papel aparece no maximo 2x)
  const seen = new Set();
  const regulars = [];
  const community = [];
  for (const it of recent) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    if (COMMUNITY_KINDS.has(it.kind)) {
      if (community.length < 2) community.push(it);
    } else {
      regulars.push(it);
    }
  }

  // corta pro orcamento de slots, comunidade ja capada
  const budgetRegulars = regulars.slice(0, max - community.length);
  const all = [...budgetRegulars, ...community];
  if (all.length < min) return [];

  // abertura: a manchete regular mais forte (fallback: qualquer uma)
  const openerPool = budgetRegulars.length ? budgetRegulars : all;
  const opener = [...openerPool].sort((a, b) => openerScore(b) - openerScore(a))[0];

  const cards = [];
  const kinetics = [];
  for (const it of all) {
    if (it.id === opener.id) continue;
    if (COMMUNITY_KINDS.has(it.kind)) continue; // papel, tratado abaixo
    if (await hasUsableImg(it)) cards.push(it);
    else kinetics.push(it); // sem foto: fundo clipe/fantasma
  }

  const ordered = interleave(opener, cards, community, kinetics);
  return Promise.all(ordered.map(async (it) => ({
    ...it,
    format: it.id === opener.id || (!COMMUNITY_KINDS.has(it.kind) && kinetics.includes(it))
      ? "kinetic"
      : COMMUNITY_KINDS.has(it.kind) ? "paper" : "card",
    hasImg: await hasUsableImg(it),
  })));
}

// CLI util: node reel-select.mjs [days] [max]
if (process.argv[1]?.endsWith("reel-select.mjs")) {
  const days = process.argv[2] ? parseInt(process.argv[2], 10) : 7;
  const max = process.argv[3] ? parseInt(process.argv[3], 10) : 8;
  selectReelItems({ days, max }).then((items) => {
    console.log(`[reel-select] ${items.length} items (ultimos ${days}d, max ${max})`);
    items.forEach((it, i) => {
      console.log(`  ${i + 1}. [${it.format}${it.hasImg ? "" : " sem-foto"}] ${it.id} - ${(it.title_pt || "").slice(0, 60)}`);
    });
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
