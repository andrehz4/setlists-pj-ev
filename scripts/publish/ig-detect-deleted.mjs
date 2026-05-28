// Detecta posts apagados do Instagram via GET /<post-id>?fields=id.
// Quando Andre apaga um post no app, o ID do media some. Esse modulo
// varre items postados nos ultimos N dias na queue, bate na IG API
// pra cada postId unico e marca os deletados pra adicao na denylist.
//
// Estrategia: bate 1 GET por postId. Cada item da queue postado tem
// um postId; items do mesmo carrossel compartilham postId. Dedupa
// antes de chamar.
//
// Rate limit: ate ~50 GETs por run nos primeiros dias (sob o limite
// de 200/hora). Pra reduzir custo de quota, da pra cachear o resultado
// "exists=true" entre runs, mas hoje preferimos correr toda vez (overhead
// baixo e simplicidade vence).

import got from "got";

const API_BASE = "https://graph.instagram.com/v21.0";
const LOOKBACK_DAYS_DEFAULT = 30;
const CONCURRENCY = 5;

// Checa se um postId ainda existe no IG. Retorna:
//   { exists: true }                       — OK, ainda no feed
//   { exists: false, reason: "deleted" }   — IG retornou erro de "nao existe"
//   { exists: null, reason: "..." }        — indeterminado (erro transitorio)
export async function checkPostExists({ postId, accessToken }) {
  if (!postId) return { exists: null, reason: "postId vazio" };
  try {
    const res = await got(`${API_BASE}/${postId}`, {
      searchParams: { fields: "id", access_token: accessToken },
      timeout: { request: 15000 },
      retry: { limit: 1 },
      throwHttpErrors: false,
      responseType: "json",
    });
    if (res.statusCode === 200 && res.body?.id) {
      return { exists: true };
    }
    if (res.statusCode === 400 || res.statusCode === 404) {
      const msg = res.body?.error?.message || "";
      const code = res.body?.error?.code;
      // Code 100 = Unknown object id, code 803 = Object does not exist,
      // ou mensagem com "does not exist" / "unsupported get request"
      if (code === 100 || code === 803 || /does not exist|unsupported get request/i.test(msg)) {
        return { exists: false, reason: "deleted" };
      }
      return { exists: null, reason: `HTTP ${res.statusCode}: ${msg}` };
    }
    return { exists: null, reason: `HTTP ${res.statusCode}` };
  } catch (e) {
    return { exists: null, reason: e.message };
  }
}

// Varre queue, pega postIds unicos dos ultimos N dias, retorna lista de
// items cujos posts foram apagados no IG. Retorna:
//   { deletedItems: [{ itemId, postId }], checked: N, indeterminate: M }
export async function detectDeletedPosts({ queue, accessToken, lookbackDays = LOOKBACK_DAYS_DEFAULT } = {}) {
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!accessToken) throw new Error("detectDeletedPosts: IG_ACCESS_TOKEN obrigatorio");

  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  // Items postados na janela com postId valido.
  const recent = (queue.items || []).filter((q) => {
    if (!q.postedAt || !q.postId) return false;
    return new Date(q.postedAt).getTime() >= cutoff;
  });

  // Agrupa por postId (carrossel = N items mesmo postId).
  const byPostId = new Map();
  for (const q of recent) {
    if (!byPostId.has(q.postId)) byPostId.set(q.postId, []);
    byPostId.get(q.postId).push(q);
  }

  const postIds = [...byPostId.keys()];
  const deletedItems = [];
  let indeterminate = 0;

  // Concurrencia limitada pra nao saturar a IG API
  for (let i = 0; i < postIds.length; i += CONCURRENCY) {
    const chunk = postIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map((pid) =>
      checkPostExists({ postId: pid, accessToken }).then((r) => ({ postId: pid, ...r }))
    ));
    for (const r of results) {
      if (r.exists === false) {
        for (const q of byPostId.get(r.postId)) {
          deletedItems.push({ itemId: q.id, postId: r.postId });
        }
      } else if (r.exists === null) {
        indeterminate++;
      }
    }
  }

  return { deletedItems, checked: postIds.length, indeterminate };
}
