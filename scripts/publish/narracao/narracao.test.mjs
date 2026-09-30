// Testes da narração do reel. Sem rede: o ElevenLabs e o ffprobe são simulados.
//   node --test scripts/publish/narracao/narracao.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normalizarFala, falasDasCenas, FALA_ABERTURA, FALA_FINAL } from "./fala.mjs";
import { vozDaSemana, sintetizar, VOZES } from "./elevenlabs.mjs";
import { prepararNarracao, duracoesSincronizadas, filtroMixagem, narracaoLigada, arquivoFixo } from "./narracao.mjs";
import { buildScenePlan, COLD_DUR, BLOCK_DUR, OUTRO_DUR } from "../reel-video.mjs";
import { buildReelCaption } from "../instagram.mjs";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const ITENS = [
  { id: "a", format: "kinetic", title_pt: "PJ volta ao palco com Abe Laboriel Jr. & convidados" },
  { id: "b", format: "card", title_pt: "Eddie Vedder toca \"Better Man\" no Ohana" },
];
const LIGADA = { REEL_NARRACAO: "1", ELEVENLABS_API_KEY: "chave-falsa" };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "narr-test-"));

test("fala lê o título da tela, trocando o que soa mal", () => {
  assert.equal(normalizarFala("PJ volta ao palco com Abe Laboriel Jr. & convidados"),
    "Pearl Jam volta ao palco com Abe Laboriel Júnior e convidados.");
  assert.equal(normalizarFala("Eddie Vedder toca \"Better Man\" no Ohana"), "Eddie Vedder toca Better Man no Ohana.");
  assert.equal(normalizarFala("Já termina com ponto!"), "Já termina com ponto!");
});

test("abertura e final fixos, uma fala por cena", () => {
  const { scenes } = buildScenePlan(ITENS);
  const f = falasDasCenas(scenes);
  assert.equal(f.length, scenes.length);
  assert.equal(f[0].texto, FALA_ABERTURA);
  assert.equal(f.at(-1).texto, FALA_FINAL);
});

test("sem durações o plano de cenas fica idêntico ao de sempre", () => {
  const { scenes, totalS } = buildScenePlan(ITENS);
  assert.deepEqual(scenes.map((s) => s.dur), [COLD_DUR, BLOCK_DUR, BLOCK_DUR, OUTRO_DUR]);
  assert.equal(totalS, COLD_DUR + 2 * BLOCK_DUR + OUTRO_DUR);
});

test("com durações, cada cena começa onde a anterior termina", () => {
  const { scenes, totalS } = buildScenePlan(ITENS, [3.2, 6, 5, 2.8]);
  assert.deepEqual(scenes.map((s) => s.start), [0, 3.2, 9.2, 14.2]);
  assert.ok(Math.abs(totalS - 17) < 1e-9);
});

test("duração sincronizada: fala + folga, com mínimo e teto", () => {
  const { scenes } = buildScenePlan(ITENS);
  const d = duracoesSincronizadas(scenes, new Map([[0, 1.5], [1, 5.0], [2, 20], [3, 1.0]]));
  assert.equal(d[0], 3.0);             // abertura curta fica no mínimo
  assert.ok(Math.abs(d[1] - 6.05) < 1e-9); // 0,25 + 5,0 + 0,8
  assert.equal(d[2], 9.0);             // teto do bloco
  assert.equal(d[3], 2.5);             // final no mínimo
});

test("desligada sem flag ou sem chave: devolve null e não chama a API", async () => {
  assert.equal(narracaoLigada({ REEL_NARRACAO: "1" }), false);
  assert.equal(narracaoLigada({ ELEVENLABS_API_KEY: "x" }), false);
  let chamou = false;
  const r = await prepararNarracao(buildScenePlan(ITENS).scenes, { weekKey: "2026-W40", tmpDir: tmp(), env: {}, sintetizarImpl: () => { chamou = true; } });
  assert.equal(r, null);
  assert.equal(chamou, false);
});

test("falha na API: devolve null (reel sai só com música)", async () => {
  const r = await prepararNarracao(buildScenePlan(ITENS).scenes, {
    weekKey: "2026-W40", tmpDir: tmp(), env: LIGADA, dirFixas: tmp(),
    sintetizarImpl: async () => { throw new Error("402 paid_plan_required"); },
  });
  assert.equal(r, null);
});

test("abertura e final reaproveitados na 2ª semana; manchetes sempre geradas", async () => {
  const fixas = tmp(), chamadas = [];
  const sint = async (texto, { destino }) => { chamadas.push(texto); fs.writeFileSync(destino, "mp3"); };
  const opts = { weekKey: "2026-W40", env: LIGADA, dirFixas: fixas, sintetizarImpl: sint, duracaoImpl: () => 2 };
  const { scenes } = buildScenePlan(ITENS);
  await prepararNarracao(scenes, { ...opts, tmpDir: tmp() });
  assert.equal(chamadas.length, 4);
  chamadas.length = 0;
  const r = await prepararNarracao(scenes, { ...opts, tmpDir: tmp() });
  assert.deepEqual(chamadas, [normalizarFala(ITENS[0].title_pt), normalizarFala(ITENS[1].title_pt)]);
  assert.equal(r.sceneDurs.length, scenes.length);
  assert.equal(r.voz.nome, "Jessica");
});

test("arquivo fixo muda quando muda a voz ou o texto", () => {
  const a = arquivoFixo(FALA_ABERTURA, VOZES[0], "/x"), b = arquivoFixo(FALA_ABERTURA, VOZES[1], "/x");
  assert.notEqual(a, b);
  assert.match(a, /jessica-abertura-[0-9a-f]{8}\.mp3$/);
  assert.equal(arquivoFixo("Outra frase.", VOZES[0], "/x"), null);
});

test("voz reveza por semana", () => {
  assert.equal(vozDaSemana("2026-W40").nome, "Jessica");
  assert.equal(vozDaSemana("2026-W41").nome, "Liam");
});

test("erro 402 do ElevenLabs não fica repetindo", async () => {
  let n = 0;
  const fetchImpl = async () => { n++; return { ok: false, status: 402, text: async () => "paid_plan_required" }; };
  await assert.rejects(sintetizar("oi", { vozId: "v", apiKey: "k", destino: path.join(tmp(), "a.mp3"), fetchImpl }), /402/);
  assert.equal(n, 1);
});

test("mixagem: cada fala entra no início da sua cena e a música abaixa com a voz", () => {
  const f = filtroMixagem([{ sceneIndex: 0 }, { sceneIndex: 2 }], [0, 3.2, 9.2]);
  assert.match(f, /\[1:a\]adelay=250\|250/);
  assert.match(f, /\[2:a\]adelay=9450\|9450/);
  assert.match(f, /sidechaincompress/);
});

test("legenda: crédito discreto só quando narrado, sem link", () => {
  const com = buildReelCaption(ITENS, { weekLabel: "x", creditoVoz: true });
  assert.ok(com.endsWith("voz: ElevenLabs"));
  assert.doesNotMatch(com, /elevenlabs\.io|https?:/i);
  assert.doesNotMatch(buildReelCaption(ITENS, { weekLabel: "x" }), /ElevenLabs/);
});

test("Regra 0: arquivos do módulo ficam curtos", () => {
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))) {
    const n = fs.readFileSync(path.join(DIR, f), "utf8").split("\n").length;
    assert.ok(n <= 150, `${f} tem ${n} linhas`);
  }
});
