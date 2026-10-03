// Legendas dos posts no Instagram (e no Facebook, que usa as mesmas). Teto de 2200 caracteres.
// A fonte original NÃO entra na legenda: fica no site, quando o leitor abre o link.
import { SITE_DOMINIO } from "../../config.mjs";

const HASHTAGS_FIXED = ["pearljam", "eddievedder", "pjbrasil", "grunge", "smufdpj"];
const IG_CAPTION_MAX = 2200;
// Assinatura de redes no rodapé: viaja junto quando o post é repostado em grupos de fã.
const SOCIAL_LINE = "siga @smufdpj no Instagram e no Facebook";

// Corta o texto. Se dá pra parar no fim de uma frase, para ali sem reticências; só corta no meio
// (com "…") quando não há fim de frase razoável.
export function truncateBody(body, maxChars) {
  if (!body) return "";
  if (body.length <= maxChars) return body;
  const slice = body.slice(0, maxChars);
  let fim = -1;
  for (const m of slice.matchAll(/[.!?…]["'”’)]?(?=\s)/g)) fim = m.index + m[0].length;
  if (fim > maxChars * 0.55) return slice.slice(0, fim).trim();
  const esp = slice.lastIndexOf(" ");
  return slice.slice(0, esp > 0 ? esp : maxChars).trim().replace(/[,;:]$/, "") + "…";
}

// O Instagram não interpreta markdown: tira o "_via Fonte_" do fim e as marcas de itálico.
export function limparMarkdown(texto) {
  return String(texto || "")
    .replace(/(?:^|\n\s*\n)\s*(?:_via [^\n]*_|via [^\n.]{0,60})\s*$/i, "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/(^|[\s("“])_([^_\n]+)_(?=[\s.,;:!?)"”]|$)/g, "$1$2")
    .trim();
}

function dedupeTags(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const norm = String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

// Rodapé comum: CTA pro site, redes e hashtags (fixas + tags dos itens).
function rodape(items) {
  const hashtags = dedupeTags([...HASHTAGS_FIXED, ...items.flatMap((it) => (Array.isArray(it.tags) ? it.tags : []))])
    .map((t) => `#${t}`).join(" ");
  return `\n\nleia completo em ${SITE_DOMINIO}\n${SOCIAL_LINE}\n\n${hashtags}`;
}

const limitar = (c) => (c.length > IG_CAPTION_MAX ? c.slice(0, IG_CAPTION_MAX - 3) + "..." : c);

// Post solo: título + intro + o máximo do corpo que couber.
export function buildSingleCaption(item) {
  const tail = rodape([{ tags: item.tags || [] }]);
  const budget = IG_CAPTION_MAX - tail.length - 8;
  let caption = item.title_pt || "";
  if (item.intro_pt) caption += `\n\n${item.intro_pt}`;
  if (item.body_pt) {
    const bodyBudget = budget - caption.length - 2;
    if (bodyBudget > 120) {
      const body = truncateBody(limparMarkdown(item.body_pt), bodyBudget);
      if (body) caption += `\n\n${body}`;
    }
  }
  return caption + tail;
}

// Carrossel: índice numerado com a intro curta de cada item (o corpo inteiro não cabe pra vários).
export function buildCarouselCaption(items) {
  if (items.length === 1) return buildSingleCaption(items[0]);
  const tail = rodape(items);
  const budget = IG_CAPTION_MAX - tail.length - 30;
  const header = `DESTAQUES DA EDIÇÃO\n\n`;
  const perItemBudget = Math.floor((budget - header.length) / items.length);
  let body = "";
  items.forEach((it, i) => {
    let intro = it.intro_pt || "";
    const entryHead = `${i + 1}. ${it.title_pt || ""}\n`;
    const remaining = perItemBudget - entryHead.length - 2;
    if (intro.length > remaining && remaining > 40) intro = truncateBody(intro, remaining);
    else if (remaining <= 40) intro = "";
    body += entryHead + (intro ? `${intro}\n\n` : "\n");
  });
  return limitar(header + body.trim() + tail);
}

// Reel semanal: cabeçalho + índice das manchetes. Sem crédito de ferramenta (decisão do Andre, 2026-10-01).
export function buildReelCaption(items, { weekLabel = "" } = {}) {
  const tail = rodape(items);
  const header = `RESUMÃO DA SEMANA${weekLabel ? ` · ${weekLabel}` : ""}\n\n`;
  const perItem = Math.floor((IG_CAPTION_MAX - tail.length - header.length - 16) / items.length);
  let body = "";
  items.forEach((it, i) => {
    let line = `${i + 1}. ${it.title_pt || ""}`;
    if (line.length > perItem && perItem > 30) line = truncateBody(line, perItem);
    body += line + "\n";
  });
  return limitar(header + body.trim() + tail);
}
