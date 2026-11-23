// Marcação de contas no reel (user_tags, reel da agenda): marca quando a API aceita; recusou, refaz sem marcar e segue.
// Rodar: node --test scripts/publish/reel/marcacao.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pastaTemp } from "../../lib/pasta-temp.mjs";

process.env.MOCK_IG_STORE = path.join(pastaTemp("smufdpj-teste-"), `mock-ig-marcacao-${process.pid}.json`);
const PORT = Number(process.env.MOCK_MARCACAO_PORT || 8798);
const base = `http://127.0.0.1:${PORT}`;
Object.assign(process.env, { MOCK_IG_PORT: String(PORT), IG_API_BASE: base, IG_USER_ID: "u", IG_ACCESS_TOKEN: "tok" });
const { server, start } = await import("../../../mock-ig/server.mjs");
await start(PORT);
after(() => server.close());

const { publishReelComFallback } = await import("./fallback.mjs");
const mock = (p, body = {}) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(body).toString() });
const reels = async () => (await fetch(`${base}/_mock/reels`)).json();
const CAPTION = "Onde tem Pearl Jam ao vivo essa semana? legenda longa o bastante pro matcher de sessenta caracteres";
const rapido = { esperasMs: [500, 500], intervalMs: 20 };

test("reel com user_tags: banda e casa marcadas no vídeo (só username, vídeo não tem posição)", async () => {
  await mock("/_mock/reset");
  await mock("/_mock/fail", { fail: "none", storyPolls: "0" });
  const r = await publishReelComFallback({ videoUrl: "http://fake/a.mp4", caption: CAPTION, userTags: ["pearljamsp", "santorockbar"], ...rapido });
  assert.equal(r.marcou, true);
  assert.deepEqual((await reels())[0].userTags, [{ username: "pearljamsp" }, { username: "santorockbar" }]);
});

test("IG recusa a marcação no reel: refaz sem marcar e publica um só", async () => {
  await mock("/_mock/reset");
  await mock("/_mock/fail", { fail: "reeltags", storyPolls: "0" });
  const r = await publishReelComFallback({ videoUrl: "http://fake/b.mp4", caption: CAPTION, userTags: ["pearljamsp"], ...rapido });
  assert.equal(r.marcou, false);
  const lista = await reels();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].userTags, null);
  await mock("/_mock/fail", { fail: "none" });
});

test("reel sem userTags (resumão de domingo) continua igual: sem user_tags e sem o campo marcou", async () => {
  await mock("/_mock/reset");
  const r = await publishReelComFallback({ videoUrl: "http://fake/c.mp4", caption: CAPTION, ...rapido });
  assert.equal("marcou" in r, false);
  assert.equal((await reels())[0].userTags, null);
});
