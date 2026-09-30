// Testes da voz do story diário (sem rede: ElevenLabs e ffprobe simulados).
//   node --test scripts/publish/narracao/story.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { aberturaDoDia, vozDoDia, finalDoDia, arquivoStory, prepararNarracaoStory, gravarDias, FINAIS_STORY, VOZES_STORY } from "./story.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "story-voz-"));
const dia = (iso) => new Date(`${iso}T12:00:00Z`);
const LIGADA = { STORY_NARRACAO: "1", ELEVENLABS_API_KEY: "falsa" };
const gravaFalso = (chamadas) => async (texto, { destino }) => { chamadas.push(texto); fs.writeFileSync(destino, "mp3"); };

test("abertura com dia e mês, primeiro de outubro por extenso", () => {
  assert.equal(aberturaDoDia(dia("2026-09-30")), "Hoje é 30 de setembro, e tem novidade do Pearl Jam.");
  assert.equal(aberturaDoDia(dia("2026-10-01")), "Hoje é primeiro de outubro, e tem novidade do Pearl Jam.");
});

test("Bella nos dias pares, Chris nos ímpares; a mesma data cai na mesma voz todo ano", () => {
  assert.equal(vozDoDia(dia("2026-09-30")).nome, "Bella");
  assert.equal(vozDoDia(dia("2026-10-01")).nome, "Chris");
  assert.equal(vozDoDia(dia("2027-09-30")).nome, vozDoDia(dia("2026-09-30")).nome);
});

test("final reveza entre as 3 frases, todas chamando pro site sem travessão", () => {
  const f = ["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => finalDoDia(dia(d)));
  assert.equal(new Set(f).size, 3);
  for (const t of FINAIS_STORY) assert.doesNotMatch(t, /[—–]/);
});

test("arquivo da data não depende do ano (reaproveita em 2027)", () => {
  const v = VOZES_STORY[0], t = aberturaDoDia(dia("2026-09-30"));
  assert.equal(arquivoStory(t, v, { mmdd: "09-30", dir: "/x" }), arquivoStory(aberturaDoDia(dia("2027-09-30")), v, { mmdd: "09-30", dir: "/x" }));
  assert.match(arquivoStory(t, v, { mmdd: "09-30", dir: "/x" }), /datas\/bella-09-30-[0-9a-f]{8}\.mp3$/);
});

test("desligada: null, sem chamar nada", async () => {
  const c = [];
  assert.equal(await prepararNarracaoStory(dia("2026-09-30"), { env: {}, sintetizarImpl: gravaFalso(c) }), null);
  assert.equal(c.length, 0);
});

test("grava abertura e final na 1ª vez e reaproveita na 2ª", async () => {
  const dir = tmp(), c = [];
  const opts = { env: LIGADA, dir, sintetizarImpl: gravaFalso(c), duracaoImpl: () => 2.6, saldoImpl: async () => null };
  const r1 = await prepararNarracaoStory(dia("2026-09-30"), opts);
  assert.equal(c.length, 2);
  assert.equal(r1.falas.length, 2);
  assert.ok(Math.abs(r1.introDur - 3.25) < 1e-9); // 0,25 + 2,6 + 0,4
  assert.match(r1.aviso, /Bella · gravou/);
  const r2 = await prepararNarracaoStory(dia("2026-09-30"), opts);
  assert.equal(c.length, 2);
  assert.match(r2.aviso, /já gravado/);
});

test("saldo curto: não grava, story sai sem voz com aviso", async () => {
  const c = [];
  const r = await prepararNarracaoStory(dia("2026-09-30"), { env: LIGADA, dir: tmp(), sintetizarImpl: gravaFalso(c), saldoImpl: async () => ({ restante: 5, limite: 10000 }) });
  assert.equal(c.length, 0);
  assert.match(r.aviso, /SEM voz.*crédito/);
});

test("gravar dias: finais das 2 vozes + 1 abertura por dia, sem regravar", async () => {
  const dir = tmp(), c = [];
  await gravarDias(dia("2026-10-01"), 3, { apiKey: "k", dir, sintetizarImpl: gravaFalso(c), log: () => {} });
  assert.equal(c.length, VOZES_STORY.length * FINAIS_STORY.length + 3);
  c.length = 0;
  await gravarDias(dia("2026-10-01"), 3, { apiKey: "k", dir, sintetizarImpl: gravaFalso(c), log: () => {} });
  assert.equal(c.length, 0);
});
