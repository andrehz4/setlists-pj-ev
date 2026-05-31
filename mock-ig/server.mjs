// Mock da Graph API do Instagram (graph.instagram.com/v21.0).
//
// GENERICO E REUTILIZAVEL: nao depende deste projeto. Qualquer app que
// publique no IG via Graph API (carrossel, single, story) pode apontar pra
// ca setando IG_API_BASE + REPO_PUBLIC_BASE. Veja mock-ig/README.md.
//
// Tres papeis numa porta so:
//   1. Graph API fake: POST /media, /media_publish, GET /content_publishing_limit,
//      GET /:id (status de container OU exists de post), GET /me
//   2. Servidor de media do disco: GET /media/... (substitui raw.githubusercontent,
//      pra o "IG" buscar os JPG/MP4 que o app gerou localmente)
//   3. API do front: GET /_mock/feed|stories|state, POST /_mock/reset|fail
//
// Config por env (todas opcionais, defaults sensatos):
//   MOCK_IG_PORT       porta (default 8788)
//   MOCK_SERVE_ROOT    raiz de onde servir media do disco (default cwd)
//   MOCK_IG_STORE      caminho do _store.json (default ao lado deste arquivo)
//   MOCK_IG_FAIL       modo de falha sticky (ver injecao de erro abaixo)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { load, save, reset, nextId, STORE_PATH } from "./store.mjs";

const PORT = Number(process.env.MOCK_IG_PORT || 8788);
const SERVE_ROOT = path.resolve(process.env.MOCK_SERVE_ROOT || process.cwd());

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".mp4": "video/mp4", ".webp": "image/webp", ".gif": "image/gif",
  ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", ...headers });
  res.end(payload);
}

function sendJson(res, status, obj) {
  send(res, status, obj, { "Content-Type": "application/json; charset=utf-8" });
}

// Erro tipado da Graph API. code 4 = limite da app (rate limit), code 100 =
// objeto inexistente, etc. Formato exato que o cliente (classifyIGError) le.
function graphError(res, status, { code, subcode, message }) {
  sendJson(res, status, {
    error: {
      message: message || "Mock Graph API error",
      type: "OAuthException",
      code,
      error_subcode: subcode,
      fbtrace_id: "mock-trace",
    },
  });
}

// Modo de falha: query ?fail= (por request) > _control.json/store.control >
// env MOCK_IG_FAIL. Permite testar cooldown, quota, erro de video.
function failMode(store, query) {
  if (query.fail) return query.fail;
  if (store.control && store.control.fail) return store.control.fail;
  return process.env.MOCK_IG_FAIL || null;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  // o cliente manda form (application/x-www-form-urlencoded via got form:)
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params) obj[k] = v;
  return obj;
}

// Serve um arquivo do disco sob SERVE_ROOT (o "IG" busca a imagem/video aqui).
function serveFile(res, urlPath) {
  const rel = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const filePath = path.join(SERVE_ROOT, rel);
  if (!filePath.startsWith(SERVE_ROOT)) return send(res, 403, "forbidden");
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "not found: " + urlPath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = u.pathname;
  const query = Object.fromEntries(u.searchParams);
  const method = req.method;

  if (method === "OPTIONS") return send(res, 204, "");

  try {
    // ---------- API do front ----------
    if (pathname === "/_mock/feed") { const s = load(); return sendJson(res, 200, s.feed); }
    if (pathname === "/_mock/stories") { const s = load(); return sendJson(res, 200, s.stories); }
    if (pathname === "/_mock/state") { return sendJson(res, 200, load()); }
    if (pathname === "/_mock/reset" && method === "POST") { return sendJson(res, 200, reset()); }
    if (pathname === "/_mock/fail" && method === "POST") {
      const b = await readBody(req); const s = load();
      s.control = { ...(s.control || {}), fail: b.fail || null, storyPolls: Number(b.storyPolls || 0) };
      save(s); return sendJson(res, 200, s.control);
    }

    // ---------- media do disco ----------
    if (pathname.startsWith("/media/") || pathname.startsWith("/mock-media/")) {
      return serveFile(res, pathname.replace(/^\/mock-media/, "/media"));
    }

    // ---------- Graph API ----------
    // POST /:uid/media_publish  (testar ANTES de /media: prefixo compartilhado)
    if (method === "POST" && /\/media_publish$/.test(pathname)) {
      const s = load();
      const fail = failMode(s, query);
      if (fail === "ratelimit") {
        return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" });
      }
      const body = await readBody(req);
      const c = s.containers[body.creation_id];
      if (!c) return graphError(res, 400, { code: 100, message: "container inexistente: " + body.creation_id });
      const postId = nextId(s, "p");
      if (c.type === "STORIES") {
        s.stories.unshift({ postId, videoUrl: c.video_url, caption: c.caption || "", createdAt: new Date().toISOString() });
      } else {
        const slides = c.type === "CAROUSEL"
          ? (c.children || []).map((cid) => s.containers[cid]?.image_url).filter(Boolean)
          : [c.image_url];
        s.feed.unshift({ postId, type: c.type, caption: c.caption || "", slides, createdAt: new Date().toISOString() });
      }
      s.quotaUsage += 1;
      save(s);
      return sendJson(res, 200, { id: postId });
    }

    // POST /:uid/media  (cria container)
    if (method === "POST" && /\/media$/.test(pathname)) {
      const s = load();
      const fail = failMode(s, query);
      if (fail === "ratelimit") {
        return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" });
      }
      const body = await readBody(req);
      const id = nextId(s, "c");
      const isStory = body.media_type === "STORIES";
      s.containers[id] = {
        type: body.media_type || "IMAGE",
        image_url: body.image_url || null,
        video_url: body.video_url || null,
        children: body.children ? String(body.children).split(",") : null,
        caption: body.caption || null,
        // video so fica pronto apos storyPolls chamadas (caminho feliz = 0)
        status_code: isStory && (s.control?.storyPolls > 0) ? "IN_PROGRESS" : "FINISHED",
        polls: 0,
        createdAt: new Date().toISOString(),
      };
      save(s);
      return sendJson(res, 200, { id });
    }

    // GET /:uid/content_publishing_limit
    if (method === "GET" && /\/content_publishing_limit$/.test(pathname)) {
      const s = load();
      const fail = failMode(s, query);
      const usage = fail === "quota" ? 49 : (s.quotaUsage || 0);
      return sendJson(res, 200, { quota_usage: usage, config: { quota_total: 50, quota_duration: 86400 } });
    }

    // GET /me
    if (method === "GET" && pathname === "/me") {
      return sendJson(res, 200, { id: process.env.IG_USER_ID || "mock_user", username: "mock_account", account_type: "BUSINESS" });
    }

    // GET /:id  (status de container OU exists de post, decidido pelo prefixo)
    if (method === "GET") {
      const id = pathname.replace(/^\/+/, "");
      const s = load();
      if (id.startsWith("c_")) {
        const c = s.containers[id];
        if (!c) return graphError(res, 400, { code: 100, message: "container inexistente" });
        const fail = failMode(s, query);
        if (fail === "videoerror") return sendJson(res, 200, { status_code: "ERROR", status: "mock forced error" });
        c.polls = (c.polls || 0) + 1;
        const need = s.control?.storyPolls || 0;
        if (c.polls >= need) c.status_code = "FINISHED";
        save(s);
        return sendJson(res, 200, { status_code: c.status_code, status: c.status_code });
      }
      if (id.startsWith("p_")) {
        if (s.deleted.includes(id)) return graphError(res, 400, { code: 100, message: "Unknown object id (apagado)" });
        return sendJson(res, 200, { id });
      }
    }

    // ---------- front buildado (dist/) como fallback ----------
    // Se o front foi buildado (mock-ig/web/dist), serve-o aqui, pra rodar o
    // preview sem o dev server do Vite. SPA: rotas desconhecidas caem no index.
    if (method === "GET") {
      const webDist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "web", "dist");
      const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const candidate = path.join(webDist, rel);
      if (candidate.startsWith(webDist) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const ext = path.extname(candidate).toLowerCase();
        return send(res, 200, fs.readFileSync(candidate), { "Content-Type": MIME[ext] || "application/octet-stream" });
      }
      const indexHtml = path.join(webDist, "index.html");
      if (fs.existsSync(indexHtml)) {
        return send(res, 200, fs.readFileSync(indexHtml), { "Content-Type": MIME[".html"] });
      }
    }

    return sendJson(res, 404, { error: { message: "mock: rota nao mapeada " + method + " " + pathname, code: 0 } });
  } catch (e) {
    return sendJson(res, 500, { error: { message: "mock crash: " + e.message, code: 0 } });
  }
});

// Exporta pra ser embutido em teste (porta efemera) ou rodado direto.
export function start(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const actual = server.address().port;
      console.log(`[mock-ig] Graph API fake em http://127.0.0.1:${actual}`);
      console.log(`[mock-ig] serve media de: ${SERVE_ROOT}`);
      console.log(`[mock-ig] store: ${STORE_PATH}`);
      resolve(server);
    });
  });
}

// Rodado direto (node mock-ig/server.mjs) sobe o server. Importado, nao.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("server.mjs");
if (invokedDirectly) start();

export { server };
