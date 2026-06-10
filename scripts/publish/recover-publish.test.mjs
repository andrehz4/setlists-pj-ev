// Testa a recuperacao pos-erro do publish (o conserto do bug de repost do
// @smufdpj). Cenario real: o IG devolve code 4 subcode 2207051 no media_publish
// MESMO tendo publicado o carrossel. Antes, o cliente tratava como rate limit,
// nunca marcava postedAt, e a proxima janela re-postava o mesmo carrossel.
// Agora, apos o erro, o cliente confere as midias recentes (GET /<uid>/media)
// e, se o post saiu, devolve o id real como sucesso.
//
// Rodar: node --test scripts/publish/recover-publish.test.mjs

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";

// store proprio de teste (nao mexe no _store.json real)
process.env.MOCK_IG_STORE = path.join(os.tmpdir(), `mock-ig-recover-${Date.now()}.json`);

// IMPORTANTE: API_BASE e REPO_PUBLIC_BASE sao capturados no LOAD do instagram.mjs,
// e o server.mjs importa o instagram.mjs de forma transitiva (via preview.mjs).
// Entao as envs precisam estar setadas ANTES de qualquer import. Usamos porta
// FIXA (em vez de efemera) pra saber a base antes de subir o server.
const PORT = Number(process.env.MOCK_RECOVER_PORT || 8793);
const base = `http://127.0.0.1:${PORT}`;
process.env.MOCK_IG_PORT = String(PORT);
process.env.IG_API_BASE = base;
// host NAO-local de proposito: os items deste teste nao tem slide no disco, e
// o mock valida (HEAD) midia de URL local. URL de host fake passa sem checagem.
process.env.REPO_PUBLIC_BASE = "http://mock-assets.invalid";
process.env.IG_USER_ID = "u";
process.env.IG_ACCESS_TOKEN = "tok";
// poll de recuperacao rapido nos testes (producao: 5 tentativas, 10s entre elas)
process.env.IG_RECOVER_ATTEMPTS = "5";
process.env.IG_RECOVER_DELAY_MS = "50";

const { server, start } = await import("../../mock-ig/server.mjs");
await start(PORT);

const { publishItems, recoverPublishedPost, buildCarouselCaption } = await import("./instagram.mjs");
const { markPosted, markAttempt, pickMatureByType } = await import("./queue.mjs");

const form = (obj) => new URLSearchParams(obj).toString();
async function postMock(p, body) {
  const r = await fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  return { status: r.status, body: await r.json() };
}
async function getMock(p) { const r = await fetch(base + p); return { status: r.status, body: await r.json() }; }
const setFail = (mode, extra = {}) => postMock("/_mock/fail", { fail: mode || "none", ...extra });

const items = [
  { id: "a1", title_pt: "Jack Irons volta ao estudio", intro_pt: "Depois da cirurgia, novo disco a caminho." },
  { id: "a2", title_pt: "Fa fotografa a capa de Yield em Montana", intro_pt: "Mais de 20h de estrada pelo cenario." },
];

after(() => server.close());

test("ghostpublish: carrossel publicado-com-erro e recuperado como sucesso, sem duplicar", async () => {
  await postMock("/_mock/reset", {});
  await setFail("ghostpublish"); // publica de verdade MAS devolve code 4 subcode 2207051

  const r = await publishItems(items, {});
  assert.equal(r.recovered, true, "deveria recuperar o post apesar do erro");
  assert.match(r.postId, /^p_/, "deveria devolver o id real do post recuperado");

  const feed = await getMock("/_mock/feed");
  assert.equal(feed.body.length, 1, "deve haver exatamente 1 post no feed (sem duplicata)");
  assert.equal(feed.body[0].postId, r.postId, "o id recuperado deve ser o do post no feed");
});

test("ratelimit puro (post NAO sai): publishItems lanca, nada recuperado", async () => {
  await postMock("/_mock/reset", {});
  await setFail("ratelimit"); // erro ANTES de criar o post

  await assert.rejects(
    () => publishItems(items, {}),
    (e) => e && e.code === 4,
    "deve propagar o erro quando o post realmente nao foi publicado",
  );

  const feed = await getMock("/_mock/feed");
  assert.equal(feed.body.length, 0, "nenhum post deve existir no feed");
});

test("apos recuperar, o item sai do pool de maduros (nao re-posta na proxima janela)", async () => {
  await postMock("/_mock/reset", {});
  await setFail("ghostpublish");

  const r = await publishItems(items, {});
  assert.equal(r.recovered, true);

  // Simula o que o run-publish faz no caminho de sucesso: markPosted com o id
  // recuperado. A partir dai, o item nao volta a ser "maduro".
  const now = new Date().toISOString();
  const queue = {
    items: items.map((it) => ({
      id: it.id, type: "spotlight",
      queuedAt: "2026-01-01T00:00:00.000Z",
      publishAt: "2026-01-01T00:00:00.000Z",
      postedAt: null, postId: null, error: null,
    })),
    postCount: 0,
  };
  assert.equal(pickMatureByType(queue, "spotlight", now).length, 2, "antes de marcar, ambos maduros");
  markPosted(queue, items.map((it) => it.id), r.postId, now);
  assert.equal(pickMatureByType(queue, "spotlight", now).length, 0, "depois de marcar, nenhum maduro: nao re-posta");
});

test("ghostpublish com visibilidade atrasada: poll insiste ate o post indexar no GET /media", async () => {
  await postMock("/_mock/reset", {});
  // post sai + erro 2207051, e o GET /media devolve vazio nas 2 primeiras
  // chamadas (consistencia eventual, como no incidente de 2026-06-09 em que a
  // checagem unica de 340ms nao viu o post e o feed duplicou).
  await setFail("ghostpublish", { mediaHideCalls: 2 });

  const r = await publishItems(items, {});
  assert.equal(r.recovered, true, "poll deveria achar o post na 3a tentativa");

  const feed = await getMock("/_mock/feed");
  assert.equal(feed.body.length, 1, "deve haver exatamente 1 post no feed (sem duplicata)");
  assert.equal(feed.body[0].postId, r.postId);
});

test("guarda cross-run: ghost que escapou de TODO o poll e detectado no run seguinte, sem republicar", async () => {
  await postMock("/_mock/reset", {});
  // esconde o feed por mais chamadas do que o poll tem tentativas: o run
  // "anterior" falha de verdade (post existe, recuperacao nao enxergou).
  await setFail("ghostpublish", { mediaHideCalls: 99 });

  const attemptStartMs = Date.now();
  const caption = buildCarouselCaption(items);
  await assert.rejects(() => publishItems(items, {}), (e) => e && e.code === 4, "run anterior deve falhar");
  const feed1 = await getMock("/_mock/feed");
  assert.equal(feed1.body.length, 1, "o ghost esta no feed apesar do erro");

  // o que o run-publish faz no catch: registra a tentativa na fila
  const queue = {
    items: items.map((it) => ({
      id: it.id, type: "regular",
      queuedAt: "2026-01-01T00:00:00.000Z",
      publishAt: "2026-01-01T00:00:00.000Z",
      postedAt: null, postId: null, error: null,
    })),
    postCount: 0,
  };
  markAttempt(queue, items.map((it) => it.id), caption, new Date(attemptStartMs).toISOString());
  assert.ok(queue.items.every((q) => q._lastAttemptCaption === caption), "tentativa registrada na fila");

  // run seguinte: feed ja indexou (limpa o hide). A guarda cross-run confere
  // ANTES de republicar e acha o ghost pela caption da tentativa anterior.
  await setFail("none");
  const found = await recoverPublishedPost({ caption, sinceMs: attemptStartMs, attempts: 1 });
  assert.match(found, /^p_/, "guarda deveria achar o ghost da tentativa anterior");

  markPosted(queue, items.map((it) => it.id), found, new Date().toISOString());
  assert.equal(pickMatureByType(queue, "regular", new Date().toISOString()).length, 0, "nenhum maduro: nao republica");
  assert.ok(queue.items.every((q) => !q._lastAttemptCaption && !q._lastAttemptAt), "markPosted limpa os campos de tentativa");

  const feed2 = await getMock("/_mock/feed");
  assert.equal(feed2.body.length, 1, "feed segue com 1 post so (sem duplicata)");
});
