// Checa a quota do Content Publishing API do Instagram antes da run.
// Endpoint oficial: GET /<ig-user-id>/content_publishing_limit?fields=quota_usage,config
// Retorna quantos posts foram publicados na janela rolling de 24h e o teto.
//
// Usado por run-publish.mjs pra abortar a run quando quota esta saturada
// (em vez de queimar mais quota com retries que vao falhar). Tambem expoe
// um helper de "quanto tempo ate poder publicar de novo", estimado pela
// janela do oldest post nos ultimos 24h (best effort, IG nao da exatidao).

import got from "got";

const API_BASE = process.env.IG_API_BASE || "https://graph.instagram.com/v21.0";

// Margem de seguranca: se quota_total - quota_usage <= MARGIN, aborta a run
// antes mesmo de tentar. Permite Andre publicar manualmente pelo app sem
// estourar o teto.
export const QUOTA_SAFETY_MARGIN = 2;

// Retorna { usage, total, remaining, saturated } ou throws.
// `total` cai pro default 50 se o IG nao mandar config.quota_total.
export async function getContentPublishingLimit({ igUserId, accessToken } = {}) {
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("getContentPublishingLimit: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios");
  }

  const res = await got(`${API_BASE}/${igUserId}/content_publishing_limit`, {
    searchParams: {
      fields: "quota_usage,config",
      access_token: accessToken,
    },
    timeout: { request: 15000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });

  if (res.statusCode >= 400) {
    const msg = res.body?.error?.message || `HTTP ${res.statusCode}`;
    const code = res.body?.error?.code;
    const fbtrace = res.body?.error?.fbtrace_id;
    throw new Error(`content_publishing_limit falhou: ${msg} (code=${code} fbtrace=${fbtrace})`);
  }

  // A doc oficial da Meta embrulha a resposta em data[]: {"data":[{"quota_usage":N,"config":{...}}]}.
  // Aceita os dois shapes (embrulhado e plano) pra nao depender da variante do endpoint.
  const row = (Array.isArray(res.body?.data) && res.body.data[0]) || res.body || {};
  const cfg = row.config || {};
  const usage = Number.isFinite(row.quota_usage) ? row.quota_usage : 0;
  const total = Number.isFinite(cfg.quota_total) ? cfg.quota_total : 50;
  const remaining = Math.max(0, total - usage);
  const saturated = remaining <= QUOTA_SAFETY_MARGIN;
  return { usage, total, remaining, saturated };
}

// Best-effort: dado um usage/total saturado, estima quanto tempo ate
// poder publicar de novo. Como IG nao expoe o oldest post na janela,
// retornamos 60min como padrao defensivo (cliente do worker decide se
// re-roda manual antes disso).
export function estimateUnsaturationDelayMs() {
  return 60 * 60 * 1000;
}
