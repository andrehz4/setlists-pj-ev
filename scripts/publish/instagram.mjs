// Cliente da Graph API do Instagram (fluxo "Instagram with Instagram Login", graph.instagram.com).
// Fachada: o código vive em scripts/publish/ig/
//   erros.mjs       erros tipados e rate limit            legendas.mjs  legendas (feed, carrossel, reel)
//   http.mjs        POST/GET, URL dos slides, uso da API  containers.mjs containers e espera do vídeo
//   recuperar.mjs   falso-erro 2207051 (publicou apesar do erro)
//   publicar.mjs    publishItems, publishCarouselFromUrls, publishStory, publishReel
// Env: IG_USER_ID, IG_ACCESS_TOKEN. Opcionais: IG_API_BASE (mock), REPO_PUBLIC_BASE (padrão raw do GitHub).
export { RATE_LIMIT_CODES, IGAPIError, IGRateLimitError } from "./ig/erros.mjs";
export { buildSingleCaption, buildCarouselCaption, buildReelCaption, truncateBody, limparMarkdown } from "./ig/legendas.mjs";
export { slideUrlFor, logUsageHeaders } from "./ig/http.mjs";
export {
  createSlideContainer, createCarouselContainer, createSingleImageContainer, createStoryContainer,
  createReelContainer, publishContainer,
} from "./ig/containers.mjs";
export { getRecentMedia, recoverPublishedPost } from "./ig/recuperar.mjs";
export { publishItems, publishCarouselFromUrls, publishStory, publishReel } from "./ig/publicar.mjs";
export { publishImageStory } from "./ig/story-imagem.mjs";
export { publishSingleImage } from "./ig/post-imagem.mjs";
export { publishVideoStory } from "./ig/story-video.mjs";
