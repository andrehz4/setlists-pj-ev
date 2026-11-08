// Retoma o reel que ficou preso no IG (fallback.mjs): olha os containers guardados no _reel-log.json e, se algum
// terminou de processar, só publica (sem renderizar de novo). Entrada `aprovado` (o Andre viu e aprovou ESTE vídeo):
// se nenhum container serve, cria containers novos do MESMO MP4, nunca renderiza outro. Devolve true se publicou;
// false = seguir o fluxo normal (render + containers novos).
import { credenciais, getIG } from "../ig/http.mjs";
import { waitContainerReady } from "../ig/containers.mjs";
import { publicarComRecuperacao } from "../ig/recuperar.mjs";
import { writeLog, espelharNoFacebook, avisarReel, avisarFalha } from "./registro.mjs";
import { acharPendente } from "./pendente.mjs";
import { publishReelComFallback } from "./fallback.mjs";

const LOG = "media/news/instagram-reels/_reel-log.json";

async function statusDe(accessToken, id) {
  try {
    return (await getIG(`/${id}`, { fields: "status_code,status", access_token: accessToken }))?.status_code || "?";
  } catch (e) {
    console.warn(`[reel] status do container ${id} falhou: ${e.message}`);
    return "?";
  }
}

export async function retomarPendente({ log, weekKey, agoraMs, commit, esperaMs = 360000, deps = {} }) {
  const pend = acharPendente(log, weekKey, agoraMs);
  if (!pend) return false;
  const d = { waitContainerReady, publicarComRecuperacao, publishReelComFallback, gravar: writeLog, ...deps };
  const c = credenciais({}, "retomarReel");
  const salvar = async (msg) => { await d.gravar(log); await commit([LOG], msg); };
  const falhar = async (e, publicando) => {
    for (const id of e.containerIds || []) if (!pend.containerIds.includes(id)) pend.containerIds.push(id);
    pend.error = `retomar: ${e.message}`;
    if (publicando) pend.semRetomar = true; // erro no publish: pode ter saído, ninguém tenta de novo sozinho
    await salvar(`publish-reel: log falha ao retomar ${weekKey}`);
    await avisarFalha({ weekKey, erro: Object.assign(e, { publicando: Boolean(publicando), containerIds: pend.containerIds }) });
    throw e;
  };
  const fechar = async (postId, containerId) => {
    const fbPostId = await espelharNoFacebook(pend.videoUrl, pend.caption);
    Object.assign(pend, { postId, containerId, fbPostId, retomado: true });
    await salvar(`publish-reel: log retomado ${weekKey} postId=${postId}`);
    await avisarReel({ items: pend.resumo, postId, track: { name: pend.track }, weekKey,
      rangeLabel: pend.rangeLabel, retomado: true });
    return true;
  };
  console.log(`[reel] reel pendente de ${weekKey} (containers ${pend.containerIds.join(", ")}): tentando retomar`);
  const vistos = [];
  for (const id of [...pend.containerIds]) { // do mais antigo: já processa há mais tempo
    let st = await statusDe(c.accessToken, id);
    if (st === "IN_PROGRESS") {
      try {
        await d.waitContainerReady({ accessToken: c.accessToken, containerId: id, timeoutMs: esperaMs });
        st = "FINISHED";
      } catch (e) {
        console.warn(`[reel] container ${id} ainda nao ficou pronto: ${e.message}`);
      }
    }
    vistos.push(`${id}=${st}`);
    if (st !== "FINISHED") continue;
    let r;
    try {
      r = await d.publicarComRecuperacao({ ...c, creationId: id, caption: pend.caption, sinceMs: agoraMs, rotulo: "reel" });
    } catch (e) {
      return falhar(e, true);
    }
    return fechar(r.postId, id);
  }
  if (pend.aprovado) {
    console.log(`[reel] nenhum container serve (${vistos.join(" ")}): containers novos do video aprovado ${pend.videoUrl}`);
    let r;
    try {
      r = await d.publishReelComFallback({ videoUrl: pend.videoUrl, caption: pend.caption, thumbOffsetMs: pend.thumbOffsetMs });
    } catch (e) {
      return falhar(e, e.publicando);
    }
    return fechar(r.postId, r.containerId);
  }
  console.log(`[reel] nenhum container pendente serve (${vistos.join(" ")}): seguindo com render e containers novos`);
  return false;
}
