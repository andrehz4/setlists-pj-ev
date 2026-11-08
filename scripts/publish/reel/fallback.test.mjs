// Fallback do reel (2026-11-08: container preso em IN_PROGRESS derrubou o reel): 2º container, retomada e janela.
// Rodar: node --test scripts/publish/reel/fallback.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pastaTemp } from "../../lib/pasta-temp.mjs";

process.env.MOCK_IG_STORE = path.join(pastaTemp("smufdpj-teste-"), `mock-ig-fallback-${process.pid}.json`);
const PORT = Number(process.env.MOCK_FALLBACK_PORT || 8797);
const base = `http://127.0.0.1:${PORT}`;
Object.assign(process.env, { MOCK_IG_PORT: String(PORT), IG_API_BASE: base, IG_USER_ID: "u", IG_ACCESS_TOKEN: "tok" });
const { server, start } = await import("../../../mock-ig/server.mjs");
await start(PORT);
after(() => server.close());

const { publishReelComFallback, ReelFalhou } = await import("./fallback.mjs");
const { retomarPendente } = await import("./retomar.mjs");
const { acharPendente, entradaFalha, foraDaJanela, VALIDADE_MS } = await import("./pendente.mjs");
const { emBRT } = await import("../../lib/brt.mjs");

const mock = (p, body = {}) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(body).toString() });
const reels = async () => (await fetch(`${base}/_mock/reels`)).json();
const CAPTION = "reel da semana com legenda longa o bastante pra bater o prefixo de sessenta caracteres do matcher";
const rapido = { esperasMs: [150, 150], intervalMs: 20 };

// dublês: container 1 nunca fica pronto, o 2 fica
function duble({ publicaErro = false } = {}) {
  const chamadas = { criados: [], publicados: [] };
  return { chamadas, deps: {
    createReelContainer: async () => { const id = `c_${chamadas.criados.length + 1}`; chamadas.criados.push(id); return id; },
    waitContainerReady: async ({ containerId }) => { if (containerId === "c_1") throw new Error("nao ficou pronto"); },
    publicarComRecuperacao: async ({ creationId }) => {
      if (publicaErro) throw new Error("code 4 subcode 2207051");
      chamadas.publicados.push(creationId); return { postId: `p_${creationId}` };
    },
  } };
}

test("fallback: container 1 trava, o 2º container do mesmo vídeo publica", async () => {
  const { chamadas, deps } = duble();
  const r = await publishReelComFallback({ videoUrl: "http://x/r.mp4", caption: CAPTION, deps });
  assert.equal(r.tentativa, 2);
  assert.deepEqual(chamadas.criados, ["c_1", "c_2"]);
  assert.deepEqual(chamadas.publicados, ["c_2"], "publica só um container");
});

test("fallback: erro no publish NÃO cria outro container (evita reel duplicado no falso-erro 2207051)", async () => {
  const { chamadas, deps } = duble({ publicaErro: true });
  deps.waitContainerReady = async () => {};
  await assert.rejects(publishReelComFallback({ videoUrl: "http://x/r.mp4", caption: CAPTION, deps }),
    (e) => e instanceof ReelFalhou && e.publicando === true && e.containerIds.length === 1);
  assert.equal(chamadas.criados.length, 1);
});

test("fallback: tudo preso → ReelFalhou com os 2 containers guardados e nada publicado", async () => {
  await mock("/_mock/reset");
  await mock("/_mock/fail", { fail: "none", storyPolls: "100000" });
  await assert.rejects(publishReelComFallback({ videoUrl: "http://fake/r.mp4", caption: CAPTION, ...rapido }),
    (e) => e instanceof ReelFalhou && e.containerIds.length === 2 && !e.publicando);
  assert.equal((await reels()).length, 0);
  await mock("/_mock/fail", { fail: "none", storyPolls: "0" });
});

test("retomar: IG terminou de processar → publica o MESMO container, sem criar outro, e fecha o log", async () => {
  await mock("/_mock/reset");
  await mock("/_mock/fail", { fail: "none", storyPolls: "100000" });
  const items = [{ id: "n1", title_pt: "Notícia 1" }];
  const falha = await publishReelComFallback({ videoUrl: "http://fake/r.mp4", caption: CAPTION, ...rapido }).catch((e) => e);
  const now = new Date();
  const log = { entries: [entradaFalha({ now, weekKey: "2026-W45", items, track: { name: "t.mp3" }, accent: "#000",
    rangeLabel: "2 a 8 nov", videoUrl: "http://fake/r.mp4", caption: CAPTION, thumbOffsetMs: 5500, erro: falha })] };
  await mock("/_mock/fail", { fail: "none", storyPolls: "0" }); // o IG acabou de processar
  const commits = [];
  const ok = await retomarPendente({ log, weekKey: "2026-W45", agoraMs: now.getTime() + 3600e3,
    commit: async (_, msg) => commits.push(msg), deps: { gravar: async () => {} } });
  assert.equal(ok, true);
  const [reel] = await reels();
  assert.equal(reel.caption, CAPTION);
  assert.equal(log.entries[0].postId, reel.postId);
  assert.equal(log.entries[0].containerId, falha.containerIds[0], "reaproveitou o 1º container");
  assert.match(commits[0], /retomado 2026-W45/);
  assert.equal(acharPendente(log, "2026-W45", now.getTime()), null, "com postId a semana não tem mais pendência");
});

// container que o IG não conhece (expirou): status "?" → nenhum container serve
const semContainer = (extra) => ({ entries: [{ weekKey: "2026-W45", runAt: new Date().toISOString(), containerIds: ["c_expirado"],
  videoUrl: "https://midia/reels/w45.mp4", caption: CAPTION, resumo: [], track: "t.mp3", rangeLabel: "x", ...extra }] });

test("retomar vídeo APROVADO: container morto → containers novos do MESMO MP4, sem renderizar outro", async () => {
  const log = semContainer({ aprovado: true, thumbOffsetMs: 5500 });
  const chamou = [];
  const ok = await retomarPendente({ log, weekKey: "2026-W45", agoraMs: Date.now(), commit: async () => {}, esperaMs: 100,
    deps: { gravar: async () => {}, publishReelComFallback: async (a) => { chamou.push(a); return { postId: "p_novo", containerId: "c_novo" }; } } });
  assert.equal(ok, true);
  assert.deepEqual(chamou, [{ videoUrl: "https://midia/reels/w45.mp4", caption: CAPTION, thumbOffsetMs: 5500 }]);
  assert.equal(log.entries[0].postId, "p_novo");
});

test("retomar SEM aprovação: container morto → devolve false (segue o fluxo normal, com render)", async () => {
  const chamou = [];
  const ok = await retomarPendente({ log: semContainer({}), weekKey: "2026-W45", agoraMs: Date.now(), commit: async () => {},
    deps: { gravar: async () => {}, publishReelComFallback: async (a) => { chamou.push(a); return {}; } } });
  assert.equal(ok, false);
  assert.equal(chamou.length, 0);
});

test("pendente: só entrada da semana, sem postId, retomável e dentro da validade", () => {
  const agora = Date.parse("2026-11-08T21:00:00Z");
  const e = (x) => ({ weekKey: "2026-W45", runAt: new Date(agora - 3600e3).toISOString(), containerIds: ["c1"],
    videoUrl: "v", caption: "c", ...x });
  const achou = (...es) => acharPendente({ entries: es }, "2026-W45", agora);
  assert.ok(achou(e({})));
  assert.equal(achou(e({ postId: "p" })), null);
  assert.equal(achou(e({ semRetomar: true })), null, "erro no publish: ninguém retoma sozinho");
  assert.equal(achou(e({ weekKey: "2026-W44" })), null);
  assert.equal(achou(e({ containerIds: [] })), null);
  assert.equal(achou(e({ runAt: new Date(agora - VALIDADE_MS - 1000).toISOString() })), null, "container vence em 24 h");
});

test("janela: rodada atrasada que cai na segunda (BRT) não publica a semana seguinte", () => {
  assert.equal(foraDaJanela(emBRT(new Date("2026-11-09T02:59:00Z"))), false); // domingo 23:59 BRT
  assert.equal(foraDaJanela(emBRT(new Date("2026-11-09T03:01:00Z"))), true); // segunda 00:01 BRT
  assert.equal(foraDaJanela(emBRT(new Date("2026-11-08T12:07:00Z"))), false);
});
