// Smoke test do Facebook Pages: valida o Page Token e publica UM album de
// TESTE na Pagina (3 fotos estaveis do repo), pra conferir permissoes e o
// visual do album antes de ligar o feed em producao. Usa o MESMO codigo de
// producao (facebook.mjs). Imprime o post id + URL pra conferencia.
//
// Uso (precisa dos secrets no env, roda no CI via fb-smoke.yml):
//   FB_PAGE_ID=... FB_PAGE_TOKEN=... node scripts/publish/fb-smoke.mjs
//   node scripts/publish/fb-smoke.mjs --delete <postId>   (apaga o post de teste)

import got from "got";
import { uploadUnpublishedPhoto, createFeedPost } from "./facebook.mjs";

const FB_API_BASE = process.env.FB_API_BASE || "https://graph.facebook.com/v21.0";
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Imagens estaveis, versionadas no repo (fallback da banda). Escolhidas por
// existirem sempre no raw.githubusercontent (os slides reais sao podados).
const TEST_IMAGES = [
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-1.jpg`,
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-2.jpg`,
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-3.jpg`,
];

async function validateToken(pageToken) {
  const res = await got(`${FB_API_BASE}/me`, {
    searchParams: { fields: "id,name,category", access_token: pageToken },
    throwHttpErrors: false, responseType: "json", timeout: { request: 20000 },
  });
  if (res.statusCode >= 400) {
    throw new Error(`GET /me falhou (${res.statusCode}): ${JSON.stringify(res.body?.error || res.body)}`);
  }
  return res.body;
}

async function deletePost(postId, pageToken) {
  const res = await got.delete(`${FB_API_BASE}/${postId}`, {
    searchParams: { access_token: pageToken },
    throwHttpErrors: false, responseType: "json", timeout: { request: 20000 },
  });
  return { status: res.statusCode, body: res.body };
}

async function main() {
  const pageId = process.env.FB_PAGE_ID;
  const pageToken = process.env.FB_PAGE_TOKEN;
  if (!pageId || !pageToken) {
    console.error("FALTA: FB_PAGE_ID e FB_PAGE_TOKEN no env.");
    process.exit(2);
  }

  // modo delete: apaga um post de teste anterior
  const delIdx = process.argv.indexOf("--delete");
  if (delIdx >= 0) {
    const postId = process.argv[delIdx + 1];
    if (!postId) { console.error("uso: --delete <postId>"); process.exit(2); }
    const r = await deletePost(postId, pageToken);
    console.log(`[fb-smoke] delete ${postId}: status=${r.status} ${JSON.stringify(r.body)}`);
    process.exit(r.status < 400 ? 0 : 1);
  }

  console.log(`[fb-smoke] FB_PAGE_ID = ${pageId}`);

  // 1. valida o Page Token e a identidade da Pagina
  console.log("[teste 1/2] GET /me (valida Page Token)...");
  const me = await validateToken(pageToken);
  console.log(`  ✓ OK: name="${me.name}", category=${me.category}, id=${me.id}`);
  if (me.id !== pageId) {
    console.warn(`  ⚠ ATENCAO: id do token (${me.id}) != FB_PAGE_ID (${pageId}). Corrigir o secret FB_PAGE_ID.`);
  }
  console.log("");

  // 2. publica um album de teste (mesmo caminho de codigo do feed de producao)
  console.log("[teste 2/2] publicando album de TESTE (3 fotos)...");
  const fbids = [];
  for (const url of TEST_IMAGES) {
    const id = await uploadUnpublishedPhoto({ pageId, pageToken, imageUrl: url });
    fbids.push(id);
  }
  const message = "[TESTE] Publicacao de teste do @smufdpj no Facebook. Validando o formato de album. Pode apagar.";
  const postId = await createFeedPost({ pageId, pageToken, message, mediaFbids: fbids });
  console.log(`  ✓ OK: postId=${postId}`);
  console.log(`  URL: https://www.facebook.com/${postId}`);
  console.log("");
  console.log("[fb-smoke] TUDO PASSOU. Confira o album na Pagina. Pra apagar depois, dispare");
  console.log(`  o workflow fb-smoke com delete_post_id=${postId}, ou rode localmente:`);
  console.log(`  node scripts/publish/fb-smoke.mjs --delete ${postId}`);
}

main().catch((e) => {
  console.error("[fb-smoke] FATAL:", e.toDetailString ? e.toDetailString() : (e.message || e));
  process.exit(1);
});
