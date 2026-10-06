// Story de VÍDEO com marcação (story por banda da agenda). Tenta marcar as contas (user_tags: banda e casa); se a API
// recusar a marcação em story de vídeo, cria de novo sem ela (o @ já vai escrito no vídeo).
import { credenciais, postIG } from "./http.mjs";
import { publishContainer, waitContainerReady } from "./containers.mjs";
import { IGAPIError } from "./erros.mjs";

async function criarStory(c, videoUrl, contas) {
  const form = { media_type: "STORIES", video_url: videoUrl, access_token: c.accessToken };
  if (contas.length) form.user_tags = JSON.stringify(contas.map((username) => ({ username, x: 0.5, y: 0.5 })));
  const path = `/${c.igUserId}/media`;
  const r = await postIG(path, form);
  if (!r.id) throw new IGAPIError({ path, message: "story de vídeo: sem id na resposta da IG" });
  return r.id;
}

// Devolve { postId, containerId, marcou }: marcou=false quando a API recusou a marcação e saiu sem ela.
export async function publishVideoStory({ videoUrl, contas = [], igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishVideoStory");
  if (!videoUrl) throw new Error("publishVideoStory: videoUrl obrigatorio");
  let containerId, marcou = contas.length > 0;
  try {
    containerId = await criarStory(c, videoUrl, contas);
  } catch (e) {
    if (!contas.length || !/user_?tags|tag/i.test(e.message)) throw e;
    console.warn(`[ig] story de vídeo recusou marcação (${e.message}); publicando sem marcar`);
    containerId = await criarStory(c, videoUrl, []);
    marcou = false;
  }
  await waitContainerReady({ accessToken: c.accessToken, containerId });
  const postId = await publishContainer({ ...c, creationId: containerId });
  return { postId, containerId, marcou };
}
