// Regra única do index.json (merge-curated e coletores fora do modo routine).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const item = (id, dia, extra = {}) => ({ id, pubDate: `2026-${dia}T00:00:00Z`, title_pt: id, ...extra });

test("mesclarIndex: sem teto não arquiva nada; novos ficam no topo e sem duplicar", async () => {
  const { mesclarIndex } = await import("./index-site.mjs");
  const atuais = Array.from({ length: 40 }, (_, i) => item(`a${i}`, `01-${String((i % 28) + 1).padStart(2, "0")}`));
  const r = mesclarIndex([item("novo", "10-01"), item("a3", "10-02")], atuais);
  assert.equal(r.finalItems.length, 41, "os coletores cortavam em 30; agora fica tudo");
  assert.equal(r.overflow.length, 0);
  assert.equal(r.finalItems[0].id, "a3");
});

test("mesclarIndex: acima do teto arquiva os mais antigos, nunca os novos (mesmo com data velha)", async () => {
  const { mesclarIndex } = await import("./index-site.mjs");
  const atuais = [item("x1", "09-01"), item("x2", "09-02"), item("x3", "09-03")];
  const r = mesclarIndex([item("novo-velho", "01-01")], atuais, 2);
  assert.deepEqual(r.finalItems.map((i) => i.id).sort(), ["novo-velho", "x3"]);
  assert.deepEqual(r.overflow.map((i) => i.id).sort(), ["x1", "x2"]);
});

test("arquivar + gravarIndex: corpo vai pro arquivo mensal e o index fica leve", () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "idx-"));
  const codigo = `
    const m = await import(${JSON.stringify(new URL("./index-site.mjs", import.meta.url).href)});
    await m.gravarIndex([{ id: "velho", pubDate: "2026-03-05T00:00:00Z", body_pt: "corpo velho" }]);
    await m.arquivar([{ id: "velho", pubDate: "2026-03-05T00:00:00Z" }]);
    await m.gravarIndex([{ id: "novo", pubDate: "2026-10-01T00:00:00Z", body_pt: "corpo novo" }]);`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", codigo], { encoding: "utf8", env: { ...process.env, SMUFDPJ_RAIZ: raiz } });
  assert.equal(r.status, 0, r.stderr);
  const news = path.join(raiz, "media/news");
  const arq = JSON.parse(fs.readFileSync(path.join(news, "archive/2026-03.json"), "utf8"));
  assert.equal(arq.items[0].body_pt, "corpo velho", "arquivo guarda o corpo inline");
  assert.ok(!fs.existsSync(path.join(news, "items/velho.json")), "items/ do arquivado sai");
  const index = JSON.parse(fs.readFileSync(path.join(news, "index.json"), "utf8"));
  assert.deepEqual(index.items, [{ id: "novo", pubDate: "2026-10-01T00:00:00Z" }]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(news, "items/novo.json"), "utf8")).body_pt, "corpo novo");
});
