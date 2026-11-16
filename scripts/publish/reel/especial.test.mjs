import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { publicarEspecial } from "./especial.mjs";

function pastaTeste(doc) {
  const nome = `_teste-especial-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
  const dir = naRaiz(path.join("reels-especiais", nome));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "publicar.json"), JSON.stringify(doc));
  return { nome, dir, ler: () => JSON.parse(fs.readFileSync(path.join(dir, "publicar.json"), "utf8")), limpar: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const deps = (log) => ({
  publishReelComFallback: async (a) => { log.push(["ig", a.videoUrl]); return { postId: "P1", containerId: "C1" }; },
  espelharNoFacebook: async () => { log.push(["fb"]); return "F1"; },
  commitAndPush: async () => log.push(["git"]),
  enviarTelegram: async (t) => log.push(["tg", t]),
});

test("publica, grava o resultado e não posta de novo na segunda vez", async () => {
  const p = pastaTeste({ videoUrl: "https://x/v.mp4", legenda: "oi" });
  try {
    const log = [];
    const r = await publicarEspecial(p.nome, { deps: deps(log) });
    assert.equal(r.postId, "P1");
    assert.equal(p.ler().publicado.fbPostId, "F1");
    const log2 = [];
    await publicarEspecial(p.nome, { deps: deps(log2) });
    assert.equal(log2.length, 0, "segunda rodada não pode chamar o IG");
  } finally { p.limpar(); }
});

test("falha no IG avisa no Telegram e não marca como publicado", async () => {
  const p = pastaTeste({ videoUrl: "https://x/v.mp4", legenda: "oi" });
  try {
    const log = [];
    const d = { ...deps(log), publishReelComFallback: async () => { throw new Error("IN_PROGRESS"); } };
    await assert.rejects(publicarEspecial(p.nome, { deps: d }), /IN_PROGRESS/);
    assert.ok(log.some(([k, t]) => k === "tg" && /FALHOU/.test(t)));
    assert.equal(p.ler().publicado, undefined);
  } finally { p.limpar(); }
});

test("publicar.json sem videoUrl derruba a run", async () => {
  const p = pastaTeste({ legenda: "oi" });
  try {
    await assert.rejects(publicarEspecial(p.nome, { deps: deps([]) }), /videoUrl/);
  } finally { p.limpar(); }
});
