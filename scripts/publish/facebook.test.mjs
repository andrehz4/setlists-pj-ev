// Testes do cliente Facebook Pages (facebook.mjs): publicacao de album no feed
// ponta a ponta contra o mock, ordem das fotos, legenda reusada do IG e
// tratamento de erro/rate limit tipado.
//
// Rodar: node --test scripts/publish/facebook.test.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";

// store + porta proprios (a suite roda arquivos em paralelo: 8796 livre)
process.env.MOCK_IG_STORE = path.join(os.tmpdir(), `mock-ig-fb-${process.pid}.json`);
const PORT = Number(process.env.MOCK_FB_PORT || 8796);
const base = `http://127.0.0.1:${PORT}`;
process.env.MOCK_IG_PORT = String(PORT);
process.env.FB_API_BASE = base;
process.env.FB_PAGE_ID = "pg";
process.env.FB_PAGE_TOKEN = "tok";

const { server, start } = await import("../../mock-ig/server.mjs");
await start(PORT);
after(() => server.close());

const { publishFeedAlbum, uploadUnpublishedPhoto, publishVideoStory, publishVideoReel, FBAPIError, FBRateLimitError } = await import("./facebook.mjs");
const { slideUrlFor } = await import("./instagram.mjs");

async function resetStore() {
  await fetch(`${base}/_mock/reset`, { method: "POST" });
}
async function setFail(fail) {
  // o mock parseia o body como form (application/x-www-form-urlencoded)
  await fetch(`${base}/_mock/fail`, {
    method: "POST",
    body: new URLSearchParams({ fail }),
  });
}
async function getFbFeed() {
  const r = await fetch(`${base}/_mock/fbfeed`);
  return r.json();
}
async function getFbStories() {
  const r = await fetch(`${base}/_mock/fbstories`);
  return r.json();
}
async function getFbReels() {
  const r = await fetch(`${base}/_mock/fbreels`);
  return r.json();
}

const items = [
  { id: "aa1", title_pt: "Pearl Jam anuncia turnê", intro_pt: "Datas no Brasil.", tags: ["turne"] },
  { id: "bb2", title_pt: "Eddie Vedder solo", intro_pt: "Novo show.", tags: ["eddie"] },
];

test("publishFeedAlbum: sobe fotos e cria post do feed (2 items, sem capa)", async () => {
  await resetStore();
  const r = await publishFeedAlbum(items, {});
  assert.ok(r.postId.startsWith("fb_"), "retorna postId do feed");
  assert.equal(r.count, 2);

  const feed = await getFbFeed();
  assert.equal(feed.length, 1, "1 post criado no feed");
  assert.equal(feed[0].photos.length, 2, "2 fotos anexadas ao album");
  assert.deepEqual(feed[0].photos, [slideUrlFor("aa1"), slideUrlFor("bb2")], "ordem das fotos = ordem dos items");
  assert.ok(feed[0].message.includes("DESTAQUES"), "usa a legenda de carrossel do IG");
});

test("publishFeedAlbum: capa entra como primeira foto do album", async () => {
  await resetStore();
  const cover = "https://raw.githubusercontent.example/cover.jpg";
  await publishFeedAlbum(items, { coverImageUrl: cover });

  const feed = await getFbFeed();
  assert.equal(feed[0].photos.length, 3, "capa + 2 slides");
  assert.equal(feed[0].photos[0], cover, "capa e a primeira foto do album");
  assert.deepEqual(feed[0].photos.slice(1), [slideUrlFor("aa1"), slideUrlFor("bb2")], "slides seguem a capa");
});

test("publishFeedAlbum: 1 item usa a legenda single (com CTA)", async () => {
  await resetStore();
  await publishFeedAlbum([items[0]], {});

  const feed = await getFbFeed();
  assert.equal(feed[0].photos.length, 1);
  assert.ok(feed[0].message.includes("leia completo em"), "legenda single tem CTA pro site");
});

test("publishFeedAlbum: respeita slideSuffix nas URLs (ex card02)", async () => {
  await resetStore();
  await publishFeedAlbum(items, { slideSuffix: ".card02" });

  const feed = await getFbFeed();
  assert.deepEqual(feed[0].photos, [slideUrlFor("aa1", ".card02"), slideUrlFor("bb2", ".card02")]);
});

test("publishFeedAlbum: exige FB_PAGE_ID e FB_PAGE_TOKEN", async () => {
  // sem argumentos e sem env, cai no erro de config (aqui limpamos o env que os
  // outros testes usam pra provar que o guard dispara)
  const savedId = process.env.FB_PAGE_ID;
  const savedTok = process.env.FB_PAGE_TOKEN;
  delete process.env.FB_PAGE_ID;
  delete process.env.FB_PAGE_TOKEN;
  try {
    await assert.rejects(() => publishFeedAlbum(items, {}), /obrigatorios/);
  } finally {
    process.env.FB_PAGE_ID = savedId;
    process.env.FB_PAGE_TOKEN = savedTok;
  }
});

test("publishFeedAlbum: items vazio e erro", async () => {
  await assert.rejects(() => publishFeedAlbum([], {}), /items vazio/);
});

test("uploadUnpublishedPhoto: rate limit vira FBRateLimitError tipado", async () => {
  await resetStore();
  await setFail("ratelimit");
  try {
    await assert.rejects(
      () => uploadUnpublishedPhoto({ pageId: "pg", pageToken: "tok", imageUrl: "https://x.example/a.jpg" }),
      (e) => e instanceof FBRateLimitError && e.isRateLimit === true && e.code === 4,
    );
  } finally {
    await setFail("none");
  }
});

test("publishFeedAlbum: erro de rate limit propaga como FBRateLimitError", async () => {
  await resetStore();
  await setFail("ratelimit");
  try {
    await assert.rejects(
      () => publishFeedAlbum(items, {}),
      (e) => e instanceof FBAPIError && e.isRateLimit === true,
    );
  } finally {
    await setFail("none");
  }
});

// ---------- video story ----------

test("publishVideoStory: start/upload/finish publica o story", async () => {
  await resetStore();
  const videoUrl = "https://raw.githubusercontent.example/story.mp4";
  const r = await publishVideoStory({ videoUrl });
  assert.ok(r.postId.startsWith("fbstory_"), "retorna postId do story");
  assert.ok(r.videoId.startsWith("vid_"), "retorna videoId da sessao");

  const stories = await getFbStories();
  assert.equal(stories.length, 1, "1 story publicado");
  assert.equal(stories[0].videoUrl, videoUrl, "o MP4 correto foi anexado (via header file_url)");
});

test("publishVideoStory: exige videoUrl", async () => {
  await assert.rejects(() => publishVideoStory({ videoUrl: "" }), /videoUrl obrigatorio/);
});

test("publishVideoStory: rate limit no start vira FBRateLimitError", async () => {
  await resetStore();
  await setFail("ratelimit");
  try {
    await assert.rejects(
      () => publishVideoStory({ videoUrl: "https://x.example/s.mp4" }),
      (e) => e instanceof FBAPIError && e.isRateLimit === true,
    );
  } finally {
    await setFail("none");
  }
});

// ---------- video reel ----------

test("publishVideoReel: start/upload/finish publica o reel com legenda", async () => {
  await resetStore();
  const videoUrl = "https://raw.githubusercontent.example/reel.mp4";
  const description = "Resumão da semana no Pearl Jam. #pearljam";
  const r = await publishVideoReel({ videoUrl, description });
  assert.ok(r.postId.startsWith("fbreel_"), "retorna postId do reel");

  const reels = await getFbReels();
  assert.equal(reels.length, 1, "1 reel publicado");
  assert.equal(reels[0].videoUrl, videoUrl, "o MP4 correto foi anexado");
  assert.equal(reels[0].description, description, "a legenda (description) foi enviada");
});

test("publishVideoReel: exige FB_PAGE_ID e FB_PAGE_TOKEN", async () => {
  const savedId = process.env.FB_PAGE_ID;
  const savedTok = process.env.FB_PAGE_TOKEN;
  delete process.env.FB_PAGE_ID;
  delete process.env.FB_PAGE_TOKEN;
  try {
    await assert.rejects(() => publishVideoReel({ videoUrl: "https://x.example/r.mp4" }), /obrigatorios/);
  } finally {
    process.env.FB_PAGE_ID = savedId;
    process.env.FB_PAGE_TOKEN = savedTok;
  }
});
