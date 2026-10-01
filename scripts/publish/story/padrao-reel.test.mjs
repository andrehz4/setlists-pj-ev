import test from "node:test";
import assert from "node:assert/strict";
import { cenasDoStory, rotuloDia, TARJA } from "./padrao-reel.mjs";

test("story no padrão do reel: cenas, rótulo do dia e tarja", () => {
  assert.deepEqual(cenasDoStory({ introDur: 3.4, cards: 3, cardDur: 3.5, outroInicio: 13.9 }).map((c) => +c.start.toFixed(2)),
    [0, 3.4, 6.9, 10.4, 13.9]);
  assert.equal(rotuloDia(new Date("2026-10-01T12:00:00Z")), "1 OUT");
  assert.equal(TARJA, "AS NOTÍCIAS DO DIA");
});
