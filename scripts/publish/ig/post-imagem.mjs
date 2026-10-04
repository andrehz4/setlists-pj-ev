// Post de imagem única no feed com marcação de contas (user_tags) e recuperação do falso-erro 2207051.
// Usado pela "Agenda da semana". Se a API recusar alguma marcação, publica sem marcar (a legenda já leva os @).
import { credenciais, postIG } from "./http.mjs";
import { publicarComRecuperacao } from "./recuperar.mjs";
import { IGAPIError } from "./erros.mjs";

async function criar(c, imageUrl, caption, contas) {
  const form = { media_type: "IMAGE", image_url: imageUrl, caption, access_token: c.accessToken };
  // espalha as marcações pela imagem (a API exige x,y entre 0 e 1)
  if (contas.length) form.user_tags = JSON.stringify(contas.slice(0, 20).map((username, i) => ({ username, x: 0.1 + (i % 5) * 0.2, y: 0.2 + Math.floor(i / 5) * 0.2 })));
  const path = `/${c.igUserId}/media`;
  const r = await postIG(path, form);
  if (!r.id) throw new IGAPIError({ path, message: "post de imagem: sem id na resposta da IG" });
  return r.id;
}

export async function publishSingleImage({ imageUrl, caption, contas = [], igUserId, accessToken } = {}) {
  const c = credenciais({ igUserId, accessToken }, "publishSingleImage");
  const sinceMs = Date.now();
  let containerId, marcou = contas.length > 0;
  try {
    containerId = await criar(c, imageUrl, caption, contas);
  } catch (e) {
    if (!contas.length || !/user_?tags|tag|username/i.test(e.message)) throw e;
    console.warn(`[ig] post recusou marcação (${e.message}); publicando sem marcar`);
    containerId = await criar(c, imageUrl, caption, []);
    marcou = false;
  }
  await new Promise((r) => setTimeout(r, 4000));
  const r = await publicarComRecuperacao({ ...c, creationId: containerId, caption, sinceMs, rotulo: "post" });
  return { ...r, containerId, marcou };
}
