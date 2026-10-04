// Story de IMAGEM (a agenda de shows do dia). Tenta marcar as contas (user_tags: banda e casa); se a API
// recusar a marcação em story, publica de novo sem ela (o @ já vai escrito na arte).
import { credenciais, postIG } from "./http.mjs";
import { publishContainer } from "./containers.mjs";
import { IGAPIError } from "./erros.mjs";

async function criarStory(c, imageUrl, contas) {
  const form = { media_type: "STORIES", image_url: imageUrl, access_token: c.accessToken };
  if (contas.length) form.user_tags = JSON.stringify(contas.map((username) => ({ username, x: 0.5, y: 0.5 })));
  const path = `/${c.igUserId}/media`;
  const r = await postIG(path, form);
  if (!r.id) throw new IGAPIError({ path, message: "story de imagem: sem id na resposta da IG" });
  return r.id;
}

// Devolve { postId, marcou }: marcou=false quando a API recusou a marcação e saiu sem ela.
export async function publishImageStory({ imageUrl, contas = [], igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishImageStory");
  if (!imageUrl) throw new Error("publishImageStory: imageUrl obrigatorio");
  let containerId, marcou = contas.length > 0;
  try {
    containerId = await criarStory(c, imageUrl, contas);
  } catch (e) {
    if (!contas.length || !/user_?tags|tag/i.test(e.message)) throw e;
    console.warn(`[ig] story recusou marcação (${e.message}); publicando sem marcar`);
    containerId = await criarStory(c, imageUrl, []);
    marcou = false;
  }
  await new Promise((r) => setTimeout(r, 3000)); // imagem processa rápido
  const postId = await publishContainer({ ...c, creationId: containerId });
  return { postId, containerId, marcou };
}
