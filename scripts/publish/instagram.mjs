// Cliente do Instagram Graph API (fluxo "Instagram with Instagram Login",
// endpoint graph.instagram.com). Publica carrossel de ate 10 slides numa
// chamada de 3 etapas:
//   1. cria container por slide (POST /<IG_USER_ID>/media, is_carousel_item=true)
//   2. cria container do carrossel (media_type=CAROUSEL, children=ids)
//   3. publica (POST /<IG_USER_ID>/media_publish, creation_id)
//
// Env esperado:
//   IG_USER_ID, IG_ACCESS_TOKEN
//   (REPO_PUBLIC_BASE opcional, default raw.githubusercontent.com/andrehz4/setlists-pj-ev/main)

import got from "got";

const API_BASE = "https://graph.instagram.com/v21.0";
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

const HASHTAGS_FIXED = ["pearljam", "eddievedder", "pjbrasil", "grunge", "smufdpj"];
const IG_CAPTION_MAX = 2200;

function slideUrlFor(itemId) {
  return `${REPO_PUBLIC_BASE}/media/news/instagram-slides/${encodeURIComponent(itemId)}.jpg`;
}

function dedupeTags(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const norm = String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

function buildSingleCaption(item) {
  const lines = [];
  lines.push(item.title_pt || "");
  if (item.intro_pt) lines.push("", item.intro_pt);
  if (item.sourceLabel) lines.push("", `via ${item.sourceLabel}`);
  const tags = dedupeTags([...HASHTAGS_FIXED, ...(item.tags || [])]);
  lines.push("", tags.map((t) => `#${t}`).join(" "));
  return lines.join("\n");
}

function buildCarouselCaption(items) {
  // Caption do carrossel: lista numerada com titulos + assinatura + hashtags.
  // Se for 1 item, usa o caption single (mais expressivo).
  if (items.length === 1) return buildSingleCaption(items[0]);

  const lines = [];
  lines.push("DESTAQUES DA EDIÇÃO");
  lines.push("");
  items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.title_pt}`);
  });
  lines.push("");
  lines.push("arquivo completo em setlists-pj-ev.pages.dev");
  lines.push("");
  const allTags = dedupeTags([
    ...HASHTAGS_FIXED,
    ...items.flatMap((it) => Array.isArray(it.tags) ? it.tags : []),
  ]);
  lines.push(allTags.map((t) => `#${t}`).join(" "));

  let caption = lines.join("\n");
  if (caption.length > IG_CAPTION_MAX) {
    // corta hashtags primeiro se passar do limite
    const head = lines.slice(0, -1).join("\n");
    caption = head.slice(0, IG_CAPTION_MAX - 20) + "...";
  }
  return caption;
}

async function postIG(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await got.post(url, {
    form: body,
    timeout: { request: 30000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  if (res.statusCode >= 400) {
    const errMsg = res.body?.error?.message || `HTTP ${res.statusCode}`;
    throw new Error(`IG API ${path}: ${errMsg}`);
  }
  return res.body;
}

export async function createSlideContainer({ igUserId, accessToken, imageUrl }) {
  const r = await postIG(`/${igUserId}/media`, {
    image_url: imageUrl,
    is_carousel_item: "true",
    access_token: accessToken,
  });
  if (!r.id) throw new Error("createSlideContainer: sem id na resposta");
  return r.id;
}

export async function createCarouselContainer({ igUserId, accessToken, childrenIds, caption }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    caption,
    access_token: accessToken,
  });
  if (!r.id) throw new Error("createCarouselContainer: sem id na resposta");
  return r.id;
}

export async function createSingleImageContainer({ igUserId, accessToken, imageUrl, caption }) {
  const r = await postIG(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  if (!r.id) throw new Error("createSingleImageContainer: sem id na resposta");
  return r.id;
}

export async function publishContainer({ igUserId, accessToken, creationId }) {
  const r = await postIG(`/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  });
  if (!r.id) throw new Error("publishContainer: sem id na resposta");
  return r.id;
}

// Helper completo: dado um array de items (cada um com .id), pega URLs
// dos slides (que assumimos ja terem sido pushados pro repo) e publica
// como carrossel (ou single image se for 1 item).
export async function publishItems(items, { igUserId, accessToken } = {}) {
  if (!items || items.length === 0) throw new Error("publishItems: items vazio");
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("publishItems: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios");
  }

  if (items.length === 1) {
    const it = items[0];
    const caption = buildSingleCaption(it);
    const containerId = await createSingleImageContainer({
      igUserId, accessToken,
      imageUrl: slideUrlFor(it.id),
      caption,
    });
    // pequena pausa pra IG processar a imagem antes do publish
    await new Promise((r) => setTimeout(r, 4000));
    const postId = await publishContainer({ igUserId, accessToken, creationId: containerId });
    return { postId, count: 1, captionLen: caption.length };
  }

  if (items.length > 10) {
    throw new Error(`publishItems: carrossel suporta max 10 slides, recebido ${items.length}`);
  }

  const childrenIds = [];
  for (const it of items) {
    const id = await createSlideContainer({
      igUserId, accessToken,
      imageUrl: slideUrlFor(it.id),
    });
    childrenIds.push(id);
    await new Promise((r) => setTimeout(r, 500));
  }
  const caption = buildCarouselCaption(items);
  const carouselId = await createCarouselContainer({
    igUserId, accessToken, childrenIds, caption,
  });
  await new Promise((r) => setTimeout(r, 6000));
  const postId = await publishContainer({ igUserId, accessToken, creationId: carouselId });
  return { postId, count: items.length, captionLen: caption.length };
}

export { buildSingleCaption, buildCarouselCaption, slideUrlFor };
