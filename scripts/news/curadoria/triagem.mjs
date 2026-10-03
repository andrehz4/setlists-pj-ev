// Triagem dos itens que a routine curou: valida o formato, aplica a trava de PT-BR e monta o item do
// site a partir do _pending (url, fonte, imagem e metadados vêm de lá pelo id).
import { stripDashes } from "../curators/_shared.mjs";
import { checarPtBr, corrigirPtPt } from "../qualidade-ptbr.mjs";

const VALID_TAGS = new Set([
  "turne", "lancamento", "tenclub", "memoria", "br", "bootleg", "comunidade",
  "eddie", "mike", "stone", "jeff", "matt", "boom", "josh", "loja",
]);

// null = inválido. Tira travessão de tudo (regra absoluta do site) e corrige PT-PT.
// titulo_ig (manchete curta do card do IG) é opcional: sem ele o slide usa o titulo_pt.
export function validateCurated(c) {
  if (!c || typeof c !== "object") return null;
  if (!c.id || typeof c.id !== "string") return null;
  if (typeof c.titulo_pt !== "string" || !c.titulo_pt.trim() || c.titulo_pt.length > 90) return null;
  if (typeof c.intro_pt !== "string" || !c.intro_pt.trim()) return null;
  if (typeof c.corpo_pt !== "string" || c.corpo_pt.length < 100) return null;
  const tags = Array.isArray(c.tags) ? c.tags.filter((t) => VALID_TAGS.has(t)).slice(0, 3) : [];
  const tituloIg = (typeof c.titulo_ig === "string" && c.titulo_ig.trim()) ? stripDashes(c.titulo_ig.trim()).slice(0, 90) : null;
  return {
    id: c.id,
    titulo_pt: corrigirPtPt(stripDashes(c.titulo_pt)),
    titulo_ig: tituloIg ? corrigirPtPt(tituloIg) : null,
    intro_pt: corrigirPtPt(stripDashes(c.intro_pt)),
    corpo_pt: corrigirPtPt(stripDashes(c.corpo_pt)),
    tags: tags.length ? tags : ["memoria"],
  };
}

// Campos opcionais do pendente que seguem pro site (community-* têm autor, link e score do post).
const EXTRAS = ["kind", "community_author", "community_post_url", "community_post_score", "community_posts_count"];

function montarItem(p, v) {
  const item = {
    id: p.id,
    url: p.url,
    source: p.source,
    sourceLabel: p.sourceLabel,
    group: p.group,
    pubDate: p.pubDate,
    fetchedAt: new Date().toISOString(),
    img: p.img,
    title_pt: v.titulo_pt,
    intro_pt: v.intro_pt,
    body_pt: v.corpo_pt,
    tags: v.tags,
  };
  if (v.titulo_ig) item.title_ig = v.titulo_ig; // sem chave null no index
  for (const k of EXTRAS) if (p[k] != null && p[k] !== "") item[k] = p[k];
  return item;
}

// Muta `seen` (aceitos). Recusado pela trava NÃO entra em acceptedIds: fica no _pending pra próxima rodada.
export function triar(curatedInput, pendingById, seen) {
  const newItems = [];
  const acceptedIds = new Set();
  const warnings = [];
  const rejected = []; // tombstone de auditoria
  const agora = () => new Date().toISOString();
  for (const c of curatedInput) {
    const v = validateCurated(c);
    if (!v) {
      console.warn(`[merge] invalido (skip): ${c?.id || "?"}`);
      warnings.push(`Item invalido ignorado: id="${c?.id || "?"}" (titulo ausente, muito longo ou corpo curto demais)`);
      rejected.push({ id: c?.id || null, reason: "validacao falhou (titulo ausente/longo ou corpo < 100)", at: agora() });
      continue;
    }
    const qualidade = checarPtBr(v);
    if (qualidade.bloqueios.length) {
      const motivo = `trava de qualidade: ${qualidade.bloqueios.join("; ")}`;
      console.warn(`[merge] RECUSADO ${v.id}: ${motivo}`);
      warnings.push(`RECUSADO ${v.id} ("${v.titulo_pt.slice(0, 60)}"): ${motivo}. Volta pro _pending.`);
      rejected.push({ id: v.id, titulo: v.titulo_pt, reason: motivo, at: agora() });
      continue;
    }
    for (const a of qualidade.avisos) warnings.push(`aviso ${v.id}: ${a}`);
    const p = pendingById.get(v.id);
    if (!p) {
      console.warn(`[merge] id ${v.id} nao esta em _pending.json (skip)`);
      warnings.push(`ID ${v.id} nao encontrado em _pending.json (skip)`);
      continue;
    }
    newItems.push(montarItem(p, v));
    acceptedIds.add(p.id);
    seen[p.id] = { firstSeen: Date.now(), title: p.title_orig || v.titulo_pt };
  }
  return { newItems, acceptedIds, warnings, rejected };
}
