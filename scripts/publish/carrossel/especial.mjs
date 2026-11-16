// Carrossel especial pronto (feito à mão, ex.: com o modelo deste módulo): as imagens já estão no R2 com link fixo
// (pasta especiais/ do bucket, que NÃO apaga sozinha). Chamado pelo scripts/publish/reel/especial.mjs quando o
// publicar.json traz "imagens" em vez de "videoUrl" (mesmo workflow e mesmo gatilho do TriggerAll).
import { publishCarouselFromUrls } from "../ig/publicar.mjs";
import { publishAlbumFromUrls } from "../facebook.mjs";
import { aguardarPublico } from "../midia-r2.mjs";

export function validarImagens(imagens) {
  if (!Array.isArray(imagens) || imagens.length < 2 || imagens.length > 10) return "imagens: precisa de 2 a 10 links";
  const ruim = imagens.find((u) => typeof u !== "string" || !/^https:\/\/\S+\.(jpe?g|png)(\?\S*)?$/i.test(u));
  return ruim === undefined ? null : `imagens: link inválido (${ruim})`;
}

// Publica no IG (carrossel) e espelha no FB (álbum) se PUBLISH_FB=1. Devolve { postId, fbPostId }.
export async function publicarCarrossel(doc, deps = {}) {
  const ig = deps.publishCarouselFromUrls || publishCarouselFromUrls;
  const fb = deps.publishAlbumFromUrls || publishAlbumFromUrls;
  const checar = deps.aguardarPublico || aguardarPublico;
  for (const url of doc.imagens) {
    // link quebrado = IG recusa o carrossel inteiro; melhor parar antes com o nome do slide
    if (!(await checar(url, { tentativas: 3 }))) throw new Error(`imagem fora do ar: ${url}`);
  }
  const pub = await ig(doc.imagens, doc.legenda);
  let fbPostId = null;
  if (process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN) {
    try {
      fbPostId = (await fb(doc.imagens, doc.legenda)).postId;
    } catch (e) {
      console.warn(`[especial] FB falhou (IG já foi): ${e.message}`);
    }
  }
  return { postId: pub.postId, containerId: pub.containerId || null, fbPostId };
}
