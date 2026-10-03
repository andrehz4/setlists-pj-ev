// merge-curated de ponta a ponta numa raiz temporária (SMUFDPJ_RAIZ): é o caminho de produção das
// notícias (a routine cura o _pending e chama este script).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "merge-curated.mjs");
const corpo = (n) => `Parágrafo com acentuação correta, número ${n}, falando de show, disco e história da banda. `.repeat(3);

function montar() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "merge-"));
  const news = path.join(raiz, "media/news");
  fs.mkdirSync(path.join(news, "items"), { recursive: true });
  const pend = (id, extra = {}) => ({ id, url: `https://ex.com/${id}`, source: "x", sourceLabel: "Fonte X", group: "intl",
    pubDate: "2026-10-01T10:00:00Z", img: null, title_orig: `orig ${id}`, ...extra });
  fs.writeFileSync(path.join(news, "_pending.json"), JSON.stringify({ items: [pend("aaa1111111"), pend("bbb2222222", { kind: "community-spotlight", community_author: "fã" }), pend("ccc3333333")] }));
  fs.writeFileSync(path.join(news, "index.json"), JSON.stringify({ items: [{ id: "old0000000", title_pt: "Antiga", pubDate: "2026-09-01T00:00:00Z" }] }));
  fs.writeFileSync(path.join(news, "seen.json"), "{}");
  const curados = [
    { id: "aaa1111111", titulo_pt: "Eddie Vedder anuncia show beneficente em Seattle", titulo_ig: "Eddie em Seattle — de novo", intro_pt: "A apresentação será em novembro.", corpo_pt: corpo(1), tags: ["eddie", "inexistente"] },
    { id: "bbb2222222", titulo_pt: "Fã mostra coleção de ingressos dos anos 90", intro_pt: "São mais de cem ingressos guardados.", corpo_pt: corpo(2), tags: ["comunidade"] },
    { id: "ccc3333333", titulo_pt: "Titulo sem acento nenhum aqui para a trava pegar", intro_pt: "Isso nao deveria passar porque nao tem acento algum no texto todo", corpo_pt: "nao tem acento ".repeat(20), tags: [] },
    { id: "zzz9999999", titulo_pt: "x", intro_pt: "", corpo_pt: "curto", tags: [] },
  ];
  const arq = path.join(raiz, "curados.json");
  fs.writeFileSync(arq, JSON.stringify(curados));
  return { raiz, news, arq };
}

test("merge-curated: publica válidos, barra inválido e sem acento, enfileira e limpa o pendente", () => {
  const { raiz, news, arq } = montar();
  const r = spawnSync(process.execPath, [SCRIPT, "--file", arq], { encoding: "utf8", env: { ...process.env, SMUFDPJ_RAIZ: raiz, GITHUB_STEP_SUMMARY: "" } });
  assert.equal(r.status, 0, r.stderr);
  const index = JSON.parse(fs.readFileSync(path.join(news, "index.json"), "utf8"));
  assert.deepEqual(index.items.map((i) => i.id).sort(), ["aaa1111111", "bbb2222222", "old0000000"]);
  const a = index.items.find((i) => i.id === "aaa1111111");
  assert.equal(a.body_pt, undefined, "index fica leve, corpo vai pra items/");
  assert.deepEqual(a.tags, ["eddie"], "tag inválida sai");
  assert.ok(!a.title_ig.includes("—"), "travessão sai do título do IG");
  const b = index.items.find((i) => i.id === "bbb2222222");
  assert.equal(b.kind, "community-spotlight");
  assert.equal(b.community_author, "fã");
  assert.ok(JSON.parse(fs.readFileSync(path.join(news, "items/aaa1111111.json"), "utf8")).body_pt.length > 100);
  const pend = JSON.parse(fs.readFileSync(path.join(news, "_pending.json"), "utf8"));
  assert.deepEqual(pend.items.map((p) => p.id), ["ccc3333333"], "o recusado pela trava volta pro pendente");
  const seen = JSON.parse(fs.readFileSync(path.join(news, "seen.json"), "utf8"));
  assert.ok(seen.aaa1111111 && seen.bbb2222222 && !seen.ccc3333333);
  const fila = JSON.parse(fs.readFileSync(path.join(news, "_publish-queue.json"), "utf8"));
  assert.deepEqual(fila.items.map((q) => q.id).sort(), ["aaa1111111", "bbb2222222"]);
  const rej = JSON.parse(fs.readFileSync(path.join(news, "_rejected-curated.json"), "utf8"));
  assert.equal(rej.rejected.length, 2, "inválido + trava de acento");
});

test("merge-curated: index corrompido derruba sem gravar por cima", () => {
  const { raiz, news, arq } = montar();
  fs.writeFileSync(path.join(news, "index.json"), '{"items": [');
  const r = spawnSync(process.execPath, [SCRIPT, "--file", arq], { encoding: "utf8", env: { ...process.env, SMUFDPJ_RAIZ: raiz } });
  assert.notEqual(r.status, 0);
  assert.equal(fs.readFileSync(path.join(news, "index.json"), "utf8"), '{"items": [');
});
