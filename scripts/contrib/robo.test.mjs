// Robô dos colaboradores: política de aviso de falha (sem spam no Telegram). Roda no `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.CONTRIB_BOT_KEY = "k";
process.env.TELEGRAM_BOT_TOKEN = "t";
process.env.TELEGRAM_CHAT_ID = "c";
const { falhou } = await import("./api.mjs");

// Simula o backend (/falha) e captura o que iria pro Telegram.
function simular(respostaFalha) {
  const telegram = [];
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes("api.telegram.org")) {
      telegram.push(JSON.parse(opts.body).text);
      return { ok: true, json: async () => ({}) };
    }
    return { ok: true, json: async () => respostaFalha };
  };
  return telegram;
}

const envio = { id: "x", title: "Minha fita de 2005" };

test("1ª falha avisa uma vez", async () => {
  const msgs = simular({ tentativas: 1, desistiu: false, limite: 3 });
  await falhou(envio, "curadoria", new Error("ffmpeg quebrou"));
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /Falha na curadoria.*ffmpeg quebrou/s);
});

test("falhas do meio ficam em silêncio", async () => {
  const msgs = simular({ tentativas: 2, desistiu: false, limite: 3 });
  await falhou(envio, "curadoria", new Error("de novo"));
  assert.equal(msgs.length, 0);
});

test("desistência avisa uma vez, dizendo que a pessoa foi avisada", async () => {
  const msgs = simular({ tentativas: 5, desistiu: true, limite: 5 });
  await falhou(envio, "publicacao", new Error("IG fora"));
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /Desisti de publicar "Minha fita de 2005" depois de 5 tentativas/);
});

test("backend fora do ar não derruba o robô (conta como 1ª falha)", async () => {
  const msgs = [];
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes("api.telegram.org")) { msgs.push(opts.body); return { ok: true }; }
    return { ok: false, status: 502, text: async () => "bad gateway" };
  };
  const r = await falhou(envio, "curadoria", "timeout");
  assert.equal(r.tentativas, 1);
  assert.equal(msgs.length, 1);
});

test("crédito usa o @ do Instagram quando existe", async () => {
  const { creditoAutor, legendaIG, itemSite } = await import("./post.mjs");
  assert.equal(creditoAutor({ nome: "Marina Tavares", instagram: "marina.pj" }), "@marina.pj");
  assert.equal(creditoAutor({ nome: "Marina Tavares" }), "Marina T.");
  const e = { id: "7c1e9a2b-4d5f-4a3b-9c8d-112233445566", title: "Título", body: "Texto com mais de vinte letras.", media: [], autor: { nome: "Marina", instagram: "marina.pj" } };
  assert.match(legendaIG(e), /Enviado por @marina\.pj, colaborador do SMUFDPJ/);
  assert.equal(itemSite(e, "2026-09-25T00:00:00Z").item.sourceLabel, "Colaborador · @marina.pj");
});
