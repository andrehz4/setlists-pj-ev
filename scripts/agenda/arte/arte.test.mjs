// Agenda só na arte: escolha dos posts, conversão da resposta do Gemini, cache e encaixe no montar.mjs.
// Legenda real do Lost Dogs de 03/11/2026 (a agenda de novembro estava só na imagem).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { precisaArte, showsDaArte } from "./quais.mjs";
import { completarComArte } from "./index.mjs";
import { montarAgenda } from "../montar.mjs";

const posts = JSON.parse(fs.readFileSync(new URL("../../regressao/fixtures/lost-dogs-2026-11.json", import.meta.url), "utf8"));
const MES_ESPECIAL = posts.find((p) => p.legenda.startsWith("MÊS ESPECIAL"));
const BANDA = { conta: "pearljamsp", nome: "Lost Dogs", uf: "SP" };
const comImagem = (p) => ({ ...p, imagens: ["https://cdn.exemplo/arte.jpg"] });
const RESPOSTA = { shows: [
  { dia: 13, mes: 11, hora: "20h", casa: "blues_beer", observacao: "Into The Wild" },
  { dia: 14, mes: 11, hora: "22h30", casa: "Mister Rock", cidade: "São Paulo", uf: "SP" },
  { dia: 21, mes: 11, casa: "@bestofbluesandrock" },
] };

test("só lê a arte de post de agenda com imagem e sem as datas no texto", () => {
  assert.equal(precisaArte(comImagem(MES_ESPECIAL)), true);
  assert.equal(precisaArte(MES_ESPECIAL), false); // sem imagem (vídeo)
  assert.equal(precisaArte(comImagem({ legenda: "Agenda de NOVEMBRO\n06/11 Campinas\n07/11 São Paulo" })), false);
  assert.equal(precisaArte(comImagem({ legenda: "Nesta sexta dia 13/11 no blues_beer" })), false);
});

test("resposta do Gemini vira show: hora, @ da casa, nome da casa e ano", () => {
  const s = showsDaArte(RESPOSTA, "2026-11-03T16:42:22+0000");
  assert.deepEqual(s.map((x) => [x.data, x.hora, x.casa, x.casaNome]), [
    ["2026-11-13", "20:00", "blues_beer", null],
    ["2026-11-14", "22:30", null, "Mister Rock"],
    ["2026-11-21", null, "bestofbluesandrock", null],
  ]);
  assert.equal(showsDaArte({ shows: [{ dia: 5, mes: 1 }] }, "2026-12-10T12:00:00Z")[0].data, "2027-01-05");
  assert.deepEqual(showsDaArte({ shows: [{ dia: 40, mes: 13 }] }, "2026-11-03T00:00:00Z"), []);
});

test("cada arte é lida uma vez (cache) e sem GEMINI_API_KEY nada é lido", async () => {
  let chamadas = 0;
  const ler = async () => { chamadas++; return RESPOSTA; };
  const cache = { velho: { lidoEm: "2026-01-01T00:00:00Z", resposta: { shows: [] } } };
  const lista = posts.map(comImagem);
  const agora = Date.parse("2026-11-09T12:00:00Z");
  assert.equal(await completarComArte(BANDA, lista, cache, { env: {}, ler, agora }), 0);
  assert.equal(chamadas, 0);
  assert.equal(cache.velho, undefined); // mais de 90 dias sai
  const env = { GEMINI_API_KEY: "x" };
  assert.equal(await completarComArte(BANDA, lista, cache, { env, ler, agora }), 1);
  assert.equal(await completarComArte(BANDA, posts.map(comImagem), cache, { env, ler, agora }), 0);
  assert.equal(chamadas, 1);
  assert.equal(lista.find((p) => p.link === MES_ESPECIAL.link).arte.length, 3);
});

test("falha ao ler a arte não derruba a banda e não grava no cache", async () => {
  const cache = {};
  const ler = async () => { throw new Error("HTTP 403"); };
  assert.equal(await completarComArte(BANDA, [comImagem(MES_ESPECIAL)], cache, { env: { GEMINI_API_KEY: "x" }, ler }), 0);
  assert.deepEqual(cache, {});
});

test("montar: shows da arte entram e não duplicam o aviso do mesmo show", () => {
  const lista = posts.map((p) => (p === MES_ESPECIAL ? { ...p, arte: showsDaArte(RESPOSTA, p.data) } : p));
  const a = montarAgenda(BANDA, lista, "2026-11-09");
  assert.deepEqual(a.map((s) => [s.data, s.casa || s.casaNome]), [
    ["2026-11-13", "blues_beer"], ["2026-11-14", "Mister Rock"], ["2026-11-19", null], ["2026-11-21", "bestofbluesandrock"],
  ]);
});
