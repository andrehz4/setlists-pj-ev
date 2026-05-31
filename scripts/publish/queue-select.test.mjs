// Testes da selecao/housekeeping da fila e do guard do dedupe.
// Funcoes puras, sem tocar IG API nem disco real. Rodar com `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  pickMatureByType,
  pickMatureByTypeDiverse,
  pruneStalePending,
  markError,
  markPosted,
  MAX_ERRORS,
} from "./queue.mjs";
import { RATE_LIMIT_CODES } from "./instagram.mjs";
import {
  topicSignature,
  similarity,
  checkSimilarInHistory,
} from "../news/dedupe-history.mjs";

const NOW = "2026-05-31T00:00:00.000Z";
const nowMs = new Date(NOW).getTime();
const daysAgo = (n) => new Date(nowMs - n * 24 * 60 * 60 * 1000).toISOString();

// item maduro por padrao (publishAt no passado, regular, nao postado)
function item(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2, 10),
    type: "regular",
    queuedAt: daysAgo(1),
    publishAt: daysAgo(1),
    postedAt: null,
    postId: null,
    error: null,
    ...over,
  };
}

// ---------- A1: item envenenado (errorCount) ----------

test("markError incrementa errorCount; markPosted zera", () => {
  const q = { items: [item({ id: "x" })], postCount: 0 };
  markError(q, ["x"], "falha", NOW);
  markError(q, ["x"], "falha", NOW);
  assert.equal(q.items[0].errorCount, 2);
  markPosted(q, ["x"], "post123", NOW);
  assert.equal(q.items[0].errorCount, 0);
  assert.equal(q.items[0].error, null);
});

test("pickMatureByType exclui item que estourou MAX_ERRORS", () => {
  const ok = item({ id: "ok" });
  const poison = item({ id: "poison", errorCount: MAX_ERRORS });
  const q = { items: [ok, poison], postCount: 0 };
  const picked = pickMatureByType(q, "regular", NOW, 10, null);
  const ids = picked.map((p) => p.id);
  assert.ok(ids.includes("ok"));
  assert.ok(!ids.includes("poison"));
});

// ---------- B1: diversidade por assunto ----------

test("pickMatureByTypeDiverse respeita topicCap=1 por cluster", () => {
  // 3 itens da "saga A", 1 da "saga B", 1 da "saga C"
  const sigs = {
    a1: topicSignature("novo baterista pearl jam revelado ohana setembro"),
    a2: topicSignature("baterista do pearl jam sera anunciado no ohana"),
    a3: topicSignature("stone confirma novo baterista escolhido ohana"),
    b1: topicSignature("olivia vedder anuncia mini tour solo abertura syml"),
    c1: topicSignature("documentario sobre vitalogy ganha data de estreia"),
  };
  const items = ["a1", "a2", "a3", "b1", "c1"].map((id) => item({ id }));
  const q = { items, postCount: 0 };
  const dropped = [];
  const picked = pickMatureByTypeDiverse(q, "regular", NOW, {
    limit: 9,
    signatureFor: (it) => sigs[it.id],
    similarFn: similarity,
    threshold: 0.3,
    topicCap: 1,
    onDropped: (it, reason) => dropped.push([it.id, reason]),
  });
  const ids = picked.map((p) => p.id).sort();
  // 1 da saga A (a1, o primeiro), + b1 + c1
  assert.deepEqual(ids, ["a1", "b1", "c1"]);
  // a2 e a3 adiados
  assert.deepEqual(dropped.map((d) => d[0]).sort(), ["a2", "a3"]);
});

test("pickMatureByTypeDiverse: item sem assinatura passa direto", () => {
  const items = [item({ id: "s1" }), item({ id: "s2" })];
  const q = { items, postCount: 0 };
  const picked = pickMatureByTypeDiverse(q, "regular", NOW, {
    limit: 9,
    signatureFor: () => null, // ninguem tem assinatura
    similarFn: similarity,
    topicCap: 1,
  });
  assert.equal(picked.length, 2);
});

test("pickMatureByTypeDiverse herda filtros (postado, rateLimited, errorCount)", () => {
  const items = [
    item({ id: "posted", postedAt: NOW }),
    item({ id: "rl", _rateLimitedUntil: daysAgo(-1) }), // futuro
    item({ id: "poison", errorCount: MAX_ERRORS }),
    item({ id: "good" }),
  ];
  const q = { items, postCount: 0 };
  const picked = pickMatureByTypeDiverse(q, "regular", NOW, {
    limit: 9, signatureFor: () => null, similarFn: similarity,
  });
  assert.deepEqual(picked.map((p) => p.id), ["good"]);
});

// ---------- B2: expiracao de pendente stale ----------

test("pruneStalePending expira datado 4d, mantem 3d", () => {
  const items = [
    item({ id: "old", queuedAt: daysAgo(5) }),
    item({ id: "fresh", queuedAt: daysAgo(3) }),
  ];
  const q = { items, postCount: 0 };
  const removed = pruneStalePending(q, NOW, {
    staleDays: 4, evergreenDays: 30,
    dateFor: (x) => x.queuedAt, isEvergreen: () => false,
  });
  assert.deepEqual(removed.map((r) => r.id), ["old"]);
  assert.deepEqual(q.items.map((i) => i.id), ["fresh"]);
});

test("pruneStalePending: evergreen so expira em 30d", () => {
  const items = [
    item({ id: "mem20", queuedAt: daysAgo(20) }),
    item({ id: "mem40", queuedAt: daysAgo(40) }),
  ];
  const q = { items, postCount: 0 };
  const removed = pruneStalePending(q, NOW, {
    staleDays: 4, evergreenDays: 30,
    dateFor: (x) => x.queuedAt, isEvergreen: () => true,
  });
  assert.deepEqual(removed.map((r) => r.id), ["mem40"]);
});

test("regressao saga baterista: noticia datada de 2+ dias expira, memoria fica", () => {
  // o bug: noticia velha (ex: boato do baterista, 5 dias, tag turne) ficava
  // presa no topo do FIFO. Com staleDays=2, ela sai; conteudo de acervo
  // (tag memoria, prazo 30d) sobrevive mesmo mais velho.
  const items = [
    item({ id: "baterista", queuedAt: daysAgo(5) }),   // datada, nao-evergreen
    item({ id: "acervo", queuedAt: daysAgo(10) }),     // memoria, evergreen
    item({ id: "fresca", queuedAt: daysAgo(1) }),      // datada, dentro do prazo
  ];
  const q = { items, postCount: 0 };
  const evergreen = new Set(["acervo"]);
  const removed = pruneStalePending(q, NOW, {
    staleDays: 2, evergreenDays: 30,
    dateFor: (x) => x.queuedAt,
    isEvergreen: (x) => evergreen.has(x.id),
  });
  assert.deepEqual(removed.map((r) => r.id), ["baterista"]);
  assert.deepEqual(q.items.map((i) => i.id).sort(), ["acervo", "fresca"]);
});

test("pruneStalePending nunca toca postados nem denylist", () => {
  const items = [
    item({ id: "postedOld", queuedAt: daysAgo(40), postedAt: daysAgo(40) }),
    item({ id: "denied", queuedAt: daysAgo(40) }),
  ];
  const q = { items, postCount: 0 };
  const denylist = { deleted: [{ itemId: "denied" }] };
  const removed = pruneStalePending(q, NOW, {
    staleDays: 4, dateFor: (x) => x.queuedAt, isEvergreen: () => false, denylist,
  });
  assert.equal(removed.length, 0);
  assert.equal(q.items.length, 2);
});

// ---------- A3: guard do dedupe em titulo curto ----------

test("dedupe: saga bloqueia, assunto diferente passa", async () => {
  const history = {
    items: [{ id: "h1", postedAt: null }],
  };
  const indexById = new Map([
    ["h1", { id: "h1", title_pt: "Stone Gossard confirma novo baterista do Pearl Jam revelado no Ohana em setembro" }],
  ]);
  // candidato da mesma saga -> bloqueia
  const saga = await checkSimilarInHistory(
    [{ id: "c1", title_pt: "Pearl Jam vai revelar o novo baterista no palco do Ohana em setembro" }],
    { queue: history, indexById, nowMs },
  );
  assert.equal(saga.blocked.length, 1);
  // candidato de assunto diferente -> passa
  const other = await checkSimilarInHistory(
    [{ id: "c2", title_pt: "Olivia Vedder anuncia mini tour solo como abertura do SYML" }],
    { queue: history, indexById, nowMs },
  );
  assert.equal(other.allowed.length, 1);
});

test("dedupe: titulos curtos com 1 nome comum NAO se bloqueiam (guard)", async () => {
  const history = { items: [{ id: "h1", postedAt: null }] };
  const indexById = new Map([
    ["h1", { id: "h1", title_pt: "Matt Cameron anuncia show" }],
  ]);
  const r = await checkSimilarInHistory(
    [{ id: "c1", title_pt: "Matt Cameron toca bateria" }],
    { queue: history, indexById, nowMs },
  );
  // ambos curtos, so "cameron" em comum: guard sobe o corte e libera
  assert.equal(r.allowed.length, 1);
});

// ---------- D1: consistencia das listas de rate-limit codes ----------

test("RATE_LIMIT_CODES contem todos os app-level codes", () => {
  // APP_LEVEL_CODES em run-publish.mjs (nao importavel: o modulo self-executa).
  // Espelhado aqui; o classifier de instagram.mjs PRECISA reconhecer cada um.
  const APP_LEVEL_CODES = [4, 17, 32, 613];
  for (const code of APP_LEVEL_CODES) {
    assert.ok(RATE_LIMIT_CODES.has(code), `RATE_LIMIT_CODES deveria conter ${code}`);
  }
});
