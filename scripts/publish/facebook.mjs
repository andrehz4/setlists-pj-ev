// Cliente do Facebook Pages Graph API (endpoint graph.facebook.com). Publica
// no feed da Pagina "So mais um Fa de PJ" como ALBUM de fotos, em 2 etapas:
//   1. sobe cada slide como foto NAO publicada (POST /<PAGE_ID>/photos, published=false)
//   2. cria o post do feed anexando as fotos (POST /<PAGE_ID>/feed, attached_media[])
//
// O conteudo (slides JPG e legenda) e o MESMO gerado pro carrossel do Instagram,
// entao reusamos buildCarouselCaption e slideUrlFor do instagram.mjs. Assim o
// texto do post fica identico nos dois canais e nao ha logica duplicada.
//
// Env esperado:
//   FB_PAGE_ID, FB_PAGE_TOKEN
//   (FB_API_BASE opcional, aponta pro mock local em teste)
//
// Auth: FB_PAGE_TOKEN e um Page Access Token de longa duracao (nao expira
// enquanto o user token de origem valer). Diferente do IG, nao precisa de
// refresh mensal. Ver memory/facebook-page-smufdpj.md.

import got from "got";
import { buildCarouselCaption, slideUrlFor } from "./instagram.mjs";

// FB_API_BASE permite apontar pro mock local (ver mock-ig/) sem mudar a logica.
// Sem a env, usa a Graph API real do Facebook (producao).
const FB_API_BASE = process.env.FB_API_BASE || "https://graph.facebook.com/v21.0";

// Codes de rate-limit do Graph API do Facebook (Meta), espelhando o IG.
// 4: Application request limit reached
// 17: User request limit reached
// 32: Page request limit reached
// 341: Application limit reached (feature-specific)
// 368: Temporarily blocked for policies violations
// 613: Calls to this api have exceeded the rate limit
// 80001: Rate limit da Pages API (publicacao)
export const FB_RATE_LIMIT_CODES = new Set([4, 17, 32, 341, 368, 613, 80001]);
const FB_RATE_LIMIT_PATTERN = /application request limit|rate limit|too many requests|quota|temporarily blocked/i;

// Erro tipado pra qualquer falha da FB API. Carrega code/subcode/type/fbtrace
// pra debug e pra abrir suporte com a Meta (fbtrace_id).
export class FBAPIError extends Error {
  constructor({ path, statusCode, code, subcode, type, fbtraceId, message }) {
    super(`FB API ${path}: ${message || `HTTP ${statusCode}`}`);
    this.name = "FBAPIError";
    this.path = path;
    this.statusCode = statusCode;
    this.code = code;
    this.subcode = subcode;
    this.type = type;
    this.fbtraceId = fbtraceId;
    this.apiMessage = message;
  }
  toDetailString() {
    const parts = [this.message];
    const meta = [];
    if (this.code != null) meta.push(`code=${this.code}`);
    if (this.subcode != null) meta.push(`subcode=${this.subcode}`);
    if (this.type) meta.push(`type=${this.type}`);
    if (this.fbtraceId) meta.push(`fbtrace=${this.fbtraceId}`);
    if (meta.length) parts.push(`[${meta.join(" ")}]`);
    return parts.join(" ");
  }
}

// Subclasse pra rate limit, detectada por code conhecido ou mensagem. Permite
// o worker fazer backoff em vez de tratar como erro generico.
export class FBRateLimitError extends FBAPIError {
  constructor(opts) {
    super(opts);
    this.name = "FBRateLimitError";
    this.isRateLimit = true;
  }
}

function classifyFBError({ path, statusCode, body }) {
  const err = body?.error || {};
  const opts = {
    path,
    statusCode,
    code: err.code,
    subcode: err.error_subcode,
    type: err.type,
    fbtraceId: err.fbtrace_id,
    message: err.message || `HTTP ${statusCode}`,
  };
  const isRL = (err.code != null && FB_RATE_LIMIT_CODES.has(err.code))
    || (typeof err.message === "string" && FB_RATE_LIMIT_PATTERN.test(err.message));
  return isRL ? new FBRateLimitError(opts) : new FBAPIError(opts);
}

async function postFB(path, body) {
  const url = `${FB_API_BASE}${path}`;
  const res = await got.post(url, {
    form: body,
    timeout: { request: 30000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  if (res.statusCode >= 400) {
    throw classifyFBError({ path, statusCode: res.statusCode, body: res.body });
  }
  return res.body;
}

// Sobe uma foto NAO publicada pra Pagina. Retorna o id da media (media_fbid),
// que depois vira attached_media no post do feed. published=false garante que a
// foto sozinha nao aparece no feed antes do post do album.
export async function uploadUnpublishedPhoto({ pageId, pageToken, imageUrl }) {
  const r = await postFB(`/${pageId}/photos`, {
    url: imageUrl,
    published: "false",
    access_token: pageToken,
  });
  if (!r.id) throw new FBAPIError({ path: `/${pageId}/photos`, message: "uploadUnpublishedPhoto: sem id na resposta do FB" });
  return r.id;
}

// Cria o post do feed anexando as fotos ja subidas (media_fbid). O FB monta o
// album (grade de fotos) automaticamente a partir de attached_media.
export async function createFeedPost({ pageId, pageToken, message, mediaFbids }) {
  const body = { message, access_token: pageToken };
  mediaFbids.forEach((id, i) => {
    body[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  const r = await postFB(`/${pageId}/feed`, body);
  if (!r.id) throw new FBAPIError({ path: `/${pageId}/feed`, message: "createFeedPost: sem id na resposta do FB" });
  return r.id;
}

// Helper completo: publica os items como ALBUM no feed da Pagina. Usa as mesmas
// URLs de slide e a mesma legenda do carrossel do IG. Retorna { postId, count }.
export async function publishFeedAlbum(items, { pageId, pageToken, coverImageUrl, slideSuffix = "" } = {}) {
  if (!items || items.length === 0) throw new Error("publishFeedAlbum: items vazio");
  if (!pageId) pageId = process.env.FB_PAGE_ID;
  if (!pageToken) pageToken = process.env.FB_PAGE_TOKEN;
  if (!pageId || !pageToken) {
    throw new Error("publishFeedAlbum: FB_PAGE_ID e FB_PAGE_TOKEN obrigatorios");
  }

  // Ordem das fotos no album: capa (se houver) primeiro, depois um slide por item,
  // igual ao carrossel do IG.
  const imageUrls = [];
  if (coverImageUrl) imageUrls.push(coverImageUrl);
  for (const it of items) imageUrls.push(slideUrlFor(it.id, slideSuffix));

  // 1. sobe cada foto como nao publicada
  const mediaFbids = [];
  for (const url of imageUrls) {
    const fbid = await uploadUnpublishedPhoto({ pageId, pageToken, imageUrl: url });
    mediaFbids.push(fbid);
    await new Promise((r) => setTimeout(r, 500));
  }

  // 2. cria o post do feed com as fotos anexadas
  const message = buildCarouselCaption(items);
  const postId = await createFeedPost({ pageId, pageToken, message, mediaFbids });
  return { postId, count: items.length, captionLen: message.length };
}

// ============================================================
// Video (Story e Reel) - Resumable Upload API do FB, em 3 fases:
//   1. START  : POST /<page>/<edge> upload_phase=start -> { video_id, upload_url }
//   2. UPLOAD : POST <upload_url> com header file_url=<mp4>. Upload HOSPEDADO:
//               o FB baixa o MP4 do raw.githubusercontent sozinho (nao mandamos
//               bytes), igual o IG faz com video_url. Nada de multipart.
//   3. FINISH : POST /<page>/<edge> upload_phase=finish video_id=<id> -> { post_id }
// edge = "video_stories" (story, sem legenda) ou "video_reels" (reel, com
// description). O video processa assincrono no FB apos o finish.
// ============================================================

async function startVideoUpload({ pageId, pageToken, edge }) {
  const r = await postFB(`/${pageId}/${edge}`, { upload_phase: "start", access_token: pageToken });
  if (!r.video_id || !r.upload_url) {
    throw new FBAPIError({ path: `/${pageId}/${edge}`, message: `start ${edge}: resposta sem video_id/upload_url (${JSON.stringify(r)})` });
  }
  return { videoId: r.video_id, uploadUrl: r.upload_url };
}

// Upload por URL hospedada: manda file_url no header e o FB busca o MP4. O
// upload_url e de outro host (rupload.facebook.com), entao chama direto, nao
// via postFB (que prefixa FB_API_BASE).
async function uploadHostedVideo({ uploadUrl, pageToken, videoUrl }) {
  const res = await got.post(uploadUrl, {
    headers: {
      Authorization: `OAuth ${pageToken}`,
      file_url: videoUrl,
    },
    timeout: { request: 120000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  if (res.statusCode >= 400 || (res.body && res.body.success === false)) {
    throw new FBAPIError({ path: uploadUrl, statusCode: res.statusCode, message: `upload de video falhou: ${JSON.stringify(res.body)}` });
  }
  return res.body;
}

function extractPostId(r, edge) {
  const postId = r.post_id || r.postId || null;
  if (!postId && r.success !== true) {
    throw new FBAPIError({ path: `/${edge}`, message: `finish ${edge}: resposta sem post_id (${JSON.stringify(r)})` });
  }
  return postId;
}

// Story da Pagina: video vertical, sem legenda (a API de story nao aceita
// caption, igual ao IG). Retorna { postId, videoId }.
export async function publishVideoStory({ videoUrl, pageId, pageToken } = {}) {
  if (!pageId) pageId = process.env.FB_PAGE_ID;
  if (!pageToken) pageToken = process.env.FB_PAGE_TOKEN;
  if (!pageId || !pageToken) throw new Error("publishVideoStory: FB_PAGE_ID e FB_PAGE_TOKEN obrigatorios");
  if (!videoUrl) throw new Error("publishVideoStory: videoUrl obrigatorio");

  const { videoId, uploadUrl } = await startVideoUpload({ pageId, pageToken, edge: "video_stories" });
  await uploadHostedVideo({ uploadUrl, pageToken, videoUrl });
  const r = await postFB(`/${pageId}/video_stories`, {
    upload_phase: "finish", video_id: videoId, access_token: pageToken,
  });
  return { postId: extractPostId(r, "video_stories"), videoId };
}

// Reel da Pagina: video vertical COM legenda (description). video_state=PUBLISHED
// publica direto (sem isso fica rascunho). Retorna { postId, videoId }.
export async function publishVideoReel({ videoUrl, description, pageId, pageToken } = {}) {
  if (!pageId) pageId = process.env.FB_PAGE_ID;
  if (!pageToken) pageToken = process.env.FB_PAGE_TOKEN;
  if (!pageId || !pageToken) throw new Error("publishVideoReel: FB_PAGE_ID e FB_PAGE_TOKEN obrigatorios");
  if (!videoUrl) throw new Error("publishVideoReel: videoUrl obrigatorio");

  const { videoId, uploadUrl } = await startVideoUpload({ pageId, pageToken, edge: "video_reels" });
  await uploadHostedVideo({ uploadUrl, pageToken, videoUrl });
  const r = await postFB(`/${pageId}/video_reels`, {
    upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED",
    description: description || "", access_token: pageToken,
  });
  return { postId: extractPostId(r, "video_reels"), videoId };
}
