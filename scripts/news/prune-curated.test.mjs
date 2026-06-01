// Testa o conserto do acumulo do _pending: poda dirigida pelos logs de rodada.
// Rodar: node --test scripts/news/prune-curated.test.mjs

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { collectJudgedIds, prunePendingItems, prunePendingByLogs } from "./prune-curated.mjs";

describe("prunePendingItems (puro, sem disco)", () => {
  test("remove julgados, mantem nao-julgados, marca seen", () => {
    const pending = [
      { id: "skip1", title_orig: "A" },
      { id: "appr1", title_orig: "B" },
      { id: "novo1", title_orig: "C" },
    ];
    const seen = {};
    const judged = new Set(["skip1", "appr1"]);
    const { kept, removedIds } = prunePendingItems(pending, seen, judged, 1000);
    assert.deepEqual(removedIds.sort(), ["appr1", "skip1"]);
    assert.deepEqual(kept.map((p) => p.id), ["novo1"]);
    assert.equal(seen.skip1.curationSkip, true);
    assert.equal(seen.skip1.ts, 1000);
    assert.equal(seen.appr1.curationSkip, true);
    assert.ok(!seen.novo1, "nao-julgado nao deve virar seen");
  });

  test("nao sobrescreve seen ja publicado (firstSeen) nem erro", () => {
    const pending = [{ id: "pub1" }, { id: "err1" }];
    const seen = {
      pub1: { firstSeen: 111, title: "publicado" },
      err1: { error: true, ts: 222 },
    };
    const judged = new Set(["pub1", "err1"]);
    const { removedIds } = prunePendingItems(pending, seen, judged, 9999);
    // sao removidos do pending (ja julgados), mas o seen deles fica intacto
    assert.deepEqual(removedIds.sort(), ["err1", "pub1"]);
    assert.equal(seen.pub1.firstSeen, 111, "firstSeen preservado");
    assert.ok(!seen.pub1.curationSkip, "nao marca curationSkip por cima de publicado");
    assert.equal(seen.err1.error, true, "erro preservado");
  });

  test("pending vazio ou nulo nao lanca", () => {
    assert.doesNotThrow(() => prunePendingItems([], {}, new Set()));
    assert.doesNotThrow(() => prunePendingItems(null, {}, new Set()));
  });

  test("item sem id e ignorado", () => {
    const pending = [{ title_orig: "sem id" }, { id: "x" }];
    const { kept, removedIds } = prunePendingItems(pending, {}, new Set(["x"]));
    assert.equal(removedIds.length, 1);
    assert.equal(kept.length, 1);
    assert.ok(!kept[0].id);
  });
});

describe("collectJudgedIds + prunePendingByLogs (com logs no disco)", () => {
  let dir;
  before(async () => {
    dir = path.join(os.tmpdir(), `cur-log-test-${Date.now()}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "20260601-0300.json"), JSON.stringify({
      approved: [{ id: "appr1" }],
      skipped: [{ id: "skip1" }, { id: "skip2" }],
    }));
    await fs.writeFile(path.join(dir, "20260601-0900.json"), JSON.stringify({
      approved: [],
      skipped: [{ id: "skip3" }],
    }));
    await fs.writeFile(path.join(dir, "naojson.txt"), "ignora");
  });
  after(async () => { await fs.rm(dir, { recursive: true, force: true }); });

  test("collectJudgedIds junta approved+skipped de todos os logs", async () => {
    const ids = await collectJudgedIds(dir);
    assert.deepEqual([...ids].sort(), ["appr1", "skip1", "skip2", "skip3"]);
  });

  test("prunePendingByLogs poda conforme os logs", async () => {
    const pending = [
      { id: "skip1" }, { id: "skip3" }, { id: "novo" }, { id: "appr1" },
    ];
    const seen = {};
    const { kept, removedIds } = await prunePendingByLogs(pending, seen, dir, 555);
    assert.deepEqual(removedIds.sort(), ["appr1", "skip1", "skip3"]);
    assert.deepEqual(kept.map((p) => p.id), ["novo"]);
    assert.equal(seen.skip1.ts, 555);
  });

  test("dir inexistente devolve set vazio (nao poda nada)", async () => {
    const ids = await collectJudgedIds("/caminho/que/nao/existe/xyz");
    assert.equal(ids.size, 0);
    const { kept, removedIds } = await prunePendingByLogs([{ id: "a" }], {}, "/nao/existe");
    assert.equal(removedIds.length, 0);
    assert.equal(kept.length, 1);
  });
});
