// POC da agenda de bandas cover: lê os posts públicos de uma conta do Instagram pela API oficial da
// Meta (Business Discovery, mesmo token da coleta da @pearljam) e imprime legenda, data e link.
// Só leitura, só texto (foto nunca). Uso: IG_LEITURA_TOKEN=... node scripts/agenda/poc-ig.mjs <conta> [n]
import { GRAPH_FB } from "../config.mjs";

const ID_PADRAO = "17841414148425536"; // @smufdpj vista pela Graph do Facebook (não é segredo)
const conta = (process.argv[2] || "").replace(/^@/, "");
const n = Math.min(Number(process.argv[3]) || 25, 50);
const token = process.env.IG_LEITURA_TOKEN;
if (!conta || !token) {
  console.error("uso: IG_LEITURA_TOKEN=... node scripts/agenda/poc-ig.mjs <conta> [n]");
  process.exit(2);
}

const campos = `business_discovery.username(${conta}){username,name,biography,followers_count,media_count,`
  + `media.limit(${n}){caption,timestamp,permalink,media_type}}`;
const url = `${GRAPH_FB}/${process.env.IG_LEITURA_ID || ID_PADRAO}?fields=${encodeURIComponent(campos)}&access_token=${token}`;
const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
const j = await r.json();
if (!r.ok || j.error) {
  console.error(`[agenda-poc] @${conta} falhou: ${(j.error?.message || `HTTP ${r.status}`).replace(token, "***")}`);
  process.exit(1);
}
const bd = j.business_discovery;
console.log(JSON.stringify({
  conta: bd.username, nome: bd.name, bio: bd.biography, seguidores: bd.followers_count, posts: bd.media_count,
  ultimos: (bd.media?.data || []).map((m) => ({ data: m.timestamp, tipo: m.media_type, link: m.permalink, legenda: m.caption || "" })),
}, null, 2));
