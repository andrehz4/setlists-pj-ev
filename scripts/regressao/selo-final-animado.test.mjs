// Bug 18/10/2026: o selo animado do final do reel/story (intro-badge.gif) caía no PNG parado com ffmpeg 9+, porque
// a extração dos quadros usava "-vsync 0", opção que o ffmpeg novo removeu ("Option not found").
// Correção 13/11: o 8.0 (Ubuntu do CI) ainda aceita -vsync; quem removeu foi o 9 (Mac). A prova do bug só roda no 9+.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadBadgeAnimated, argsFramesDoGif } from "../publish/story/badge.mjs";

const versao = Number((spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout || "").match(/ffmpeg version n?(\d+)/)?.[1] || 0);
const gif = new URL("../publish/assets/intro-badge.gif", import.meta.url).pathname;

test("com ffmpeg 9+, a opção antiga -vsync quebra (prova do bug)", { skip: versao < 9 && `ffmpeg ${versao} ainda aceita -vsync` }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "regressao-vsync-"));
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", gif, "-vsync", "0", path.join(dir, "f_%04d.png")], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.notEqual(r.status, 0);
});

test("a extração dos quadros não usa -vsync (vale em qualquer versão do ffmpeg)", () => {
  const args = argsFramesDoGif("x.gif", "/tmp");
  assert.ok(!args.includes("-vsync"));
  assert.ok(args.includes("-fps_mode"));
});

test("o selo do final sai animado (vários quadros, não o PNG parado)", async () => {
  const b = await loadBadgeAnimated();
  assert.ok(b && b.totalFrames > 1, `quadros: ${b?.totalFrames}`);
});
