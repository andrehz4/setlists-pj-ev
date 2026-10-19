// Bug 18/10/2026: story e reel saíam com o rosto cortado fora (Jack Irons, Eddie/Andrew Watt, Jeff Ament).
// Causa: o fundo era cortado pelo "attention" do sharp e só depois o rosto era procurado; rosto na borda sumia.
// Correção: recortar pelo rosto achado na foto inteira (mesmo coverCrop do slide do feed).
// Cada foto real do bug prova os dois lados: a regra antiga perde o rosto, a atual mantém.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
import { detectFaces } from "../publish/face-crop.mjs";
import { prepareZoomBase } from "../publish/reel/midia.mjs";
import { baseDoFundo, ZOOM } from "../publish/story/fundo.mjs";
import { W, H } from "../publish/story/base.mjs";

const FOTOS = ["jack-irons", "eddie", "jeff"];
const foto = (n) => fs.readFileSync(new URL(`./fixtures/rosto-borda-${n}.jpg`, import.meta.url));
const rostos = async (buf) => (await detectFaces(buf))?.faces.length || 0;
const regraAntiga = (buf, bw, bh) => sharp(buf).resize(bw, bh, { fit: "cover", position: "attention" }).jpeg().toBuffer();

for (const n of FOTOS) {
  test(`recorte antigo (attention) perde o rosto: ${n} (prova do bug)`, async () => {
    const velho = await regraAntiga(foto(n), Math.round(W * ZOOM), Math.round(H * ZOOM));
    assert.equal(await rostos(velho), 0);
  });

  test(`story mantém o rosto: ${n}`, async () => {
    const buf = foto(n);
    assert.ok(await rostos(await baseDoFundo(buf, await detectFaces(buf))) >= 1);
  });

  test(`reel mantém o rosto: ${n}`, async () => {
    const { base } = await prepareZoomBase(foto(n), 1.15);
    assert.ok(await rostos(base) >= 1);
  });
}
