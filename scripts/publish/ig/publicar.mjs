// Publicações completas: carrossel/single do feed, carrossel de URLs (cápsulas), story e reel.
import { credenciais, slideUrlFor } from "./http.mjs";
import { createSlideContainer, createCarouselContainer, createSingleImageContainer, createStoryContainer,
  createReelContainer, publishContainer, waitContainerReady } from "./containers.mjs";
import { publicarComRecuperacao } from "./recuperar.mjs";
import { buildSingleCaption, buildCarouselCaption } from "./legendas.mjs";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function carrossel(c, imageUrls, caption, sinceMs) {
  const childrenIds = [];
  for (const imageUrl of imageUrls) {
    childrenIds.push(await createSlideContainer({ ...c, imageUrl }));
    await espera(500);
  }
  const carouselId = await createCarouselContainer({ ...c, childrenIds, caption });
  await espera(6000); // o IG processa as imagens antes do publish
  return publicarComRecuperacao({ ...c, creationId: carouselId, caption, sinceMs, rotulo: "carrossel" });
}

// Itens do feed (cada um com .id, slides já no repo). 1 item = imagem única; 2+ = carrossel.
// coverImageUrl (só carrossel): vira o 1º slide e SUBSTITUI o do item líder (a capa já é ele).
export async function publishItems(items, { igUserId, accessToken, coverImageUrl, slideSuffix = "" } = {}) {
  if (!items || items.length === 0) throw new Error("publishItems: items vazio");
  const c = credenciais({ igUserId, accessToken }, "publishItems");
  const sinceMs = Date.now(); // a recuperação só aceita post criado depois disto
  if (items.length === 1) {
    const caption = buildSingleCaption(items[0]);
    const containerId = await createSingleImageContainer({ ...c, imageUrl: slideUrlFor(items[0].id, slideSuffix), caption });
    await espera(4000);
    const r = await publicarComRecuperacao({ ...c, creationId: containerId, caption, sinceMs, rotulo: "post" });
    return { ...r, count: 1, captionLen: caption.length };
  }
  if (items.length > 10) throw new Error(`publishItems: carrossel suporta max 10 slides, recebido ${items.length} items`);
  const urls = (coverImageUrl ? items.slice(1) : items).map((it) => slideUrlFor(it.id, slideSuffix));
  if (coverImageUrl) urls.unshift(coverImageUrl);
  const caption = buildCarouselCaption(items);
  const r = await carrossel(c, urls, caption, sinceMs);
  return { ...r, count: items.length, captionLen: caption.length };
}

// Carrossel de URLs prontas (cápsulas do YouTube). Retorna { postId, count }.
export async function publishCarouselFromUrls(imageUrls, caption, { igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishCarouselFromUrls");
  if (!imageUrls || imageUrls.length < 2) throw new Error("publishCarouselFromUrls: carrossel precisa de >=2 imagens");
  if (imageUrls.length > 10) throw new Error(`publishCarouselFromUrls: max 10 slides, recebido ${imageUrls.length}`);
  const r = await carrossel(c, imageUrls, caption, Date.now());
  return { ...r, count: imageUrls.length, captionLen: caption.length };
}

// Story: container STORIES -> espera processar -> publica. Sem legenda, sem recuperação.
export async function publishStory({ videoUrl, igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishStory");
  if (!videoUrl) throw new Error("publishStory: videoUrl obrigatorio");
  const containerId = await createStoryContainer({ ...c, videoUrl });
  await waitContainerReady({ accessToken: c.accessToken, containerId });
  const postId = await publishContainer({ ...c, creationId: containerId });
  return { postId, containerId };
}

// Reel: container REELS -> espera (reel processa mais devagar, 300 s) -> publica com recuperação.
export async function publishReel({ videoUrl, caption, shareToFeed = true, thumbOffsetMs, igUserId, accessToken, timeoutMs = 300000 } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishReel");
  if (!videoUrl) throw new Error("publishReel: videoUrl obrigatorio");
  const sinceMs = Date.now();
  const containerId = await createReelContainer({ ...c, videoUrl, caption, shareToFeed, thumbOffsetMs });
  await waitContainerReady({ accessToken: c.accessToken, containerId, timeoutMs });
  const r = await publicarComRecuperacao({ ...c, creationId: containerId, caption, sinceMs, rotulo: "reel" });
  return { ...r, containerId };
}
