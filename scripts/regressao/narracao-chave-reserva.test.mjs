// Bug 19/10/2026: a conta principal da ElevenLabs ficou com 260 caracteres e o reel de domingo ia sair SEM voz,
// com crédito sobrando em outras contas. Agora tenta principal -> reserva -> agenda (scripts/publish/narracao/chaves.mjs)
// e o interruptor ELEVENLABS_CHAVE força uma. Tudo simulado: nenhuma chamada à ElevenLabs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepararNarracao } from "../publish/narracao/narracao.mjs";
import { buildScenePlan } from "../publish/reel-video.mjs";

// 6 manchetes como num reel de verdade (~400 caracteres a gravar, mais que os 260 da conta principal).
const ITENS = Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, format: "card", title_pt: `Jack Irons recusou ser o baterista do Pearl Jam em 199${i}` }));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "regressao-reserva-"));
// reserva: chave só de gerar fala, não informa saldo (null).
const SALDOS = { principal: 260, reserva: null, agenda: 4076 };
const saldoImpl = async ({ apiKey }) => (SALDOS[apiKey] == null ? null : { usados: 10000 - SALDOS[apiKey], limite: 10000, restante: SALDOS[apiKey] });
const TODAS = { ELEVENLABS_API_KEY: "principal", ELEVENLABS_API_KEY_RESERVA: "reserva", ELEVENLABS_API_KEY_AGENDA: "agenda" };

function rodar(env, { reservaSemCredito = false } = {}) {
  const usadas = [];
  return prepararNarracao(buildScenePlan(ITENS).scenes, {
    weekKey: "2026-W43", tmpDir: tmp(), dirFixas: tmp(), duracaoImpl: () => 2, saldoImpl,
    env: { REEL_NARRACAO: "1", ...env },
    sintetizarImpl: async (t, { apiKey, destino }) => {
      if (apiKey === "reserva" && reservaSemCredito) throw new Error("ElevenLabs 401: quota_exceeded");
      usadas.push(apiKey); fs.writeFileSync(destino, "mp3");
    },
  }).then((r) => ({ r, usadas: [...new Set(usadas)] }));
}

test("só com a chave principal sem saldo, o reel sai mudo (prova do bug)", async () => {
  const { r, usadas } = await rodar({ ELEVENLABS_API_KEY: "principal" });
  assert.match(r.aviso, /SEM voz.*restam 260/);
  assert.deepEqual(usadas, []);
});

test("principal sem saldo: usa a reserva (saldo desconhecido, tenta)", async () => {
  const { r, usadas } = await rodar(TODAS);
  assert.ok(r.falas?.length > 0);
  assert.deepEqual(usadas, ["reserva"]);
  assert.match(r.aviso, /conta reserva/);
});

test("reserva também sem crédito no meio: cai pra agenda", async () => {
  const { r, usadas } = await rodar(TODAS, { reservaSemCredito: true });
  assert.ok(r.falas?.length > 0);
  assert.deepEqual(usadas, ["agenda"]);
  assert.match(r.aviso, /conta agenda/);
});

test("principal com saldo: as outras nem são tocadas", async () => {
  SALDOS.principal = 5000;
  const { usadas } = await rodar(TODAS);
  SALDOS.principal = 260;
  assert.deepEqual(usadas, ["principal"]);
});

test("interruptor ELEVENLABS_CHAVE força a conta escolhida", async () => {
  const { usadas } = await rodar({ ...TODAS, ELEVENLABS_CHAVE: "agenda" });
  assert.deepEqual(usadas, ["agenda"]);
});
