// Graph API do Instagram fake, leituras: limite de publicação, /media, /me e existência de post.
import { load, save, nextId } from "./store.mjs";
import fs from "node:fs";
import path from "node:path";
import { PORT, SERVE_ROOT, MIME, send, sendJson, sendGraph, graphError, failMode, bumpCall, hourlyUsage, readBody, serveFile, checkLocalMedia, USERS, HOURLY_LIMIT, ALARM_PCT } from "./http-util.mjs";

export async function rotasIgGet(c) {
  const { req, res, pathname, query, method } = c;
  // GET /:uid/content_publishing_limit
  if (method === "GET" && /\/content_publishing_limit$/.test(pathname)) {
    const s = load();
    bumpCall(s, "GET /content_publishing_limit"); save(s);
    const fail = failMode(s, query);
    if (fail === "ratelimit") {
      return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" }, s);
    }
    const usage = fail === "quota" ? 49 : (s.quotaUsage || 0);
    // shape OFICIAL da Meta: embrulhado em data[] (a doc do endpoint mostra
    // {"data":[{"quota_usage":N,"config":{...}}]}). O cliente aceita os dois.
    return sendGraph(res, 200, { data: [{ quota_usage: usage, config: { quota_total: 50, quota_duration: 86400 } }] }, s);
  }

  // GET /:uid/media  (lista midias recentes da conta) -- usado pela
  // recuperacao pos-erro do cliente (recoverPublishedPost). Devolve o feed
  // no formato da Graph API: { data: [{ id, caption, timestamp, media_type }] }.
  if (method === "GET" && /\/media$/.test(pathname)) {
    const s = load();
    bumpCall(s, "GET /:uid/media");
    if (failMode(s, query) === "ratelimit") {
      save(s);
      return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" }, s);
    }
    // consistencia eventual simulada: enquanto mediaHideCalls > 0, o feed
    // "ainda nao indexou" e a lista volta vazia. Decrementa por chamada.
    if (s.control && Number(s.control.mediaHideCalls) > 0) {
      s.control.mediaHideCalls = Number(s.control.mediaHideCalls) - 1;
      save(s);
      return sendGraph(res, 200, { data: [] }, s);
    }
    save(s);
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 25;
    // IG real lista feed E reels no GET /media (stories nao). Mescla por
    // createdAt desc pra recuperacao pos-erro enxergar reels tambem.
    const all = [
      ...(s.feed || []).map((f) => ({
        id: f.postId,
        caption: f.caption || "",
        timestamp: f.createdAt,
        media_type: f.type === "CAROUSEL" ? "CAROUSEL_ALBUM" : (f.type || "IMAGE"),
      })),
      ...(s.reels || []).map((r) => ({
        id: r.postId,
        caption: r.caption || "",
        timestamp: r.createdAt,
        media_type: "VIDEO",
      })),
    ].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    return sendGraph(res, 200, { data: all.slice(0, limit) }, s);
  }

  // GET /me
  if (method === "GET" && pathname === "/me") {
    const s = load(); bumpCall(s, "GET /me"); save(s);
    return sendJson(res, 200, { id: process.env.IG_USER_ID || "mock_user", username: "mock_account", account_type: "BUSINESS" });
  }

  // GET /:id  (status de container OU exists de post, decidido pelo prefixo)
  if (method === "GET") {
    const id = pathname.replace(/^\/+/, "");
    const s = load();
    if (id.startsWith("c_")) {
      const c = s.containers[id];
      if (!c) return graphError(res, 400, { code: 100, message: "container inexistente" }, s);
      bumpCall(s, "GET /:container (status)");
      const fail = failMode(s, query);
      if (fail === "videoerror") { save(s); return sendJson(res, 200, { status_code: "ERROR", status: "mock forced error" }); }
      c.polls = (c.polls || 0) + 1;
      const need = s.control?.storyPolls || 0;
      if (c.polls >= need) c.status_code = "FINISHED";
      save(s);
      return sendJson(res, 200, { status_code: c.status_code, status: c.status_code });
    }
    if (id.startsWith("p_")) {
      bumpCall(s, "GET /:post (exists)"); save(s);
      if (s.deleted.includes(id)) return graphError(res, 400, { code: 100, message: "Unknown object id (apagado)" }, s);
      return sendJson(res, 200, { id });
    }
  }

  return false;
}
