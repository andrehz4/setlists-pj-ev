// Testa o fluxo de deteccao de posts apagados (ig-detect-deleted) contra o
// mock: publica um post, apaga via /_mock/delete (como o Andre faria no app)
// e confere que checkPostExists enxerga o sinal de "deleted" (code 100) que
// alimenta a denylist. NAO usa detectDeletedPosts inteiro de proposito: ele
// escreve no cache real (media/news/_ig-exists-cache.json) e o teste nao pode
// tocar estado de producao.
//
// Rodar: node --test scripts/publish/detect-deleted.test.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";

// store proprio de teste (nao mexe no _store.json real)
process.env.MOCK_IG_STORE = path.join(os.tmpdir(), `mock-ig-detect-${Date.now()}.json`);

// API_BASE e capturado no LOAD do ig-detect-deleted.mjs: env antes do import.
// Porta fixa propria (8794) pra nao colidir com o recover-publish (8793),
// ja que o node --test roda os arquivos em paralelo.
const PORT = Number(process.env.MOCK_DETECT_PORT || 8794);
const base = `http://127.0.0.1:${PORT}`;
process.env.MOCK_IG_PORT = String(PORT);
process.env.IG_API_BASE = base;
process.env.IG_USER_ID = "u";
process.env.IG_ACCESS_TOKEN = "tok";

const { server, start } = await import("../../mock-ig/server.mjs");
await start(PORT);

const { checkPostExists } = await import("./ig-detect-deleted.mjs");

const form = (obj) => new URLSearchParams(obj).toString();
async function postMock(p, body) {
  const r = await fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  return { status: r.status, body: await r.json() };
}

after(() => server.close());

test("post vivo: checkPostExists devolve exists=true", async () => {
  await postMock("/_mock/reset", {});
  const c = await postMock("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg" });
  const pub = await postMock("/u/media_publish", { creation_id: c.body.id });
  const r = await checkPostExists({ postId: pub.body.id, accessToken: "tok" });
  assert.deepEqual(r, { exists: true });
});

test("post apagado no app: checkPostExists devolve exists=false reason=deleted", async () => {
  await postMock("/_mock/reset", {});
  const c = await postMock("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg" });
  const pub = await postMock("/u/media_publish", { creation_id: c.body.id });
  await postMock("/_mock/delete", { postId: pub.body.id });
  const r = await checkPostExists({ postId: pub.body.id, accessToken: "tok" });
  assert.equal(r.exists, false);
  assert.equal(r.reason, "deleted");
});
