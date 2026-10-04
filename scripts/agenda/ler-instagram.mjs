// Lê os posts públicos de uma conta do Instagram pela API oficial da Meta (Business Discovery, via a página
// "Só mais um Fã de PJ"). Só legenda, data e link: foto nunca. Mesmo token da coleta da @pearljam.
import { GRAPH_FB } from "../config.mjs";

const ID_PADRAO = "17841414148425536"; // @smufdpj vista pela Graph do Facebook (não é segredo)

export async function lerConta(conta, { n = 25, env = process.env, fetchImpl = fetch } = {}) {
  const token = env.IG_LEITURA_TOKEN;
  if (!token) throw new Error("IG_LEITURA_TOKEN ausente");
  const campos = `business_discovery.username(${conta}){username,name,biography,followers_count,media_count,`
    + `media.limit(${n}){caption,timestamp,permalink,media_type}}`;
  const url = `${GRAPH_FB}/${env.IG_LEITURA_ID || ID_PADRAO}?fields=${encodeURIComponent(campos)}&access_token=${token}`;
  const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`@${conta}: ${(j.error?.message || `HTTP ${r.status}`).replace(token, "***")}`);
  const bd = j.business_discovery || {};
  return {
    conta: bd.username, nome: bd.name, seguidores: bd.followers_count,
    posts: (bd.media?.data || []).map((m) => ({ data: m.timestamp, link: m.permalink, legenda: m.caption || "" })),
  };
}
