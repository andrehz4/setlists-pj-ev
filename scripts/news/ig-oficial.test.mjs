import test from "node:test";
import assert from "node:assert/strict";
import { tituloDaLegenda, itemDoPost, recentes, fetchIgOficialItems } from "./ig-oficial.mjs";

const SRC = { id: "ig-pearljam", label: "Instagram oficial @pearljam", group: "tenclub", conta: "pearljam" };

test("título vem da primeira linha com texto, curto", () => {
  assert.equal(tituloDaLegenda("🤘\n\nMahalo, Ohana!", "pearljam"), "Mahalo, Ohana!");
  assert.equal(tituloDaLegenda("", "pearljam"), "Novo post de @pearljam");
  assert.ok(tituloDaLegenda("a ".repeat(100)).length <= 110);
});

test("item sem imagem, com legenda como texto e link do post", () => {
  const it = itemDoPost({ caption: "Linha 1\nLinha 2", timestamp: "2026-10-02T16:04:39+0000", permalink: "https://www.instagram.com/p/X/", media_type: "IMAGE" }, SRC, "pearljam");
  assert.equal(it.kind, "instagram-oficial");
  assert.equal(it.preImg, null);
  assert.equal(it.link, "https://www.instagram.com/p/X/");
  assert.match(it.preText, /Legenda original:\nLinha 1/);
});

test("só posts dos últimos 7 dias", () => {
  const agora = Date.parse("2026-10-02T12:00:00Z");
  const r = recentes([{ permalink: "a", timestamp: "2026-10-01T00:00:00Z" }, { permalink: "b", timestamp: "2026-09-20T00:00:00Z" }], agora);
  assert.deepEqual(r.map((m) => m.permalink), ["a"]);
});

test("sem secret: desligado, sem chamada; erro da API não vaza o token", async () => {
  let chamou = false;
  assert.deepEqual(await fetchIgOficialItems(SRC, { env: {}, fetchImpl: () => { chamou = true; } }), { items: [], error: null });
  assert.equal(chamou, false);
  const r = await fetchIgOficialItems(SRC, { env: { IG_LEITURA_TOKEN: "SEGREDO123" }, fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: { message: "token SEGREDO123 inválido" } }) }) });
  assert.doesNotMatch(r.error, /SEGREDO123/);
});
