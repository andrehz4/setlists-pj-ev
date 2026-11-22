// Números dos posts da @smufdpj pela API oficial (só leitura): alcance, views, seguidores ganhos, compartilhamentos etc.
// Pra entender o que converte seguidor. Roda no workflow manual ig-insights.yml (token só existe nos Secrets).
// Saída: JSON no log, um objeto por post, do mais novo pro mais velho.
import { GRAPH_IG } from "../config.mjs";

const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
const QUANTOS = Number(process.argv[2] || 60);
if (!IG_USER_ID || !IG_ACCESS_TOKEN) throw new Error("faltam IG_USER_ID / IG_ACCESS_TOKEN");
const get = async (p, q) => {
  const u = new URL(`${GRAPH_IG}/${p}`);
  for (const [k, v] of Object.entries({ ...q, access_token: IG_ACCESS_TOKEN })) u.searchParams.set(k, v);
  const r = await fetch(u); const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
};
// Cada métrica separada: a API recusa o pedido inteiro se uma não vale pro tipo de post
const METRICAS = ["reach", "views", "follows", "profile_visits", "shares", "saved", "likes", "comments", "total_interactions", "ig_reels_avg_watch_time"];

const posts = [];
let pag = await get(`${IG_USER_ID}/media`, { fields: "id,media_type,media_product_type,timestamp,caption,permalink", limit: 50 });
while (posts.length < QUANTOS) {
  posts.push(...pag.data);
  if (!pag.paging?.next) break;
  const r = await fetch(pag.paging.next); pag = await r.json();
}
const saida = [];
for (const p of posts.slice(0, QUANTOS)) {
  const m = {};
  for (const met of METRICAS) {
    try { const j = await get(`${p.id}/insights`, { metric: met }); m[met] = j.data?.[0]?.values?.[0]?.value ?? j.data?.[0]?.total_value?.value ?? null; }
    catch { m[met] = "n/a"; }
  }
  const dt = new Date(p.timestamp);
  saida.push({ quando: dt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    tipo: p.media_product_type === "REELS" ? "REEL" : p.media_type, inicio: (p.caption || "").split("\n")[0].slice(0, 90), link: p.permalink, ...m });
}
const conta = await get(IG_USER_ID, { fields: "followers_count,media_count" });
// Seguidores ganhos por dia (a API só guarda os últimos 30 dias)
let porDia = null;
try {
  const ate = Math.floor(Date.now() / 1000), desde = ate - 29 * 86400;
  const j = await get(`${IG_USER_ID}/insights`, { metric: "follower_count", period: "day", since: desde, until: ate });
  porDia = (j.data?.[0]?.values || []).map((v) => [v.end_time.slice(0, 10), v.value]);
} catch (e) { porDia = "n/a: " + e.message; }
console.log(JSON.stringify({ conta, porDia, posts: saida }));
