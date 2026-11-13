// Lê os posts públicos de uma conta do Instagram pela API oficial da Meta (Business Discovery, via a página
// "Só mais um Fã de PJ"). Dos posts, legenda, data e link. O endereço da imagem (imagens) serve só pra ler o texto
// da arte de agenda (scripts/agenda/arte/); a foto do post nunca é salva nem publicada. Da conta, a foto de perfil
// (a imagem pública que a própria banda escolheu), usada no card da banda em /agenda/. Mesmo token da @pearljam.
import { GRAPH_FB } from "../config.mjs";

const ID_PADRAO = "17841414148425536"; // @smufdpj vista pela Graph do Facebook (não é segredo)

// Imagens do post (carrossel: as 5 primeiras). Vídeo fica de fora.
const imagensDo = (m) => (m.children?.data?.length ? m.children.data : [m])
  .filter((x) => x.media_type === "IMAGE" && x.media_url).slice(0, 5).map((x) => x.media_url);

export async function lerConta(conta, { n = 25, env = process.env, fetchImpl = fetch } = {}) {
  const token = env.IG_LEITURA_TOKEN;
  if (!token) throw new Error("IG_LEITURA_TOKEN ausente");
  const campos = `business_discovery.username(${conta}){username,name,biography,followers_count,media_count,profile_picture_url,`
    + `media.limit(${n}){caption,timestamp,permalink,media_type,media_url,children{media_type,media_url}}}`;
  const url = `${GRAPH_FB}/${env.IG_LEITURA_ID || ID_PADRAO}?fields=${encodeURIComponent(campos)}&access_token=${token}`;
  const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`@${conta}: ${(j.error?.message || `HTTP ${r.status}`).replace(token, "***")}`);
  const bd = j.business_discovery || {};
  return {
    conta: bd.username, nome: bd.name, seguidores: bd.followers_count, foto: bd.profile_picture_url || null,
    posts: (bd.media?.data || []).map((m) => ({ data: m.timestamp, link: m.permalink, legenda: m.caption || "",
      imagens: imagensDo(m) })),
  };
}
