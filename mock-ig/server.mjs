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
import { loadCandidates, previewSlide } from "./preview.mjs";

const PORT = Number(process.env.MOCK_IG_PORT || 8788);
const SERVE_ROOT = path.resolve(process.env.MOCK_SERVE_ROOT || process.cwd());

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".mp4": "video/mp4", ".webp": "image/webp", ".gif": "image/gif",
  ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8",
  // o front buildado (dist/) referencia JS/CSS como modulos: precisam do MIME
  // certo ou o navegador recusa (strict MIME pra module scripts).
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", ...headers });
  res.end(payload);
}

function sendJson(res, status, obj) {
  send(res, status, obj, { "Content-Type": "application/json; charset=utf-8" });
}

// Resposta Graph COM o header x-app-usage (como a Meta real manda). call_count
// e o % do uso horario no mock. Assim o pipeline pode ler o header e logar.
function sendGraph(res, status, obj, store) {
  const u = hourlyUsage(store);
  const appUsage = JSON.stringify({ call_count: u.pct, total_time: u.pct, total_cputime: Math.round(u.pct / 2) });
  send(res, status, obj, { "Content-Type": "application/json; charset=utf-8", "x-app-usage": appUsage });
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

// Limite REAL do Instagram (doc oficial da Meta):
//   "Calls within 24 hours = 4800 * Number of Impressions"  (janela 24h)
// O teto NAO e fixo: cresce com as IMPRESSOES da conta nas ultimas 24h. Conta
// pequena/nova = poucas impressoes = teto baixo = nao posta = segue pequena
// (circulo vicioso). O numero real so se sabe lendo o header x-app-usage
// (call_count em % do limite) numa run real.
// O mock SIMULA: MOCK_IMPRESSIONS (default 5, conta pequena) -> teto 24h =
// 4800*impressoes. Ajuste quando souber o real, ou crave MOCK_DAILY_LIMIT.
const IMPRESSIONS = Number.isFinite(Number(process.env.MOCK_IMPRESSIONS)) && Number(process.env.MOCK_IMPRESSIONS) >= 0
  ? Number(process.env.MOCK_IMPRESSIONS) : 5;
const DAILY_LIMIT = Number.isFinite(Number(process.env.MOCK_DAILY_LIMIT)) && Number(process.env.MOCK_DAILY_LIMIT) > 0
  ? Number(process.env.MOCK_DAILY_LIMIT) : Math.max(1, 4800 * IMPRESSIONS);
const ALARM_PCT = Number.isFinite(Number(process.env.MOCK_ALARM_PCT)) && Number(process.env.MOCK_ALARM_PCT) > 0
  ? Number(process.env.MOCK_ALARM_PCT) : 80;
const DAY_MS = 24 * 60 * 60 * 1000;

// Conta 1 chamada Graph: no ciclo atual (por post) E no log de 24h (limite real).
// Recebe o store ja carregado, NAO salva (o caller salva). label ex: "POST /media".
function bumpCall(s, label) {
  s.callCount = (s.callCount || 0) + 1;
  if (!s.callsByKind) s.callsByKind = {};
  s.callsByKind[label] = (s.callsByKind[label] || 0) + 1;
  if (!s.callLog) s.callLog = [];
  s.callLog.push(Date.now());
}

// Chamadas nas ultimas 24h (janela real do limite do Instagram). Poda o log.
function hourlyUsage(s) {
  const cutoff = Date.now() - DAY_MS;
  s.callLog = (s.callLog || []).filter((t) => t >= cutoff);
  const used = s.callLog.length;
  const alarmAt = Math.round(DAILY_LIMIT * ALARM_PCT / 100);
  return {
    used, limit: DAILY_LIMIT, alarmAt, impressions: IMPRESSIONS,
    over: used > alarmAt, pct: Math.min(100, Math.round((used / DAILY_LIMIT) * 100)),
  };
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
    if (pathname === "/_mock/reels") { const s = load(); return sendJson(res, 200, s.reels || []); }
    if (pathname === "/_mock/usage") {
      // medidor horario: chamadas na ultima hora vs ~200 (limite real do code 4)
      const s = load(); const u = hourlyUsage(s); save(s); return sendJson(res, 200, u);
    }
    if (pathname === "/_mock/state") { return sendJson(res, 200, load()); }
    if (pathname === "/_mock/control") { const s = load(); return sendJson(res, 200, s.control || { fail: null, storyPolls: 0 }); }
    if (pathname === "/_mock/reset" && method === "POST") { return sendJson(res, 200, reset()); }

    // ---------- simulador (preview sob demanda, read-only) ----------
    if (pathname === "/_mock/candidates") {
      try { return sendJson(res, 200, await loadCandidates()); }
      catch (e) { return sendJson(res, 500, { error: e.message }); }
    }
    if (pathname === "/_mock/preview" && method === "POST") {
      try {
        const b = await readBody(req);
        if (!b.id) return sendJson(res, 400, { error: "id obrigatorio" });
        return sendJson(res, 200, await previewSlide(b.id));
      } catch (e) { return sendJson(res, 500, { error: e.message }); }
    }
    if (pathname === "/_mock/fail" && method === "POST") {
      const b = await readBody(req); const s = load();
      s.control = {
        ...(s.control || {}),
        fail: b.fail && b.fail !== "none" ? b.fail : null,
        storyPolls: Number(b.storyPolls || 0),
      };
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
        bumpCall(s, "POST /media_publish"); save(s); // conta mesmo falhando (gastou chamada)
        return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" });
      }
      const body = await readBody(req);
      const c = s.containers[body.creation_id];
      if (!c) return graphError(res, 400, { code: 100, message: "container inexistente: " + body.creation_id });
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
      return sendGraph(res, 200, { id: postId }, s);
    }

    // POST /:uid/media  (cria container)
    if (method === "POST" && /\/media$/.test(pathname)) {
      const s = load();
      const fail = failMode(s, query);
      if (fail === "ratelimit") {
        bumpCall(s, "POST /media"); save(s);
        return graphError(res, 429, { code: 4, subcode: 2207051, message: "Application request limit reached" });
      }
      const body = await readBody(req);
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

    // GET /:uid/content_publishing_limit
    if (method === "GET" && /\/content_publishing_limit$/.test(pathname)) {
      const s = load();
      bumpCall(s, "GET /content_publishing_limit"); save(s);
      const fail = failMode(s, query);
      const usage = fail === "quota" ? 49 : (s.quotaUsage || 0);
      return sendJson(res, 200, { quota_usage: usage, config: { quota_total: 50, quota_duration: 86400 } });
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
        if (!c) return graphError(res, 400, { code: 100, message: "container inexistente" });
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
