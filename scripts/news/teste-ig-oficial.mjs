// TESTE (só leitura): dá pra ler os posts públicos da @pearljam pela API oficial (Business
// Discovery)? Tenta pelo token do Instagram e pelo token da página do Facebook. Nunca imprime token.
//   node scripts/news/teste-ig-oficial.mjs   (precisa IG_USER_ID, IG_ACCESS_TOKEN, FB_PAGE_ID, FB_PAGE_TOKEN)
const ALVO = process.env.IG_ALVO || "pearljam";
const CAMPOS = `business_discovery.username(${ALVO}){username,name,followers_count,media_count,media.limit(5){caption,timestamp,permalink,media_type}}`;

async function get(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
function mostrar(rotulo, res) {
  if (!res.ok) { console.log(`[${rotulo}] FALHOU ${res.status}: ${res.j?.error?.message || JSON.stringify(res.j).slice(0, 200)}`); return false; }
  const bd = res.j.business_discovery;
  if (!bd) { console.log(`[${rotulo}] sem business_discovery na resposta`); return false; }
  console.log(`[${rotulo}] OK: @${bd.username} (${bd.name}), ${bd.followers_count} seguidores, ${bd.media_count} posts`);
  for (const m of bd.media?.data || []) console.log(`  - ${m.timestamp} ${m.media_type} ${m.permalink} | ${(m.caption || "").replace(/\s+/g, " ").slice(0, 120)}`);
  return true;
}

const e = process.env;
let algum = false;
if (e.IG_USER_ID && e.IG_ACCESS_TOKEN) {
  const u = `https://graph.instagram.com/v21.0/${e.IG_USER_ID}?fields=${encodeURIComponent(CAMPOS)}&access_token=${e.IG_ACCESS_TOKEN}`;
  algum = mostrar("token do Instagram", await get(u)) || algum;
} else console.log("[token do Instagram] sem secrets");
if (e.FB_PAGE_ID && e.FB_PAGE_TOKEN) {
  const p = await get(`https://graph.facebook.com/v21.0/${e.FB_PAGE_ID}?fields=instagram_business_account&access_token=${e.FB_PAGE_TOKEN}`);
  const igId = p.j?.instagram_business_account?.id;
  if (!igId) console.log(`[token do Facebook] página sem Instagram vinculado (${p.status}: ${p.j?.error?.message || "sem instagram_business_account"})`);
  else algum = mostrar("token do Facebook", await get(`https://graph.facebook.com/v21.0/${igId}?fields=${encodeURIComponent(CAMPOS)}&access_token=${e.FB_PAGE_TOKEN}`)) || algum;
} else console.log("[token do Facebook] sem secrets");
console.log(algum ? "RESULTADO: funciona" : "RESULTADO: não funcionou por nenhum caminho");
