// Fila de publicação do Show da Semana pela API (media/show-da-semana/_fila.json, versionada).
// Montada da agenda.json + fichas; #1 a #10 já estão no Business Suite e entram marcados pra nunca duplicar.
import path from "node:path";
import { BRT_OFFSET_MS } from "../../lib/brt.mjs";
import { validar } from "./ficha.mjs";

export const ARQ_FILA = "media/show-da-semana/_fila.json";
export const ARQ_AGENDA = "media/show-da-semana/agenda.json";
export const ULTIMO_BUSINESS_SUITE = 10;
export const HASHTAGS_POR_POST = 4;

export const caminhoFila = (raiz) => path.join(raiz, ARQ_FILA);
export const validaFila = (d) => (d && Array.isArray(d.posts) ? null : "_fila.json sem posts[]");

// "2026-12-26 11:00" (BRT) -> ISO em UTC.
export function quandoUtc(brt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(brt || "");
  if (!m) throw new Error(`quando inválido na agenda: "${brt}" (esperado "AAAA-MM-DD HH:MM" em BRT)`);
  const [, a, mes, d, h, min] = m.map(Number);
  return new Date(Date.UTC(a, mes - 1, d, h, min) + BRT_OFFSET_MS).toISOString();
}

// Junta a agenda com a fila que já existe. Nunca apaga o que já foi postado ou enviado pro R2;
// só atualiza data e id de quem ainda não saiu (a agenda pode ser remarcada).
export function montarFila(agenda, filaAtual = { posts: [] }) {
  const atual = new Map(filaAtual.posts.map((p) => [p.n, p]));
  const posts = agenda.posts.map((a) => {
    const velho = atual.get(a.n) || {};
    const base = { n: a.n, id: a.id, quando: quandoUtc(a.quando), canal: a.n <= ULTIMO_BUSINESS_SUITE ? "business-suite" : "api" };
    if (velho.postedAt) return { ...base, ...velho };
    if (velho.id && velho.id !== a.id) return { ...base, urls: [], postedAt: null }; // trocou o show: refaz os slides
    return { urls: [], postedAt: null, ...velho, ...base };
  });
  return { regra: "Gerada por fila.mjs a partir da agenda.json. urls = slides no R2 (subir.mjs).", posts };
}

// Primeiro post da API maduro e não publicado (ou o primeiro pendente, com force).
export function proximoDaVez(fila, agora = new Date(), { force = false } = {}) {
  const pend = fila.posts.filter((p) => p.canal === "api" && !p.postedAt).sort((a, b) => a.n - b.n);
  return force ? pend[0] || null : pend.find((p) => new Date(p.quando) <= agora) || null;
}

// Mesma régua da checagem que era feita no navegador. Lista vazia = pode publicar.
export function checarPost(post, ficha) {
  const e = [];
  if (!ficha) return [`ficha ${post.id} não encontrada`];
  if (ficha.id !== post.id) e.push(`ficha ${ficha.id} não bate com o post ${post.id}`);
  if (ficha.numero !== post.n) e.push(`ficha é o Show #${ficha.numero}, a agenda diz #${post.n}`);
  e.push(...validar(ficha, { paraPublicar: true }));
  const leg = ficha.legenda || "";
  if (!leg.startsWith(`Show #${post.n} da série`)) e.push(`legenda não começa com "Show #${post.n} da série"`);
  const segue = (leg.match(/Segue a gente/g) || []).length;
  if (segue !== 1) e.push(`legenda tem ${segue} "Segue a gente" (precisa de 1)`);
  const tags = leg.match(/#[\p{L}\p{N}_]+/gu)?.filter((t) => !/^#\d+$/.test(t)) || [];
  if (tags.length !== HASHTAGS_POR_POST) e.push(`legenda tem ${tags.length} hashtags (precisa de ${HASHTAGS_POR_POST})`);
  if (!Array.isArray(post.urls) || post.urls.length !== 4) e.push("sem os 4 slides no R2 (rodar subir.mjs no Mac)");
  else if (post.urls.some((u) => !/^https:\/\/\S+\.jpe?g$/i.test(u))) e.push("link de slide inválido");
  return e;
}

// Primeira linha da legenda: é como a recuperação acha o post no IG depois de um falso-erro.
export const assinatura = (legenda) => (legenda || "").split("\n")[0].trim();
