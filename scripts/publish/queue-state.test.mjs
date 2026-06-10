// Testa a blindagem de estado da fila:
//   1. mergeQueueStates: reconciliacao por id apos conflito de rebase
//      (outro workflow commitou a fila enquanto a run rodava). O estado
//      mais avancado vence; item postado JAMAIS volta a pendente.
//   2. readQueue estrito: arquivo corrompido lanca erro (run vermelha)
//      em vez de fallback vazio silencioso que apagava a fila real.
//
// Rodar: node --test scripts/publish/queue-state.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { mergeQueueStates } from "./queue.mjs";

const item = (id, extra = {}) => ({
  id, type: "regular",
  queuedAt: "2026-01-01T00:00:00.000Z",
  publishAt: "2026-01-01T00:00:00.000Z",
  postedAt: null, postId: null, error: null,
  ...extra,
});

test("mergeQueueStates: postedAt local vence pendente remoto (nao perde o publish desta run)", () => {
  const remote = { items: [item("a")], postCount: 5 };
  const local = { items: [item("a", { postedAt: "2026-06-09T12:00:00.000Z", postId: "p_1" })], postCount: 6 };
  const m = mergeQueueStates(remote, local);
  assert.equal(m.items.length, 1);
  assert.equal(m.items[0].postId, "p_1", "postedAt local deve prevalecer");
  assert.equal(m.postCount, 6, "postCount = max dos dois lados");
});

test("mergeQueueStates: postedAt remoto vence pendente local (outro run ja postou)", () => {
  const remote = { items: [item("a", { postedAt: "2026-06-09T12:00:00.000Z", postId: "p_9" })], postCount: 7 };
  const local = { items: [item("a")], postCount: 6 };
  const m = mergeQueueStates(remote, local);
  assert.equal(m.items[0].postId, "p_9", "postado remoto nao pode regredir a pendente");
});

test("mergeQueueStates: itens so-remotos (news-merge enfileirou) e so-locais sao preservados", () => {
  const remote = { items: [item("a"), item("novo-remoto")], postCount: 0 };
  const local = { items: [item("a"), item("novo-local")], postCount: 0 };
  const m = mergeQueueStates(remote, local);
  const ids = m.items.map((i) => i.id).sort();
  assert.deepEqual(ids, ["a", "novo-local", "novo-remoto"]);
});

test("mergeQueueStates: empate (ambos pendentes) fica com o local, que carrega _lastAttempt*", () => {
  const remote = { items: [item("a")], postCount: 0 };
  const local = { items: [item("a", { _lastAttemptAt: "2026-06-09T12:00:00.000Z", _lastAttemptCaption: "cap" })], postCount: 0 };
  const m = mergeQueueStates(remote, local);
  assert.equal(m.items[0]._lastAttemptCaption, "cap");
});

test("mergeQueueStates: backoff/erro local vence pendente remoto (preserva _rateLimitedUntil)", () => {
  const remote = { items: [item("a")], postCount: 0 };
  const local = { items: [item("a", { _rateLimitedUntil: "2026-06-09T16:00:00.000Z", error: { at: "x", msg: "rl" } })], postCount: 0 };
  const m = mergeQueueStates(remote, local);
  assert.ok(m.items[0]._rateLimitedUntil, "backoff nao pode se perder no merge");
});

// readQueue resolve o caminho relativo ao CWD no load do modulo, entao o
// teste roda um subprocesso com cwd num diretorio temporario.
function runReadQueueIn(cwd) {
  const queueModUrl = new URL("./queue.mjs", import.meta.url).href;
  return spawnSync(process.execPath, [
    "-e",
    `import(${JSON.stringify(queueModUrl)}).then(m => m.readQueue()).then(q => { console.log("OK " + q.items.length); }).catch(e => { console.error("ERR " + e.message); process.exit(3); });`,
  ], { cwd, encoding: "utf8" });
}

test("readQueue: arquivo corrompido lanca erro (nao zera a fila silenciosamente)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "queue-corrupt-"));
  fs.mkdirSync(path.join(tmp, "media/news"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "media/news/_publish-queue.json"), '{"items":[{"id":"a"'); // truncado
  const r = runReadQueueIn(tmp);
  assert.equal(r.status, 3, "deve sair com erro");
  assert.match(r.stderr, /corrompido/, "mensagem deve apontar corrupcao");
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("readQueue: arquivo ausente (primeira run) devolve fila vazia sem erro", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "queue-enoent-"));
  const r = runReadQueueIn(tmp);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /OK 0/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
