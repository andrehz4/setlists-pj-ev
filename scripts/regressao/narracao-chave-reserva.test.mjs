// Bug 19/10/2026: a conta principal da ElevenLabs ficou com 260 caracteres e o reel de domingo ia sair SEM voz,
// enquanto a conta da agenda tinha 4.076 sobrando. Agora a narração tenta a reserva antes de desistir.
// Tudo simulado: nenhuma chamada à ElevenLabs.
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
const SALDOS = { principal: 260, reserva: 4076 };
const saldoImpl = async ({ apiKey }) => ({ usados: 10000 - SALDOS[apiKey], limite: 10000, restante: SALDOS[apiKey] });

function rodar(env) {
  const usadas = [];
  return prepararNarracao(buildScenePlan(ITENS).scenes, {
    weekKey: "2026-W43", tmpDir: tmp(), dirFixas: tmp(), duracaoImpl: () => 2, saldoImpl,
    env: { REEL_NARRACAO: "1", ...env },
    sintetizarImpl: async (t, { apiKey, destino }) => { usadas.push(apiKey); fs.writeFileSync(destino, "mp3"); },
  }).then((r) => ({ r, usadas }));
}

test("só com a chave principal sem saldo, o reel sai mudo (prova do bug)", async () => {
  const { r, usadas } = await rodar({ ELEVENLABS_API_KEY: "principal" });
  assert.match(r.aviso, /SEM voz/);
  assert.deepEqual(usadas, []);
});

test("com a reserva configurada, narra usando a reserva", async () => {
  const { r, usadas } = await rodar({ ELEVENLABS_API_KEY: "principal", ELEVENLABS_API_KEY_RESERVA: "reserva" });
  assert.ok(r.falas?.length > 0);
  assert.ok(usadas.length > 0 && usadas.every((k) => k === "reserva"));
  assert.match(r.aviso, /conta reserva/);
});

test("principal com saldo: a reserva nem é tocada", async () => {
  SALDOS.principal = 5000;
  const { usadas } = await rodar({ ELEVENLABS_API_KEY: "principal", ELEVENLABS_API_KEY_RESERVA: "reserva" });
  assert.ok(usadas.every((k) => k === "principal"));
  SALDOS.principal = 260;
});
