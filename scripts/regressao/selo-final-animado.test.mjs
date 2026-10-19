// Bug 18/10/2026: o selo animado do final do reel/story (intro-badge.gif) caía no PNG parado com ffmpeg 8+, porque
// a extração dos quadros usava "-vsync 0", opção que o ffmpeg novo removeu ("Option not found").
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadBadgeAnimated } from "../publish/story/badge.mjs";

const versao = Number((spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout || "").match(/ffmpeg version n?(\d+)/)?.[1] || 0);
const gif = new URL("../publish/assets/intro-badge.gif", import.meta.url).pathname;

test("com ffmpeg 8+, a opção antiga -vsync quebra (prova do bug)", { skip: versao < 8 && `ffmpeg ${versao} ainda aceita -vsync` }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "regressao-vsync-"));
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", gif, "-vsync", "0", path.join(dir, "f_%04d.png")], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.notEqual(r.status, 0);
});

test("o selo do final sai animado (vários quadros, não o PNG parado)", async () => {
  const b = await loadBadgeAnimated();
  assert.ok(b && b.totalFrames > 1, `quadros: ${b?.totalFrames}`);
});
