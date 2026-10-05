import { test } from "node:test";
import assert from "node:assert/strict";
import { medirTarja, semTarja } from "./tarja.mjs";

const { default: sharp } = await import("sharp");
// imagem 320x240: miolo cinza claro, com ou sem faixas pretas em cima e embaixo
async function img({ cima = 0, baixo = 0, ruidoNaTarja = false } = {}) {
  const miolo = await sharp({ create: { width: 320, height: 240 - cima - baixo, channels: 3, background: "#b0a090" } }).png().toBuffer();
  const base = sharp({ create: { width: 320, height: 240, channels: 3, background: "#000" } });
  const camadas = [{ input: miolo, top: cima, left: 0 }];
  if (ruidoNaTarja) camadas.push({ input: await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer(), top: 2, left: 150 });
  return base.composite(camadas).png().toBuffer();
}

test("tira a tarja de vídeo (faixas pretas iguais em cima e embaixo)", async () => {
  const t = await medirTarja(await img({ cima: 30, baixo: 30 }));
  assert.deepEqual(t, { top: 30, altura: 180, largura: 320 });
  const { height } = await sharp(await semTarja(await img({ cima: 30, baixo: 30 }))).metadata();
  assert.equal(height, 180);
});

test("não mexe em foto sem tarja, com faixa só de um lado ou com algo claro na faixa", async () => {
  assert.equal(await medirTarja(await img()), null);
  assert.equal(await medirTarja(await img({ cima: 40 })), null, "palco escuro só em cima não é tarja");
  assert.equal(await medirTarja(await img({ cima: 30, baixo: 30, ruidoNaTarja: true })), null, "luz na faixa: não é tarja pura");
  assert.equal(await medirTarja(await img({ cima: 10, baixo: 60 })), null, "faixas muito diferentes");
  const texto = await sharp({ create: { width: 320, height: 240, channels: 3, background: "#000" } })
    .composite([{ input: await sharp({ create: { width: 200, height: 6, channels: 3, background: "#fff" } }).png().toBuffer(), top: 100, left: 60 }])
    .png().toBuffer();
  assert.equal(await medirTarja(texto), null, "arte de texto sobre fundo preto");
});
