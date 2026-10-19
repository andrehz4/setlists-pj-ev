// Carrossel com marcação por slide (user_tags no item): usado pelo carrossel da "Agenda da semana", onde cada banda
// é marcada no próprio slide. Se a API recusar alguma marcação, refaz o carrossel inteiro sem marcar (a legenda já
// leva os @). Recuperação do falso-erro 2207051 igual ao resto.
import { credenciais, postIG } from "./http.mjs";
import { createCarouselContainer } from "./containers.mjs";
import { publicarComRecuperacao } from "./recuperar.mjs";
import { IGAPIError } from "./erros.mjs";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ERRO_DE_MARCACAO = /user_?tags|tag|username/i;

// Marcações espalhadas pela imagem (a API exige x,y entre 0 e 1; até 20 por item).
export const userTags = (contas) => JSON.stringify(contas.slice(0, 20).map((username, i) => ({ username, x: 0.1 + (i % 5) * 0.2, y: 0.2 + Math.floor(i / 5) * 0.2 })));

async function item(c, imageUrl, contas) {
  const form = { media_type: "IMAGE", image_url: imageUrl, is_carousel_item: "true", access_token: c.accessToken };
  if (contas.length) form.user_tags = userTags(contas);
  const path = `/${c.igUserId}/media`;
  const r = await postIG(path, form);
  if (!r.id) throw new IGAPIError({ path, message: "item de carrossel: sem id na resposta da IG" });
  return r.id;
}

async function filhos(c, slides, marcar) {
  const ids = [];
  for (const s of slides) { ids.push(await item(c, s.imageUrl, marcar ? s.contas || [] : [])); await espera(500); }
  return ids;
}

// slides: [{ imageUrl, contas }] (2 a 10). Devolve { postId, ..., marcou }.
export async function publishTaggedCarousel(slides, caption, { igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishTaggedCarousel");
  if (!slides || slides.length < 2 || slides.length > 10) throw new Error(`publishTaggedCarousel: 2 a 10 slides, recebido ${slides?.length}`);
  const sinceMs = Date.now();
  let marcou = slides.some((s) => (s.contas || []).length);
  let childrenIds;
  try {
    childrenIds = await filhos(c, slides, marcou);
  } catch (e) {
    if (!marcou || !ERRO_DE_MARCACAO.test(e.message)) throw e;
    console.warn(`[ig] carrossel recusou marcação (${e.message}); refazendo sem marcar`);
    marcou = false;
    childrenIds = await filhos(c, slides, false);
  }
  const carouselId = await createCarouselContainer({ ...c, childrenIds, caption });
  await espera(6000);
  const r = await publicarComRecuperacao({ ...c, creationId: carouselId, caption, sinceMs, rotulo: "carrossel" });
  return { ...r, count: slides.length, marcou };
}
