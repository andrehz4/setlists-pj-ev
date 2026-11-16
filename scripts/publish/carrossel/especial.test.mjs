import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { publicarEspecial } from "../reel/especial.mjs";
import { publicarCarrossel, validarImagens } from "./especial.mjs";

const imgs = (n) => Array.from({ length: n }, (_, i) => `https://midia.x/especiais/t/${String(i + 1).padStart(2, "0")}.jpg`);

test("validarImagens: 2 a 10 links https de jpg/png", () => {
  assert.equal(validarImagens(imgs(10)), null);
  assert.match(validarImagens(imgs(1)), /2 a 10/);
  assert.match(validarImagens(imgs(11)), /2 a 10/);
  assert.match(validarImagens(["http://x/a.jpg", "https://x/b.jpg"]), /link inválido/);
  assert.match(validarImagens(["https://x/a.gif", "https://x/b.jpg"]), /link inválido/);
  assert.equal(validarImagens(["https://x/a.jpg?v=2", "https://x/b.png"]), null);
});

test("publicarCarrossel: imagem fora do ar para ANTES de chamar o IG", async () => {
  let chamouIG = false;
  const deps = { aguardarPublico: async (u) => !u.endsWith("03.jpg"), publishCarouselFromUrls: async () => { chamouIG = true; } };
  await assert.rejects(publicarCarrossel({ imagens: imgs(5), legenda: "oi" }, deps), /03\.jpg/);
  assert.equal(chamouIG, false);
});

test("publicarCarrossel: manda as imagens na ordem e espelha no FB com PUBLISH_FB=1", async () => {
  const antes = { ...process.env };
  Object.assign(process.env, { PUBLISH_FB: "1", FB_PAGE_ID: "p", FB_PAGE_TOKEN: "t" });
  try {
    const log = [];
    const deps = {
      aguardarPublico: async () => true,
      publishCarouselFromUrls: async (u, l) => { log.push(["ig", u, l]); return { postId: "IG1" }; },
      publishAlbumFromUrls: async (u) => { log.push(["fb", u]); return { postId: "FB1" }; },
    };
    const r = await publicarCarrossel({ imagens: imgs(3), legenda: "leg" }, deps);
    assert.deepEqual(r, { postId: "IG1", containerId: null, fbPostId: "FB1" });
    assert.deepEqual(log[0], ["ig", imgs(3), "leg"]);
  } finally {
    for (const k of ["PUBLISH_FB", "FB_PAGE_ID", "FB_PAGE_TOKEN"]) {
      if (antes[k] === undefined) delete process.env[k]; else process.env[k] = antes[k];
    }
  }
});

test("publicar.json com imagens vai pelo carrossel, grava publicado e não repete", async () => {
  const nome = `_teste-carrossel-${process.pid}`;
  const dir = naRaiz(path.join("reels-especiais", nome));
  fs.mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, "publicar.json");
  fs.writeFileSync(arq, JSON.stringify({ imagens: imgs(10), legenda: "oi" }));
  try {
    const log = [];
    const deps = {
      publicarCarrossel: async (d) => { log.push(["car", d.imagens.length]); return { postId: "IG9", fbPostId: "FB9" }; },
      publishReelComFallback: async () => { log.push(["reel"]); },
      commitAndPush: async () => log.push(["git"]),
      enviarTelegram: async (t) => log.push(["tg", t]),
    };
    await publicarEspecial(nome, { deps });
    assert.deepEqual(log[0], ["car", 10]);
    assert.ok(!log.some(([k]) => k === "reel"));
    assert.ok(log.some(([k, t]) => k === "tg" && /Carrossel especial no ar/.test(t)));
    assert.equal(JSON.parse(fs.readFileSync(arq, "utf8")).publicado.fbPostId, "FB9");
    const log2 = [];
    await publicarEspecial(nome, { deps: { ...deps, publicarCarrossel: async () => log2.push("x") } });
    assert.equal(log2.length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("publicar.json com imagens inválidas derruba a run", async () => {
  const nome = `_teste-carrossel-ruim-${process.pid}`;
  const dir = naRaiz(path.join("reels-especiais", nome));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "publicar.json"), JSON.stringify({ imagens: imgs(1), legenda: "oi" }));
  try {
    await assert.rejects(publicarEspecial(nome, { deps: {} }), /2 a 10/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
