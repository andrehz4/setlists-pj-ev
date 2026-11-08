// Retoma o reel que ficou preso no IG (fallback.mjs): olha os containers guardados no _reel-log.json e, se algum
// terminou de processar, só publica (sem renderizar de novo). Devolve true se publicou; false = seguir o fluxo
// normal (render + containers novos).
import { credenciais, getIG } from "../ig/http.mjs";
import { waitContainerReady } from "../ig/containers.mjs";
import { publicarComRecuperacao } from "../ig/recuperar.mjs";
import { writeLog, espelharNoFacebook, avisarReel, avisarFalha } from "./registro.mjs";
import { acharPendente } from "./pendente.mjs";

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
  const d = { waitContainerReady, publicarComRecuperacao, gravar: writeLog, ...deps };
  const c = credenciais({}, "retomarReel");
  console.log(`[reel] reel pendente de ${weekKey} (containers ${pend.containerIds.join(", ")}): tentando retomar`);
  const vistos = [];
  for (const id of pend.containerIds) { // do mais antigo: já processa há mais tempo
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
    try {
      const r = await d.publicarComRecuperacao({ ...c, creationId: id, caption: pend.caption, sinceMs: agoraMs, rotulo: "reel" });
      const fbPostId = await espelharNoFacebook(pend.videoUrl, pend.caption);
      Object.assign(pend, { postId: r.postId, containerId: id, fbPostId, retomado: true });
      await d.gravar(log);
      await commit([LOG], `publish-reel: log retomado ${weekKey} postId=${r.postId}`);
      await avisarReel({ items: pend.resumo, postId: r.postId, track: { name: pend.track }, weekKey,
        rangeLabel: pend.rangeLabel, retomado: true });
      return true;
    } catch (e) {
      pend.semRetomar = true; // erro no publish: pode ter saído, ninguém tenta de novo sozinho
      pend.error = `retomar container ${id}: ${e.message}`;
      await d.gravar(log);
      await commit([LOG], `publish-reel: log falha ao retomar ${weekKey}`);
      await avisarFalha({ weekKey, erro: Object.assign(e, { publicando: true, containerIds: pend.containerIds }) });
      throw e;
    }
  }
  console.log(`[reel] nenhum container pendente serve (${vistos.join(" ")}): seguindo com render e containers novos`);
  return false;
}
