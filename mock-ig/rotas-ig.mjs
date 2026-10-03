// Mídia do disco e Graph API do Instagram fake (containers, publish, /media, limite de publicação, /me).
import { load, save, nextId } from "./store.mjs";
import fs from "node:fs";
import path from "node:path";
import { PORT, SERVE_ROOT, MIME, send, sendJson, sendGraph, graphError, failMode, bumpCall, hourlyUsage, readBody, serveFile, checkLocalMedia, USERS, HOURLY_LIMIT, ALARM_PCT } from "./http-util.mjs";

export async function rotasIg(c) {
  const { req, res, pathname, query, method } = c;
  // ---------- media do disco ----------
  if (pathname.startsWith("/media/") || pathname.startsWith("/mock-media/")) {
    return serveFile(res, pathname.replace(/^\/mock-media/, "/media"));
  }

  // ---------- Graph API ----------
  // POST /:uid/media_publish  (testar ANTES de /media: prefixo compartilhado)
  if (method === "POST" && /\/media_publish$/.test(pathname)) {
    // body ANTES do load: encurta a janela de read-modify-write do store
    // entre o load e o save (requests concorrentes podiam se sobrescrever)
    const body = await readBody(req);
    const s = load();
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      bumpCall(s, "POST /media_publish"); save(s); // conta mesmo falhando (gastou chamada)
      return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" }, s);
    }
    const c = s.containers[body.creation_id];
    if (!c) return graphError(res, 400, { code: 100, message: "container inexistente: " + body.creation_id }, s);
    // IG real recusa publicar container de video ainda em processamento.
    // Pega regressao que pule o waitContainerReady (publicar sem poll).
    if (c.status_code !== "FINISHED") {
      return graphError(res, 400, { code: 9007, subcode: 2207027, message: `Media is not ready to be published (status_code=${c.status_code})` }, s);
    }
    // quota dura dos 50 posts/24h (code 80007): o pre-check do pipeline
    // deveria abortar antes, mas se estourar no meio da run o IG recusa.
    if ((s.quotaUsage || 0) >= 50) {
      bumpCall(s, "POST /media_publish"); save(s);
      return graphError(res, 400, { code: 80007, message: "Content publishing limit reached (50/24h)" }, s);
    }
    bumpCall(s, "POST /media_publish");
    const postId = nextId(s, "p");
    // fecha o ciclo de contagem: quantas chamadas custou ESTA postagem (por post).
    // 'over' aqui e so referencia ao carrossel cheio (12); o estouro de verdade
    // e o horario (rota /_mock/usage), nao o custo de 1 post.
    const apiCalls = { total: s.callCount || 0, byKind: { ...(s.callsByKind || {}) }, carouselMax: 12, over: (s.callCount || 0) > 12 };
    const createdAt = new Date().toISOString();
    if (c.type === "STORIES") {
      s.stories.unshift({ postId, videoUrl: c.video_url, caption: c.caption || "", createdAt, apiCalls });
    } else if (c.type === "REELS") {
      if (!s.reels) s.reels = [];
      s.reels.unshift({ postId, videoUrl: c.video_url, caption: c.caption || "", createdAt, apiCalls });
    } else {
      const slides = c.type === "CAROUSEL"
        ? (c.children || []).map((cid) => s.containers[cid]?.image_url).filter(Boolean)
        : [c.image_url];
      s.feed.unshift({ postId, type: c.type, caption: c.caption || "", slides, createdAt, apiCalls });
    }
    s.quotaUsage += 1;
    s.callCount = 0; s.callsByKind = {}; // zera pro proximo ciclo de postagem
    save(s);
    // Falso-erro: o post FOI criado (ja esta no feed acima) mas a API devolve
    // code 4 subcode 2207051 ("atividade restringida"). Modela o bug real do
    // @smufdpj, onde o IG publica mas retorna erro. Serve pra testar a
    // recuperacao pos-erro (recoverPublishedPost): o cliente deve achar o
    // post pelo GET /media e tratar como sucesso, sem re-postar.
    if (fail === "ghostpublish") {
      return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" });
    }
    return sendGraph(res, 200, { id: postId }, s);
  }

  // POST /:uid/media  (cria container)
  if (method === "POST" && /\/media$/.test(pathname)) {
    const body = await readBody(req);
    const s = load();
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      bumpCall(s, "POST /media"); save(s);
      return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" }, s);
    }
    // validacoes que o IG real faz na criacao do container
    if (body.caption && body.caption.length > 2200) {
      return graphError(res, 400, { code: 100, message: `Caption too long (${body.caption.length} > 2200)` }, s);
    }
    if (body.media_type === "CAROUSEL") {
      const kids = String(body.children || "").split(",").filter(Boolean);
      if (kids.length < 2 || kids.length > 10) {
        return graphError(res, 400, { code: 100, message: `carrossel exige 2 a 10 children, recebido ${kids.length}` }, s);
      }
    }
    const mediaErr = await checkLocalMedia(body.image_url || body.video_url);
    if (mediaErr) {
      return graphError(res, 400, { code: 9004, message: `Media could not be fetched: ${mediaErr}` }, s);
    }
    bumpCall(s, "POST /media");
    const id = nextId(s, "c");
    // STORIES e REELS sao video: passam por processamento (polling de status).
    const isVideo = body.media_type === "STORIES" || body.media_type === "REELS";
    s.containers[id] = {
      type: body.media_type || "IMAGE",
      image_url: body.image_url || null,
      video_url: body.video_url || null,
      children: body.children ? String(body.children).split(",") : null,
      caption: body.caption || null,
      // video so fica pronto apos storyPolls chamadas (caminho feliz = 0)
      status_code: isVideo && (s.control?.storyPolls > 0) ? "IN_PROGRESS" : "FINISHED",
      polls: 0,
      createdAt: new Date().toISOString(),
    };
    save(s);
    return sendGraph(res, 200, { id }, s);
  }

  return false;
}
