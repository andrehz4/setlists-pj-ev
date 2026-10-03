// Graph API do Facebook Pages fake (fotos, feed, stories e reels de vídeo, upload).
import { load, save, nextId } from "./store.mjs";
import fs from "node:fs";
import path from "node:path";
import { PORT, SERVE_ROOT, MIME, send, sendJson, sendGraph, graphError, failMode, bumpCall, hourlyUsage, readBody, serveFile, checkLocalMedia, USERS, HOURLY_LIMIT, ALARM_PCT } from "./http-util.mjs";

export async function rotasFb(c) {
  const { req, res, pathname, query, method } = c;
  // ---------- Facebook Pages (mock) ----------
  // POST /:pageId/photos  (sobe foto, published=false) -> retorna media_fbid.
  // Espelha graph.facebook.com/<PAGE_ID>/photos usado pelo facebook.mjs.
  if (method === "POST" && /\/photos$/.test(pathname)) {
    const body = await readBody(req);
    const s = load();
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      bumpCall(s, "POST /photos"); save(s);
      return graphError(res, 429, { code: 4, message: "Application request limit reached" }, s);
    }
    const mediaErr = await checkLocalMedia(body.url);
    if (mediaErr) {
      return graphError(res, 400, { code: 9004, message: `Media could not be fetched: ${mediaErr}` }, s);
    }
    bumpCall(s, "POST /photos");
    const id = nextId(s, "ph");
    if (!s.fbPhotos) s.fbPhotos = {};
    s.fbPhotos[id] = { url: body.url, published: body.published === "true", createdAt: new Date().toISOString() };
    save(s);
    return sendGraph(res, 200, { id }, s);
  }

  // POST /:pageId/feed  (cria post do feed com attached_media[]) -> retorna post id
  if (method === "POST" && /\/feed$/.test(pathname)) {
    const body = await readBody(req);
    const s = load();
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      bumpCall(s, "POST /feed"); save(s);
      return graphError(res, 429, { code: 4, message: "Application request limit reached" }, s);
    }
    // reconstroi a ordem das fotos a partir de attached_media[N]={"media_fbid":id}
    const fbids = [];
    for (const [k, v] of Object.entries(body)) {
      const m = /^attached_media\[(\d+)\]$/.exec(k);
      if (!m) continue;
      try { fbids[Number(m[1])] = JSON.parse(v).media_fbid; } catch { /* ignora entry malformada */ }
    }
    const photos = fbids.filter(Boolean).map((fid) => s.fbPhotos?.[fid]?.url).filter(Boolean);
    if (photos.length === 0) {
      return graphError(res, 400, { code: 100, message: "feed: nenhuma foto anexada valida (attached_media vazio)" }, s);
    }
    bumpCall(s, "POST /feed");
    const postId = nextId(s, "fb");
    if (!s.fbfeed) s.fbfeed = [];
    s.fbfeed.unshift({ postId, message: body.message || "", photos, createdAt: new Date().toISOString() });
    save(s);
    return sendGraph(res, 200, { id: postId }, s);
  }

  // POST /:pageId/video_stories | /:pageId/video_reels  (upload em 3 fases)
  //   upload_phase=start  -> { video_id, upload_url }
  //   upload_phase=finish -> { success, post_id }
  if (method === "POST" && /\/(video_stories|video_reels)$/.test(pathname)) {
    const edge = /video_reels$/.test(pathname) ? "video_reels" : "video_stories";
    const body = await readBody(req);
    const s = load();
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      bumpCall(s, `POST /${edge}`); save(s);
      return graphError(res, 429, { code: 4, message: "Application request limit reached" }, s);
    }
    if (body.upload_phase === "start") {
      bumpCall(s, `POST /${edge} start`);
      const videoId = nextId(s, "vid");
      if (!s.fbVideos) s.fbVideos = {};
      s.fbVideos[videoId] = { edge, uploaded: false, fileUrl: null };
      save(s);
      return sendGraph(res, 200, { video_id: videoId, upload_url: `http://127.0.0.1:${PORT}/_fbupload/${videoId}` }, s);
    }
    if (body.upload_phase === "finish") {
      const vid = s.fbVideos?.[body.video_id];
      if (!vid) return graphError(res, 400, { code: 100, message: "video_id inexistente: " + body.video_id }, s);
      if (!vid.uploaded) return graphError(res, 400, { code: 100, message: "finish antes do upload do video" }, s);
      bumpCall(s, `POST /${edge} finish`);
      const postId = nextId(s, edge === "video_reels" ? "fbreel" : "fbstory");
      const createdAt = new Date().toISOString();
      if (edge === "video_reels") {
        if (!s.fbReels) s.fbReels = [];
        s.fbReels.unshift({ postId, videoUrl: vid.fileUrl, description: body.description || "", createdAt });
      } else {
        if (!s.fbStories) s.fbStories = [];
        s.fbStories.unshift({ postId, videoUrl: vid.fileUrl, createdAt });
      }
      save(s);
      return sendGraph(res, 200, { success: true, post_id: postId }, s);
    }
    return graphError(res, 400, { code: 100, message: "upload_phase invalido: " + body.upload_phase }, s);
  }

  // POST /_fbupload/:videoId  (upload hospedado: le o MP4 do header file_url)
  if (method === "POST" && pathname.startsWith("/_fbupload/")) {
    await readBody(req); // drena o corpo (vazio; o que importa e o header)
    const videoId = pathname.replace("/_fbupload/", "");
    const s = load();
    const fileUrl = req.headers["file_url"];
    const vid = s.fbVideos?.[videoId];
    if (!vid) return sendJson(res, 400, { success: false, error: "video_id inexistente" });
    if (!fileUrl) return sendJson(res, 400, { success: false, error: "header file_url ausente" });
    const mediaErr = await checkLocalMedia(fileUrl);
    if (mediaErr) return sendJson(res, 400, { success: false, error: mediaErr });
    vid.uploaded = true; vid.fileUrl = fileUrl;
    s.fbVideos[videoId] = vid;
    save(s);
    return sendJson(res, 200, { success: true });
  }

  return false;
}
