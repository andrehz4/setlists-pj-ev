import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { imagemDoSite } from "./imagem-site.mjs";

const { default: sharp } = await import("sharp");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cap-site-"));
const capa = path.join(tmp, "capa.jpg");
await sharp({ create: { width: 1080, height: 1350, channels: 3, background: "#111" } }).jpeg().toFile(capa);

test("cápsula: site usa a foto da capa, não a capa pronta", async () => {
  const destino = path.join(tmp, "a.jpg");
  const r = await imagemDoSite({ img: "/media/band/web/eddie.jpg" }, capa, destino);
  assert.equal(r, "foto");
  const m = await sharp(destino).metadata();
  assert.notEqual(`${m.width}x${m.height}`, "1080x1350");
});

test("cápsula sem foto local (ou com URL) cai pra capa", async () => {
  assert.equal(await imagemDoSite({ img: "https://x/y.jpg" }, capa, path.join(tmp, "b.jpg")), "capa");
  assert.equal(await imagemDoSite({}, capa, path.join(tmp, "c.jpg")), "capa");
});
