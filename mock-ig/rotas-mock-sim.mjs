// Rotas /_mock/* do simulador: curadoria, candidatos, preview, runs e falhas injetáveis.
import { execFileSync } from "node:child_process";
import { load, save, reset, nextId, STORE_PATH } from "./store.mjs";
import { loadCandidates, previewSlide, nextRunDetail } from "./preview.mjs";
import { listRuns, runDetail } from "./runs.mjs";
import { loadCuration } from "./curation.mjs";
import { listCurationRuns, curationRunDetail } from "./curation-runs.mjs";
import fs from "node:fs";
import path from "node:path";
import { PORT, SERVE_ROOT, MIME, send, sendJson, sendGraph, graphError, failMode, bumpCall, hourlyUsage, readBody, serveFile, checkLocalMedia, USERS, HOURLY_LIMIT, ALARM_PCT } from "./http-util.mjs";

export async function rotasMockSim(c) {
  const { req, res, pathname, query, method } = c;
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
        // o carrossel = capa (Card 11, se >=2 itens) no lugar do slide do
        // lider + 1 slide por item restante. Total = 1 slide por item.
        const slides = batch.posts.filter((p) => !p.error);
        const hasCover = slides.length >= 2;
        const total = slides.length;
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

  return false;
}
