import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { lerEstado, gravarEstado, comLista, EstadoCorrompido } from "./estado.mjs";
import { commitAndPush } from "./git.mjs";

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), "lib-test-"));

test("estado: ausente devolve cópia do padrão", async () => {
  const d = await tmp();
  const padrao = { items: [] };
  const a = await lerEstado(path.join(d, "x.json"), padrao);
  a.items.push(1);
  assert.deepEqual(padrao, { items: [] });
});

test("estado: corrompido lança EstadoCorrompido", async () => {
  const d = await tmp();
  const p = path.join(d, "x.json");
  await fs.writeFile(p, '{"items": [');
  await assert.rejects(lerEstado(p, { items: [] }), EstadoCorrompido);
  await fs.writeFile(p, "");
  await assert.rejects(lerEstado(p, { items: [] }), EstadoCorrompido);
});

test("estado: formato inválido lança, válido devolve", async () => {
  const d = await tmp();
  const p = path.join(d, "x.json");
  await gravarEstado(p, { outra: 1 });
  await assert.rejects(lerEstado(p, {}, { valida: comLista("items") }), /sem \.items/);
  await gravarEstado(p, { items: [1] });
  assert.deepEqual(await lerEstado(p, {}, { valida: comLista("items") }), { items: [1] });
});

function sh(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}

async function doisClones() {
  const d = await tmp();
  sh(d, "init", "-q", "--bare", "-b", "main", "remoto.git");
  for (const n of ["a", "b"]) {
    sh(d, "clone", "-q", "remoto.git", n);
    sh(path.join(d, n), "config", "user.email", "t@t");
    sh(path.join(d, n), "config", "user.name", "t");
  }
  await fs.writeFile(path.join(d, "a", "s.json"), "{}\n");
  sh(path.join(d, "a"), "add", ".");
  sh(path.join(d, "a"), "commit", "-qm", "base");
  sh(path.join(d, "a"), "push", "-q", "origin", "HEAD:main");
  sh(path.join(d, "b"), "pull", "-q", "origin", "main");
  sh(path.join(d, "b"), "branch", "-q", "--set-upstream-to=origin/main");
  sh(path.join(d, "a"), "branch", "-q", "--set-upstream-to=origin/main");
  return d;
}

async function emRepo(dir, fn) {
  const antes = process.cwd();
  process.chdir(dir);
  try { return await fn(); } finally { process.chdir(antes); }
}

test("git: dry não commita; sem mudança não commita", async () => {
  const d = await doisClones();
  const a = path.join(d, "a");
  await fs.writeFile(path.join(a, "s.json"), '{"x":1}\n');
  assert.equal(await emRepo(a, () => commitAndPush(["s.json"], "m", { dry: true })), false);
  sh(a, "checkout", "-q", "s.json");
  assert.equal(await emRepo(a, () => commitAndPush(["s.json"], "m")), false);
});

test("git: conflito aborta o rebase, reconcilia e publica", async () => {
  const d = await doisClones();
  const a = path.join(d, "a"), b = path.join(d, "b");
  await fs.writeFile(path.join(b, "s.json"), '{"de":"b"}\n');
  sh(b, "commit", "-qam", "b");
  sh(b, "push", "-q");
  await fs.writeFile(path.join(a, "s.json"), '{"de":"a"}\n');
  let reconciliou = 0;
  const ok = await emRepo(a, () => commitAndPush(["s.json"], "a", {
    esperaBaseMs: 1,
    onRebaseConflict: async () => {
      reconciliou++;
      sh(a, "reset", "-q", "--hard", "origin/main");
      await fs.writeFile(path.join(a, "s.json"), '{"de":"a+b"}\n');
      return true;
    },
  }));
  assert.equal(ok, true);
  assert.equal(reconciliou, 1);
  assert.ok(!(await fs.stat(path.join(a, ".git", "rebase-merge")).catch(() => null)), "rebase pendurado");
  sh(b, "pull", "-q");
  assert.equal((await fs.readFile(path.join(b, "s.json"), "utf8")).trim(), '{"de":"a+b"}');
});

test("git: conflito sem reconciliador não deixa rebase pendurado e lança", async () => {
  const d = await doisClones();
  const a = path.join(d, "a"), b = path.join(d, "b");
  await fs.writeFile(path.join(b, "s.json"), '{"de":"b"}\n');
  sh(b, "commit", "-qam", "b");
  sh(b, "push", "-q");
  await fs.writeFile(path.join(a, "s.json"), '{"de":"a"}\n');
  await assert.rejects(emRepo(a, () => commitAndPush(["s.json"], "a", { esperaBaseMs: 1, tentativas: 2 })), /push falhou/);
  assert.ok(!(await fs.stat(path.join(a, ".git", "rebase-merge")).catch(() => null)), "rebase pendurado");
});

test("telegram: trunca, escolhe modo e nunca lança", async () => {
  const { enviarTelegram, escHtml } = await import("./telegram.mjs");
  const chamadas = [];
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    chamadas.push({ url, corpo: new URLSearchParams(init.body) });
    return { status: 200, json: async () => ({ ok: true }) };
  };
  try {
    assert.equal(await enviarTelegram("oi", { token: "", chat: "" }), false);
    assert.equal(await enviarTelegram("x".repeat(5000), { token: "t", chat: "c" }), true);
    assert.ok(chamadas[0].corpo.get("text").endsWith("(truncado)"));
    assert.equal(chamadas[0].corpo.get("parse_mode"), "HTML");
    await enviarTelegram("puro", { token: "t", chat: "c", html: false });
    assert.equal(chamadas[1].corpo.get("parse_mode"), null);
    globalThis.fetch = async () => { throw new Error("rede caiu"); };
    assert.equal(await enviarTelegram("oi", { token: "t", chat: "c" }), false);
    assert.equal(escHtml("<a&b>"), "&lt;a&amp;b&gt;");
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test("brt: dia, número do dia e hora em Brasília", async () => {
  const { diaBRT, numeroDiaBRT, horaBRT, emBRT } = await import("./brt.mjs");
  const d = new Date("2026-10-03T02:30:00Z"); // 23:30 de 02/10 em Brasília
  assert.equal(diaBRT(d), "2026-10-02");
  assert.equal(emBRT(d).getUTCHours(), 23);
  assert.equal(numeroDiaBRT(d), Math.floor((d.getTime() - 3 * 3600e3) / 864e5));
  assert.equal(horaBRT(d), "23:30");
});
