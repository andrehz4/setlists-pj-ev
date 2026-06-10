// Testa o mock Graph API ponta a ponta sem o pipeline: sobe o server numa
// porta efemera, simula o fluxo carrossel (media x N + media_publish) e story
// (media STORIES + poll de status + publish), e a injecao de rate limit.
// Rodar: node --test mock-ig/mock.test.mjs

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";

// store proprio de teste (nao mexe no _store.json real)
process.env.MOCK_IG_STORE = path.join(os.tmpdir(), `mock-ig-test-${Date.now()}.json`);

const { server, start } = await import("./server.mjs");
let base;

before(async () => {
  await start(0); // porta efemera
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const form = (obj) => new URLSearchParams(obj).toString();
async function post(p, body) {
  const r = await fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  return { status: r.status, body: await r.json() };
}
async function get(p) { const r = await fetch(base + p); return { status: r.status, body: await r.json() }; }

test("simulador: candidates separa por tipo e status (read-only)", async () => {
  const r = await get("/_mock/candidates");
  assert.equal(r.status, 200);
  // estrutura esperada (valores dependem do estado real do repo, so checa shape)
  assert.ok(r.body.pending && r.body.posted && Array.isArray(r.body.stories));
  for (const grp of [r.body.pending, r.body.posted]) {
    assert.ok(Array.isArray(grp.regular) && Array.isArray(grp.spotlight) && Array.isArray(grp.digest));
    // nenhum cd-/cs- classificado como regular
    for (const it of grp.regular) {
      assert.ok(!it.id.startsWith("cd-") && !it.id.startsWith("cs-"), `regular mal-classificado: ${it.id}`);
    }
    // max 3 por grupo
    assert.ok(grp.regular.length <= 3 && grp.spotlight.length <= 3 && grp.digest.length <= 3);
  }
});

test("simulador: preview gera slide + caption sem tocar a fila", async () => {
  const cand = await get("/_mock/candidates");
  const all = [
    ...cand.body.pending.regular, ...cand.body.pending.spotlight, ...cand.body.pending.digest,
    ...cand.body.posted.regular, ...cand.body.posted.spotlight, ...cand.body.posted.digest,
  ];
  if (all.length === 0) return; // repo sem itens: nada a testar
  const r = await post("/_mock/preview", { id: all[0].id });
  assert.equal(r.status, 200);
  assert.ok(r.body.slideUrl.includes("_preview"), "slide deve ir pra _preview");
  assert.ok(r.body.caption && r.body.caption.includes("#pearljam"), "caption deve ter hashtags");
});

test("simulador: preview de id inexistente retorna erro tratado", async () => {
  const r = await post("/_mock/preview", { id: "id-que-nao-existe-xyz" });
  assert.equal(r.status, 500);
  assert.ok(r.body.error);
});

test("carrossel: 2 containers + carousel + publish vira post no feed", async () => {
  await post("/_mock/reset", {});
  const c1 = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg", is_carousel_item: "true" });
  const c2 = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/2.jpg", is_carousel_item: "true" });
  assert.match(c1.body.id, /^c_/);
  const car = await post("/u/media", { media_type: "CAROUSEL", children: `${c1.body.id},${c2.body.id}`, caption: "ola" });
  const pub = await post("/u/media_publish", { creation_id: car.body.id });
  assert.match(pub.body.id, /^p_/);
  const feed = await get("/_mock/feed");
  assert.equal(feed.body.length, 1);
  assert.equal(feed.body[0].slides.length, 2);
  assert.equal(feed.body[0].caption, "ola");
});

test("story: container STORIES + status FINISHED + publish vira story", async () => {
  await post("/_mock/reset", {});
  const c = await post("/u/media", { media_type: "STORIES", video_url: "http://x/v.mp4" });
  const st = await get(`/${c.body.id}?fields=status_code,status`);
  assert.equal(st.body.status_code, "FINISHED");
  const pub = await post("/u/media_publish", { creation_id: c.body.id });
  const stories = await get("/_mock/stories");
  assert.equal(stories.body.length, 1);
  assert.equal(stories.body[0].videoUrl, "http://x/v.mp4");
});

test("content_publishing_limit reporta uso no shape oficial (data[])", async () => {
  await post("/_mock/reset", {});
  const c = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg" });
  await post("/u/media_publish", { creation_id: c.body.id });
  const q = await get("/u/content_publishing_limit?fields=quota_usage,config");
  assert.ok(Array.isArray(q.body.data), "resposta deve vir embrulhada em data[]");
  assert.equal(q.body.data[0].quota_usage, 1);
  assert.equal(q.body.data[0].config.quota_total, 50);
});

test("story com polling: IN_PROGRESS ate FINISHED apos N polls", async () => {
  await post("/_mock/reset", {});
  await post("/_mock/fail", { storyPolls: "2" }); // video so fica pronto apos 2 polls
  const c = await post("/u/media", { media_type: "STORIES", video_url: "http://x/v.mp4" });
  const p1 = await get(`/${c.body.id}?fields=status_code,status`);
  assert.equal(p1.body.status_code, "IN_PROGRESS");
  const p2 = await get(`/${c.body.id}?fields=status_code,status`);
  assert.equal(p2.body.status_code, "FINISHED");
  await post("/_mock/fail", { storyPolls: "0" }); // limpa pros outros testes
});

test("injecao ratelimit retorna code 4", async () => {
  const c = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg" });
  const pub = await post("/u/media_publish?fail=ratelimit", { creation_id: c.body.id });
  assert.equal(pub.status, 429);
  assert.equal(pub.body.error.code, 4);
  assert.equal(pub.body.error.error_subcode, 2207051);
});

test("reel: container REELS + publish vira reel", async () => {
  await post("/_mock/reset", {});
  const c = await post("/u/media", { media_type: "REELS", video_url: "http://x/r.mp4", caption: "meu reel" });
  const pub = await post("/u/media_publish", { creation_id: c.body.id });
  assert.match(pub.body.id, /^p_/);
  const reels = await get("/_mock/reels");
  assert.equal(reels.body.length, 1);
  assert.equal(reels.body[0].videoUrl, "http://x/r.mp4");
  assert.equal(reels.body[0].caption, "meu reel");
});

test("quota saturada via fail: usage volta 49", async () => {
  await post("/_mock/reset", {});
  await post("/_mock/fail", { fail: "quota" });
  const q = await get("/u/content_publishing_limit?fields=quota_usage,config");
  assert.equal(q.body.data[0].quota_usage, 49);
  await post("/_mock/fail", { fail: "none" });
});

test("control reflete o fail setado", async () => {
  await post("/_mock/fail", { fail: "videoerror" });
  const c = await get("/_mock/control");
  assert.equal(c.body.fail, "videoerror");
  await post("/_mock/fail", { fail: "none" });
  const c2 = await get("/_mock/control");
  assert.equal(c2.body.fail, null);
});

test("post deletado via /_mock/delete some do feed e retorna code 100 no exists", async () => {
  await post("/_mock/reset", {});
  const c = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg" });
  const pub = await post("/u/media_publish", { creation_id: c.body.id });
  // antes de apagar: exists OK e post no feed
  const ok = await get(`/${pub.body.id}?fields=id`);
  assert.equal(ok.body.id, pub.body.id);
  assert.equal((await get("/_mock/feed")).body.length, 1);
  // apaga (como o Andre faria no app) e confere o sinal do ig-detect-deleted
  const del = await post("/_mock/delete", { postId: pub.body.id });
  assert.equal(del.status, 200);
  const gone = await get(`/${pub.body.id}?fields=id`);
  assert.equal(gone.status, 400);
  assert.equal(gone.body.error.code, 100);
  assert.equal((await get("/_mock/feed")).body.length, 0, "post apagado some do feed");
});

test("delete de postId desconhecido retorna 404", async () => {
  const r = await post("/_mock/delete", { postId: "p_nao_existe" });
  assert.equal(r.status, 404);
});

test("publish de container de video ainda IN_PROGRESS e recusado (code 9007)", async () => {
  await post("/_mock/reset", {});
  await post("/_mock/fail", { storyPolls: "2" }); // video nasce IN_PROGRESS
  const c = await post("/u/media", { media_type: "STORIES", video_url: "http://x/v.mp4" });
  const pub = await post("/u/media_publish", { creation_id: c.body.id });
  assert.equal(pub.status, 400);
  assert.equal(pub.body.error.code, 9007);
  await post("/_mock/fail", { storyPolls: "0" });
});

test("carrossel com menos de 2 children e recusado", async () => {
  await post("/_mock/reset", {});
  const c1 = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg", is_carousel_item: "true" });
  const car = await post("/u/media", { media_type: "CAROUSEL", children: c1.body.id, caption: "so um" });
  assert.equal(car.status, 400);
  assert.equal(car.body.error.code, 100);
});

test("caption acima de 2200 chars e recusada na criacao do container", async () => {
  const r = await post("/u/media", { media_type: "IMAGE", image_url: "http://x/1.jpg", caption: "x".repeat(2201) });
  assert.equal(r.status, 400);
  assert.match(r.body.error.message, /caption too long/i);
});

test("media local inacessivel (404) e recusada com code 9004; local existente passa", async () => {
  await post("/_mock/reset", {});
  const bad = await post("/u/media", { media_type: "IMAGE", image_url: `${base}/media/nao-existe-xyz.jpg` });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 9004);
  // arquivo que existe no repo, servido pelo proprio mock
  const good = await post("/u/media", { media_type: "IMAGE", image_url: `${base}/media/news/index.json` });
  assert.match(good.body.id, /^c_/);
});

test("erro Graph tambem carrega o header x-app-usage", async () => {
  const r = await fetch(base + "/u/media_publish?fail=ratelimit", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ creation_id: "c_x" }),
  });
  assert.equal(r.status, 429);
  const usage = JSON.parse(r.headers.get("x-app-usage"));
  assert.ok(usage.call_count != null);
});
