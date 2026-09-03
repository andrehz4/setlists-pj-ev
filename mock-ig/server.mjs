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
//   3. API do front: GET /_mock/feed|stories|state, POST /_mock/reset|fail|delete
//
// Config por env (todas opcionais, defaults sensatos):
//   MOCK_IG_PORT       porta (default 8788)
//   MOCK_SERVE_ROOT    raiz de onde servir media do disco (default cwd)
//   MOCK_IG_STORE      caminho do _store.json (default ao lado deste arquivo)
//   MOCK_IG_FAIL       modo de falha sticky (ver injecao de erro abaixo)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { load, save, reset, nextId, STORE_PATH } from "./store.mjs";
import { loadCandidates, previewSlide, nextRunDetail } from "./preview.mjs";
import { listRuns, runDetail } from "./runs.mjs";
import { loadCuration } from "./curation.mjs";
import { listCurationRuns, curationRunDetail } from "./curation-runs.mjs";

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
// Com store, manda tambem o x-app-usage (a Meta real manda header de uso
// inclusive em respostas de erro).
function graphError(res, status, { code, subcode, message }, store) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (store) {
    const u = hourlyUsage(store);
    headers["x-app-usage"] = JSON.stringify({ call_count: u.pct, total_time: u.pct, total_cputime: Math.round(u.pct / 2) });
  }
  send(res, status, {
    error: {
      message: message || "Mock Graph API error",
      type: "OAuthException",
      code,
      error_subcode: subcode,
      fbtrace_id: "mock-trace",
    },
  }, headers);
}

// Modo de falha: query ?fail= (por request) > store.control (setado via
// POST /_mock/fail) > env MOCK_IG_FAIL. Permite testar cooldown, quota,
// erro de video.
function failMode(store, query) {
  if (query.fail) return query.fail;
  if (store.control && store.control.fail) return store.control.fail;
  return process.env.MOCK_IG_FAIL || null;
}

// Os DOIS limites da Meta que importam (doc oficial), rastreados lado a lado
// pra nunca mais confundir:
//
//  1. APP / Platform (code 4 "Application request limit reached") <- E O NOSSO.
//     "Calls within one hour = 200 * Number of Users" (usuarios ativos diarios
//     do app). Janela de 1 HORA. O erro que derruba o feed e code 4, entao e
//     ESTE o limite ativo. App pequena (~1 usuario) -> ~200 chamadas/h.
//     Header: X-App-Usage.call_count (% da janela de 1h).
//
//  2. BUC Instagram (code 80002) - OUTRO limite, NAO e o que estamos batendo.
//     "Calls within 24 hours = 4800 * Number of Impressions". Janela 24h,
//     cresce com o alcance. So entra se virmos code 80002, nao code 4.
//     Header: X-Business-Use-Case-Usage (type=instagram).
//
// O mock modela o limite 1 (code 4, janela 1h), que e o ativo. Defaults
// conservadores pra app pequena; o numero REAL sai no log do pipeline
// (X-App-Usage) numa run de verdade.
const USERS = Number.isFinite(Number(process.env.MOCK_USERS)) && Number(process.env.MOCK_USERS) > 0
  ? Number(process.env.MOCK_USERS) : 1;
const HOURLY_LIMIT = Number.isFinite(Number(process.env.MOCK_HOURLY_LIMIT)) && Number(process.env.MOCK_HOURLY_LIMIT) > 0
  ? Number(process.env.MOCK_HOURLY_LIMIT) : Math.max(1, 200 * USERS);
const ALARM_PCT = Number.isFinite(Number(process.env.MOCK_ALARM_PCT)) && Number(process.env.MOCK_ALARM_PCT) > 0
  ? Number(process.env.MOCK_ALARM_PCT) : 80;
const HOUR_MS = 60 * 60 * 1000;

// Conta 1 chamada Graph: no ciclo do post E no log horario (limite code 4).
// Recebe o store ja carregado, NAO salva (o caller salva). label ex: "POST /media".
function bumpCall(s, label) {
  s.callCount = (s.callCount || 0) + 1;
  if (!s.callsByKind) s.callsByKind = {};
  s.callsByKind[label] = (s.callsByKind[label] || 0) + 1;
  if (!s.callLog) s.callLog = [];
  s.callLog.push(Date.now());
}

// Chamadas na ULTIMA HORA (janela do code 4, o limite ativo). Poda o log.
function hourlyUsage(s) {
  const cutoff = Date.now() - HOUR_MS;
  s.callLog = (s.callLog || []).filter((t) => t >= cutoff);
  const used = s.callLog.length;
  const alarmAt = Math.round(HOURLY_LIMIT * ALARM_PCT / 100);
  return {
    used, limit: HOURLY_LIMIT, alarmAt, users: USERS,
    over: used > alarmAt, pct: Math.min(100, Math.round((used / HOURLY_LIMIT) * 100)),
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
  // path.sep no sufixo evita o bypass de prefixo irmao (/repo vs /repo-x)
  if (!filePath.startsWith(SERVE_ROOT + path.sep)) return send(res, 403, "forbidden");
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "not found: " + urlPath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
}

// Valida que a midia do container e alcancavel, como o IG real faz (ele baixa
// a image_url/video_url na criacao do container; URL quebrada = erro 9004).
// So checa URLs locais (o proprio mock servindo do disco): URL externa ou de
// host fake (http://x/...) passa sem checagem, pra nao bater na internet nem
// quebrar testes unitarios que usam URLs de mentira de hosts nao-locais.
// Retorna null se OK/pulado, ou a string de erro.
async function checkLocalMedia(mediaUrl) {
  if (!mediaUrl) return null;
  let u;
  try { u = new URL(mediaUrl); } catch { return `URL invalida: ${mediaUrl}`; }
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(mediaUrl, { method: "HEAD", signal: ctl.signal });
    clearTimeout(timer);
    if (r.status >= 400) return `HTTP ${r.status} ao buscar ${mediaUrl}`;
    return null;
  } catch (e) {
    return `falha ao buscar ${mediaUrl}: ${e.message}`;
  }
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
    if (pathname === "/_mock/fbfeed") { const s = load(); return sendJson(res, 200, s.fbfeed || []); }
    if (pathname === "/_mock/fbstories") { const s = load(); return sendJson(res, 200, s.fbStories || []); }
    if (pathname === "/_mock/fbreels") { const s = load(); return sendJson(res, 200, s.fbReels || []); }
    if (pathname === "/_mock/usage") {
      // medidor horario: chamadas na ultima hora vs ~200 (limite real do code 4)
      const s = load(); const u = hourlyUsage(s); save(s); return sendJson(res, 200, u);
    }
    if (pathname === "/_mock/state") { return sendJson(res, 200, load()); }
    if (pathname === "/_mock/control") { const s = load(); return sendJson(res, 200, s.control || { fail: null, storyPolls: 0 }); }
    if (pathname === "/_mock/reset" && method === "POST") { return sendJson(res, 200, reset()); }

    // simula o Andre apagando um post no app do IG: o post some do feed/
    // stories/reels e o GET /:postId passa a devolver code 100, exatamente o
    // sinal que o ig-detect-deleted usa pra alimentar a denylist.
    if (pathname === "/_mock/delete" && method === "POST") {
      const b = await readBody(req); const s = load();
      const postId = b.postId;
      if (!postId) return sendJson(res, 400, { error: "postId obrigatorio" });
      const inFeed = (s.feed || []).some((f) => f.postId === postId);
      const inStories = (s.stories || []).some((f) => f.postId === postId);
      const inReels = (s.reels || []).some((f) => f.postId === postId);
      if (!inFeed && !inStories && !inReels && !s.deleted.includes(postId)) {
        return sendJson(res, 404, { error: "postId desconhecido: " + postId });
      }
      if (!s.deleted.includes(postId)) s.deleted.push(postId);
      s.feed = (s.feed || []).filter((f) => f.postId !== postId);
      s.stories = (s.stories || []).filter((f) => f.postId !== postId);
      s.reels = (s.reels || []).filter((f) => f.postId !== postId);
      save(s);
      return sendJson(res, 200, { ok: true, deleted: s.deleted });
    }

    // ---------- sync: puxa os commits novos do Actions (botao Atualizar) ----------
    // Faz git fetch + checkout origin/main -- media/news (mesma logica do
    // launcher), pra o front pegar fila/posts/slides do ultimo commit do bot
    // sem reiniciar o server. So toca media/news, nao mexe no HEAD.
    if (pathname === "/_mock/sync" && method === "POST") {
      const git = (...a) => execFileSync("git", a, { cwd: SERVE_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      try {
        let before = null;
        try { before = git("rev-parse", "origin/main"); } catch {}
        git("fetch", "origin", "main", "--quiet");
        const after = git("rev-parse", "origin/main");
        git("checkout", "origin/main", "--", "media/news");
        let newCommits = 0;
        if (before && before !== after) {
          try { newCommits = parseInt(git("rev-list", "--count", `${before}..${after}`), 10) || 0; }
          catch { newCommits = 0; }
        }
        let lastMsg = "";
        try { lastMsg = git("log", "-1", "--format=%s", after); } catch {}
        return sendJson(res, 200, {
          ok: true,
          changed: before !== after,
          newCommits,
          head: after.slice(0, 7),
          lastMsg,
        });
      } catch (e) {
        const detail = (e.stderr || e.message || String(e)).toString().trim();
        return sendJson(res, 200, { ok: false, error: detail });
      }
    }

    // ---------- curadoria (ponto onde se decide o feed, read-only) ----------
    if (pathname === "/_mock/curation") {
      try { return sendJson(res, 200, await loadCuration()); }
      catch (e) { return sendJson(res, 500, { error: e.message }); }
    }
    // rodadas de curadoria do Claude schedule (commits da routine sonnet)
    if (pathname === "/_mock/curation-runs") {
      try { return sendJson(res, 200, listCurationRuns(10)); }
      catch (e) { return sendJson(res, 500, { error: e.message }); }
    }
    if (pathname === "/_mock/curation-run" && method === "POST") {
      try {
        const b = await readBody(req);
        const ref = b.ref || b.hash;
        if (!ref) return sendJson(res, 400, { error: "ref da rodada obrigatorio" });
        return sendJson(res, 200, curationRunDetail(ref));
      } catch (e) { return sendJson(res, 500, { error: e.message }); }
    }

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
    // lista as ultimas runs do Action (gh CLI) + a PROXIMA (fila atual) no topo
    if (pathname === "/_mock/runs") {
      try {
        const past = await listRuns(6);
        const next = { id: "next", status: "next", createdAt: null, event: "fila atual" };
        return sendJson(res, 200, [next, ...past]);
      } catch (e) {
        // sem gh: ainda mostra a proxima (nao depende do gh)
        return sendJson(res, 200, [{ id: "next", status: "next", createdAt: null, event: "fila atual" }]);
      }
    }
    // simula uma run: gera o slide+caption de cada id que ela tentou postar
    if (pathname === "/_mock/run" && method === "POST") {
      try {
        const b = await readBody(req);
        if (!b.id) return sendJson(res, 400, { error: "id da run obrigatorio" });
        // "next" = a PROXIMA run (o que vai rodar agora, da fila real).
        const detail = b.id === "next" ? await nextRunDetail()
          : await runDetail(b.id, new Map((JSON.parse(fs.readFileSync(path.join(SERVE_ROOT, "media/news/index.json"), "utf8")).items || []).map((x) => [x.id, x])));
        // gera o preview real (slide + caption) de cada id, por batch, e monta
        // o CARROSSEL como iria pro IG, com o custo de chamadas Graph.
        let runCalls = 0;
        for (const batch of detail.batches) {
          batch.posts = [];
          for (const id of batch.ids) {
            try { batch.posts.push(await previewSlide(id)); }
            catch (e) { batch.posts.push({ id, error: e.message }); }
          }
          // o carrossel = capa (Card 11, se >=2 itens) + 1 slide por item.
          const slides = batch.posts.filter((p) => !p.error);
          const hasCover = slides.length >= 2;
          const total = slides.length + (hasCover ? 1 : 0);
          batch.carousel = {
            slideCount: total,
            hasCover,
            // chamadas Graph: 1 POST /media por slide (incl. capa) + 1 do
            // container do carrossel + 1 media_publish. So conta se houver slide.
            apiCalls: total > 0 ? total + 2 : 0,
            sampleCaption: slides[0]?.caption || "",
          };
          // 1 carrossel = 1 post no feed (conta 1 na cota de 50/24h)
          batch.postsToIg = slides.length ? 1 : 0;
          runCalls += batch.carousel.apiCalls;
        }
        detail.totalCalls = runCalls;
        detail.totalPosts = detail.batches.reduce((n, b2) => n + (b2.postsToIg || 0), 0);
        return sendJson(res, 200, detail);
      } catch (e) { return sendJson(res, 500, { error: e.message }); }
    }
    if (pathname === "/_mock/fail" && method === "POST") {
      const b = await readBody(req); const s = load();
      s.control = {
        ...(s.control || {}),
        fail: b.fail && b.fail !== "none" ? b.fail : null,
        storyPolls: Number(b.storyPolls || 0),
        // consistencia eventual do GET /:uid/media: as primeiras N chamadas
        // devolvem lista vazia (post existe mas ainda nao "indexou"). Modela
        // o incidente 2026-06-09, em que a verificacao pos-erro rodou 340ms
        // depois do publish e nao viu o post.
        mediaHideCalls: Number(b.mediaHideCalls || 0),
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

    // ---------- front buildado (dist/) como fallback ----------
    // Se o front foi buildado (mock-ig/web/dist), serve-o aqui, pra rodar o
    // preview sem o dev server do Vite. SPA: rotas desconhecidas caem no index.
    if (method === "GET") {
      const webDist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "web", "dist");
      const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const candidate = path.join(webDist, rel);
      if (candidate.startsWith(webDist + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
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
