// Fonte: posts das contas OFICIAIS no Instagram (@pearljam, @eddievedder), lidos pela API
// oficial da Meta (Business Discovery, via a página "Só mais um Fã de PJ" vinculada à
// @smufdpj). Nada de navegador nem scraping. Desligado sem o secret IG_LEITURA_TOKEN.
// Só entra a LEGENDA como matéria-prima: a foto deles não é republicada (direito autoral);
// a curadoria escreve matéria original em PT-BR e a imagem vem do nosso acervo.
const API = "https://graph.facebook.com/v21.0";
const ID_PADRAO = "17841414148425536"; // @smufdpj vista pela Graph do Facebook (não é segredo)
const DIAS = 7; // só posts recentes

// Primeira frase/linha da legenda vira o título bruto (a curadoria reescreve).
export function tituloDaLegenda(legenda = "", conta = "") {
  const linha = String(legenda).split("\n").map((l) => l.trim()).find((l) => l.replace(/[^\p{L}\p{N}]/gu, "").length >= 3) || "";
  const curta = linha.length > 110 ? `${linha.slice(0, 107).replace(/\s+\S*$/, "")}...` : linha;
  return curta || `Novo post de @${conta}`;
}

// Post da API -> item no formato dos coletores (fetch-news.mjs).
export function itemDoPost(m, src, conta) {
  const legenda = (m.caption || "").trim();
  return {
    sourceId: src.id, sourceLabel: src.label, group: src.group,
    title: tituloDaLegenda(legenda, conta),
    link: m.permalink, pubDate: m.timestamp, snippet: legenda.slice(0, 800),
    alwaysRelevant: true, kind: "instagram-oficial",
    preText: `Post oficial de @${conta} no Instagram (${m.media_type || "post"}), ${m.timestamp}.\n\nLegenda original:\n${legenda}`,
    preImg: null,
  };
}

export function recentes(posts, agora = Date.now(), dias = DIAS) {
  return posts.filter((m) => m.permalink && agora - Date.parse(m.timestamp) <= dias * 864e5);
}

export async function fetchIgOficialItems(src, { env = process.env, fetchImpl = fetch } = {}) {
  const token = env.IG_LEITURA_TOKEN;
  if (!token) return { items: [], error: null }; // desligado: sem secret
  const conta = src.conta;
  const campos = `business_discovery.username(${conta}){media.limit(12){caption,timestamp,permalink,media_type}}`;
  const url = `${API}/${env.IG_LEITURA_ID || ID_PADRAO}?fields=${encodeURIComponent(campos)}&access_token=${token}`;
  try {
    const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
    const posts = j.business_discovery?.media?.data || [];
    return { items: recentes(posts).map((m) => itemDoPost(m, src, conta)), error: null };
  } catch (e) {
    console.warn(`[ig-oficial] @${conta} falhou: ${e.message.replace(token, "***")}`);
    return { items: [], error: e.message.replace(token, "***") };
  }
}
