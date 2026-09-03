// Smoke test do Facebook Pages: valida o Page Token e publica UM item de TESTE
// na Pagina, pra conferir permissoes e o visual antes de ligar em producao.
// Usa o MESMO codigo de producao (facebook.mjs) e midia estavel do repo.
//
// Modos:
//   node scripts/publish/fb-smoke.mjs            -> feed (album de 3 fotos)
//   node scripts/publish/fb-smoke.mjs --story    -> video story
//   node scripts/publish/fb-smoke.mjs --reel     -> video reel
//   node scripts/publish/fb-smoke.mjs --delete <postId>  -> apaga um post de teste
//
// Precisa dos secrets no env (roda no CI via fb-smoke.yml).

import got from "got";
import {
  uploadUnpublishedPhoto, createFeedPost, publishVideoStory, publishVideoReel,
} from "./facebook.mjs";

const FB_API_BASE = process.env.FB_API_BASE || "https://graph.facebook.com/v21.0";
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Midia estavel, versionada no repo (existe sempre no raw.githubusercontent).
const TEST_IMAGES = [
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-1.jpg`,
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-2.jpg`,
  `${REPO_PUBLIC_BASE}/media/news/img/_band-fallback-3.jpg`,
];
const TEST_STORY_MP4 = `${REPO_PUBLIC_BASE}/media/news/instagram-stories/2026-09-02.mp4`;
const TEST_REEL_MP4 = `${REPO_PUBLIC_BASE}/media/news/instagram-reels/2026-W35.mp4`;

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

  // modo delete
  const delIdx = process.argv.indexOf("--delete");
  if (delIdx >= 0) {
    const postId = process.argv[delIdx + 1];
    if (!postId) { console.error("uso: --delete <postId>"); process.exit(2); }
    const r = await deletePost(postId, pageToken);
    console.log(`[fb-smoke] delete ${postId}: status=${r.status} ${JSON.stringify(r.body)}`);
    process.exit(r.status < 400 ? 0 : 1);
  }

  const mode = process.argv.includes("--reel") ? "reel"
    : process.argv.includes("--story") ? "story" : "feed";
  console.log(`[fb-smoke] FB_PAGE_ID = ${pageId} | modo = ${mode}`);

  // 1. valida o Page Token e a identidade da Pagina
  console.log("[teste 1/2] GET /me (valida Page Token)...");
  const me = await validateToken(pageToken);
  console.log(`  ✓ OK: name="${me.name}", category=${me.category}, id=${me.id}`);
  if (me.id !== pageId) {
    console.warn(`  ⚠ ATENCAO: id do token (${me.id}) != FB_PAGE_ID (${pageId}). Corrigir o secret FB_PAGE_ID.`);
  }
  console.log("");

  // 2. publica o item de teste (mesmo caminho de codigo de producao)
  let postId;
  if (mode === "feed") {
    console.log("[teste 2/2] publicando album de TESTE (3 fotos)...");
    const fbids = [];
    for (const url of TEST_IMAGES) {
      fbids.push(await uploadUnpublishedPhoto({ pageId, pageToken, imageUrl: url }));
    }
    postId = await createFeedPost({
      pageId, pageToken,
      message: "[TESTE] Publicacao de teste do @smufdpj no Facebook (album). Pode apagar.",
      mediaFbids: fbids,
    });
  } else if (mode === "story") {
    console.log("[teste 2/2] publicando STORY de TESTE (video)...");
    const r = await publishVideoStory({ videoUrl: TEST_STORY_MP4, pageId, pageToken });
    postId = r.postId;
  } else {
    console.log("[teste 2/2] publicando REEL de TESTE (video)...");
    const r = await publishVideoReel({
      videoUrl: TEST_REEL_MP4,
      description: "[TESTE] Reel de teste do @smufdpj no Facebook. Pode apagar. #pearljam",
      pageId, pageToken,
    });
    postId = r.postId;
  }

  console.log(`  ✓ OK: postId=${postId}`);
  console.log(`  URL: https://www.facebook.com/${postId}`);
  console.log("");
  console.log(`[fb-smoke] TUDO PASSOU (${mode}). Confira na Pagina.`);
  if (mode === "story") {
    console.log("  (story expira sozinho em 24h; nao precisa apagar)");
  } else {
    console.log(`  Pra apagar: dispare o workflow fb-smoke com delete_post_id=${postId}`);
  }
}

main().catch((e) => {
  console.error("[fb-smoke] FATAL:", e.toDetailString ? e.toDetailString() : (e.message || e));
  process.exit(1);
});
