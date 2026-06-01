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
process.env.REPO_PUBLIC_BASE = base; // slideUrlFor; o mock nao baixa a imagem
process.env.IG_USER_ID = "u";
process.env.IG_ACCESS_TOKEN = "tok";

const { server, start } = await import("../../mock-ig/server.mjs");
await start(PORT);

const { publishItems } = await import("./instagram.mjs");
const { markPosted, pickMatureByType } = await import("./queue.mjs");

const form = (obj) => new URLSearchParams(obj).toString();
async function postMock(p, body) {
  const r = await fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  return { status: r.status, body: await r.json() };
}
async function getMock(p) { const r = await fetch(base + p); return { status: r.status, body: await r.json() }; }
const setFail = (mode) => postMock("/_mock/fail", { fail: mode || "none" });

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
