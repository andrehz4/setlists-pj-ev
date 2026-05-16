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
const SITE_URL = "setlists-pj-ev.pages.dev";

// Trunca body preservando o ultimo paragrafo/frase completa antes do
// limite. Evita cortar palavra no meio.
function truncateBody(body, maxChars) {
  if (!body) return "";
  if (body.length <= maxChars) return body;
  const slice = body.slice(0, maxChars);
  const lastBreak = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
  );
  if (lastBreak > maxChars * 0.55) {
    return slice.slice(0, lastBreak + 1).trim() + "…";
  }
  return slice.trim() + "…";
}

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
  // CTA pro nosso site + hashtags vao no rodape; tudo o que sobrar de
  // espaco no IG_CAPTION_MAX (2200) vai pro corpo title+intro+body.
  // Fonte original NAO entra na caption: ela aparece dentro do site
  // quando o leitor clica no link.
  const hashtags = dedupeTags([...HASHTAGS_FIXED, ...(item.tags || [])])
    .map((t) => `#${t}`).join(" ");
  const cta = `leia completo em ${SITE_URL}`;
  const tail = `\n\n${cta}\n\n${hashtags}`;
  const budget = IG_CAPTION_MAX - tail.length - 8;

  let head = item.title_pt || "";
  if (item.intro_pt) head += `\n\n${item.intro_pt}`;

  let caption = head;
  if (item.body_pt) {
    const bodyBudget = budget - head.length - 2;
    if (bodyBudget > 120) {
      const body = truncateBody(item.body_pt, bodyBudget);
      if (body) caption += `\n\n${body}`;
    }
  }
  caption += tail;
  return caption;
}

function buildCarouselCaption(items) {
  if (items.length === 1) return buildSingleCaption(items[0]);

  // Carrossel: indice numerado + intro curta de cada item + CTA + hashtags.
  // Body completo nao cabe pra varios items, mas intro de cada da contexto
  // pro leitor decidir abrir o site.
  const hashtags = dedupeTags([
    ...HASHTAGS_FIXED,
    ...items.flatMap((it) => Array.isArray(it.tags) ? it.tags : []),
  ]).map((t) => `#${t}`).join(" ");
  const cta = `leia completo em ${SITE_URL}`;
  const tail = `\n\n${cta}\n\n${hashtags}`;
  const budget = IG_CAPTION_MAX - tail.length - 30;

  const header = `DESTAQUES DA EDIÇÃO\n\n`;
  let body = "";
  const perItemBudget = Math.floor((budget - header.length) / items.length);

  items.forEach((it, i) => {
    const title = it.title_pt || "";
    let intro = it.intro_pt || "";
    const entryHead = `${i + 1}. ${title}\n`;
    const remaining = perItemBudget - entryHead.length - 2;
    if (intro.length > remaining && remaining > 40) {
      intro = truncateBody(intro, remaining);
    } else if (remaining <= 40) {
      intro = "";
    }
    body += entryHead + (intro ? `${intro}\n\n` : "\n");
  });

  let caption = header + body.trim() + tail;
  if (caption.length > IG_CAPTION_MAX) {
    caption = caption.slice(0, IG_CAPTION_MAX - 3) + "...";
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
// coverImageUrl: opcional. Quando presente E for carrossel (>=2 items),
// vira o PRIMEIRO slide (capa Card 11). Solo (1 item) ignora a capa.
export async function publishItems(items, { igUserId, accessToken, coverImageUrl } = {}) {
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

  const totalSlides = items.length + (coverImageUrl ? 1 : 0);
  if (totalSlides > 10) {
    throw new Error(`publishItems: carrossel suporta max 10 slides, recebido ${totalSlides} (${items.length} items + ${coverImageUrl ? "capa" : "sem capa"})`);
  }

  const childrenIds = [];
  // Capa (Card 11) entra como primeiro slide do carrossel.
  if (coverImageUrl) {
    const coverId = await createSlideContainer({
      igUserId, accessToken,
      imageUrl: coverImageUrl,
    });
    childrenIds.push(coverId);
    await new Promise((r) => setTimeout(r, 500));
  }
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

// ============================================================
// Story (media_type=STORIES) - video vertical 1080x1920, max 60s.
// Diferente de imagem: video precisa de processamento server-side
// antes do publish, entao polleia status_code do container ate
// FINISHED. Sem caption (story nao suporta caption via API; usuario
// pode adicionar link sticker depois, manualmente, no app).
// ============================================================

export async function createStoryContainer({ igUserId, accessToken, videoUrl }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "STORIES",
    video_url: videoUrl,
    access_token: accessToken,
  });
  if (!r.id) throw new Error("createStoryContainer: sem id na resposta");
  return r.id;
}

async function getContainerStatus({ accessToken, containerId }) {
  const res = await got.get(`${API_BASE}/${containerId}`, {
    searchParams: { fields: "status_code,status", access_token: accessToken },
    timeout: { request: 15000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  if (res.statusCode >= 400) {
    throw new Error(`getContainerStatus ${containerId}: HTTP ${res.statusCode} ${res.body?.error?.message || ""}`);
  }
  return res.body || {};
}

async function waitContainerReady({ accessToken, containerId, timeoutMs = 180000, intervalMs = 5000 }) {
  const start = Date.now();
  let last = {};
  while (Date.now() - start < timeoutMs) {
    try {
      last = await getContainerStatus({ accessToken, containerId });
      const sc = last.status_code;
      if (sc === "FINISHED") return last;
      if (sc === "ERROR" || sc === "EXPIRED") {
        throw new Error(`container ${containerId} status_code=${sc}: ${last.status || ""}`);
      }
    } catch (e) {
      // erro transitorio: loga e segue tentando
      console.warn(`[story] poll status falhou (segue): ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`container ${containerId} nao ficou pronto em ${timeoutMs}ms (ultimo status: ${last.status_code || "?"})`);
}

// Helper completo: dado um videoUrl publicamente acessivel (raw.githubusercontent
// ou similar), cria container STORIES, aguarda processar e publica.
// Retorna { postId, containerId }.
export async function publishStory({ videoUrl, igUserId, accessToken } = {}) {
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("publishStory: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios");
  }
  if (!videoUrl) throw new Error("publishStory: videoUrl obrigatorio");

  const containerId = await createStoryContainer({ igUserId, accessToken, videoUrl });
  await waitContainerReady({ accessToken, containerId });
  const postId = await publishContainer({ igUserId, accessToken, creationId: containerId });
  return { postId, containerId };
}

export { buildSingleCaption, buildCarouselCaption, slideUrlFor };
