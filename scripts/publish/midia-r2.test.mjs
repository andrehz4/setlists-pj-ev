// Testes do envio de mídia pro R2 (sem rede: fetch simulado).
//   node --test scripts/publish/midia-r2.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { configR2, assinar, enviarR2, publicarViaR2 } from "./midia-r2.mjs";

const ENV = {
  R2_ACCOUNT_ID: "conta", R2_ACCESS_KEY_ID: "a".repeat(32), R2_SECRET_ACCESS_KEY: "b".repeat(64),
  R2_MIDIA_BUCKET: "smufdpj-midia", R2_MIDIA_PUBLIC_BASE: "https://midia.exemplo.com/",
};
const arquivo = () => { const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "r2-")), "v.mp4"); fs.writeFileSync(f, "video"); return f; };

test("config: só liga com os 5 dados; tira a barra do fim do link público", () => {
  assert.equal(configR2({}), null);
  assert.equal(configR2({ ...ENV, R2_SECRET_ACCESS_KEY: "" }), null);
  assert.equal(configR2(ENV).publico, "https://midia.exemplo.com");
});

test("assinatura SigV4: determinística e com os cabeçalhos certos", () => {
  const args = { metodo: "PUT", host: "conta.r2.cloudflarestorage.com", caminho: "/b/x.mp4", corpo: Buffer.from("v"), tipo: "video/mp4",
    chave: "AK", segredo: "SK", agora: new Date("2026-09-30T12:00:00Z") };
  const a = assinar(args), b = assinar(args);
  assert.deepEqual(a, b);
  assert.equal(a["x-amz-date"], "20260930T120000Z");
  assert.match(a.authorization, /^AWS4-HMAC-SHA256 Credential=AK\/20260930\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
  assert.notEqual(assinar({ ...args, segredo: "OUTRO" }).authorization, a.authorization);
});

test("envio: PUT no endpoint do bucket e devolve o link público", async () => {
  let pedido;
  const fetchImpl = async (url, opts) => { pedido = { url, opts }; return { ok: true }; };
  const url = await enviarR2(arquivo(), "reels/2026-W40-1.mp4", { env: ENV, fetchImpl });
  assert.equal(url, "https://midia.exemplo.com/reels/2026-W40-1.mp4");
  assert.equal(pedido.url, "https://conta.r2.cloudflarestorage.com/smufdpj-midia/reels/2026-W40-1.mp4");
  assert.equal(pedido.opts.method, "PUT");
  assert.equal(pedido.opts.headers["content-type"], "video/mp4");
});

test("sem R2 configurado: publicarViaR2 devolve null (publicador usa o GitHub)", async () => {
  assert.equal(await publicarViaR2(arquivo(), "x.mp4", { env: {} }), null);
});

test("R2 com erro: devolve null em vez de derrubar a publicação", async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, text: async () => "AccessDenied" });
  assert.equal(await publicarViaR2(arquivo(), "x.mp4", { env: ENV, fetchImpl, tentativas: 1 }), null);
});

test("R2 ok e link respondendo: devolve o link", async () => {
  const fetchImpl = async () => ({ ok: true });
  assert.equal(await publicarViaR2(arquivo(), "stories/d.mp4", { env: ENV, fetchImpl }), "https://midia.exemplo.com/stories/d.mp4");
});
