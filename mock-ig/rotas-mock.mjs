// Rotas /_mock/* (painel do mock: feed, estado, falhas injetáveis, sync, curadoria, simulador).
import { execFileSync } from "node:child_process";
import { load, save, reset, nextId, STORE_PATH } from "./store.mjs";
import { loadCandidates, previewSlide, nextRunDetail } from "./preview.mjs";
import { listRuns, runDetail } from "./runs.mjs";
import { loadCuration } from "./curation.mjs";
import { listCurationRuns, curationRunDetail } from "./curation-runs.mjs";
import fs from "node:fs";
import path from "node:path";
import { PORT, SERVE_ROOT, MIME, send, sendJson, sendGraph, graphError, failMode, bumpCall, hourlyUsage, readBody, serveFile, checkLocalMedia, USERS, HOURLY_LIMIT, ALARM_PCT } from "./http-util.mjs";

export async function rotasMock(c) {
  const { req, res, pathname, query, method } = c;
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

  return false;
}
