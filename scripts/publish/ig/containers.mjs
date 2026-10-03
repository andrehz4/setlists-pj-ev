// Containers da Graph API: cada mídia vira um container (POST /<uid>/media) que depois é publicado
// (POST /<uid>/media_publish). Vídeo (story, reel) precisa esperar o processamento (status FINISHED).
import { postIG, getIG } from "./http.mjs";
import { IGAPIError } from "./erros.mjs";

async function criar(igUserId, form, quem) {
  const path = `/${igUserId}/media`;
  const r = await postIG(path, form);
  if (!r.id) throw new IGAPIError({ path, message: `${quem}: sem id na resposta da IG` });
  return r.id;
}

export const createSlideContainer = ({ igUserId, accessToken, imageUrl }) =>
  criar(igUserId, { media_type: "IMAGE", image_url: imageUrl, is_carousel_item: "true", access_token: accessToken }, "createSlideContainer");

export const createCarouselContainer = ({ igUserId, accessToken, childrenIds, caption }) =>
  criar(igUserId, { media_type: "CAROUSEL", children: childrenIds.join(","), caption, access_token: accessToken }, "createCarouselContainer");

export const createSingleImageContainer = ({ igUserId, accessToken, imageUrl, caption }) =>
  criar(igUserId, { media_type: "IMAGE", image_url: imageUrl, caption, access_token: accessToken }, "createSingleImageContainer");

// Story: vídeo vertical 1080x1920, sem legenda (a API não aceita; link sticker só no app).
export const createStoryContainer = ({ igUserId, accessToken, videoUrl }) =>
  criar(igUserId, { media_type: "STORIES", video_url: videoUrl, access_token: accessToken }, "createStoryContainer");

// Reel: com legenda, share_to_feed (aparece no grid) e thumb_offset (quadro da capa, em ms).
export function createReelContainer({ igUserId, accessToken, videoUrl, caption, shareToFeed = true, thumbOffsetMs }) {
  const form = { media_type: "REELS", video_url: videoUrl, share_to_feed: shareToFeed ? "true" : "false", access_token: accessToken };
  if (caption) form.caption = caption;
  if (Number.isFinite(thumbOffsetMs) && thumbOffsetMs >= 0) form.thumb_offset = String(Math.round(thumbOffsetMs));
  return criar(igUserId, form, "createReelContainer");
}

export async function publishContainer({ igUserId, accessToken, creationId }) {
  const path = `/${igUserId}/media_publish`;
  const r = await postIG(path, { creation_id: creationId, access_token: accessToken });
  if (!r.id) throw new IGAPIError({ path, message: "publishContainer: sem id na resposta da IG" });
  return r.id;
}

class ContainerFalhou extends Error {}

// Espera o vídeo processar. Erro de rede é transitório (tenta de novo); status ERROR ou EXPIRED é
// definitivo e para na hora (antes o próprio catch engolia e o poll seguia até o timeout, 3 a 5 min).
export async function waitContainerReady({ accessToken, containerId, timeoutMs = 180000, intervalMs = 5000 }) {
  const start = Date.now();
  let last = {};
  while (Date.now() - start < timeoutMs) {
    try {
      last = (await getIG(`/${containerId}`, { fields: "status_code,status", access_token: accessToken })) || {};
      const sc = last.status_code;
      if (sc === "FINISHED") return last;
      if (sc === "ERROR" || sc === "EXPIRED") throw new ContainerFalhou(`container ${containerId} status_code=${sc}: ${last.status || ""}`);
    } catch (e) {
      if (e instanceof ContainerFalhou) throw e;
      console.warn(`[ig] poll do container falhou (segue tentando): ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`container ${containerId} nao ficou pronto em ${timeoutMs}ms (ultimo status: ${last.status_code || "?"})`);
}
