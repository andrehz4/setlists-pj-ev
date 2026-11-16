// Coleta no gerador (setlist-ibirapuera/contador.js): qual clique vira qual evento e o contrato com o servidor.
// Roda o módulo de verdade com um navegador de mentira (sem document, então ele não envia nada sozinho).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PASTA } from "../setlist-ibirapuera/versao.mjs";
import { EVENTOS as NO_SERVIDOR, validar } from "../../functions/_lib/contador.js";

Object.assign(globalThis, { location: { search: "", hash: "" } });
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Mozilla/5.0 (iPhone) Safari" }, configurable: true });
const { EVENTOS, corpo, eventoDoClique } = await import(PASTA + "contador.js");

// Botão de mentira: id, classes, data-* e a tela (#salvar-tela) onde ele está.
const botao = ({ id = "", classes = [], dataset = {}, disabled = false, tela = null } = {}) => ({ id, dataset, disabled,
  classList: { contains: (c) => classes.includes(c) }, closest: (s) => (s === "#salvar-tela" ? tela : null) });
const telaDe = (comVideo) => ({ dataset: {}, querySelector: (s) => (s === "video" && comVideo ? {} : null) });

test("todo evento do gerador é aceito pelo servidor, e o corpo cabe no limite", () => {
  assert.deepEqual([...EVENTOS].sort(), [...NO_SERVIDOR].sort());
  for (const e of EVENTOS) assert.equal(validar(corpo(e, { noite: 2, dentro: true })).e, e);
  assert.deepEqual(validar(corpo("sorteou", { noite: 2, dentro: true })), { e: "sorteou", noite: 22, ig: true });
  assert.deepEqual(validar(corpo("sorteou", { noite: 1 })), { e: "sorteou", noite: 20, ig: false });
  assert.deepEqual(validar(corpo("visita")), { e: "visita", noite: null, ig: false });
});

test("corpo só leva evento, noite e origem (nenhum dado pessoal)", () => {
  assert.deepEqual(Object.keys(JSON.parse(corpo("baixou_video", { noite: 1, dentro: true }))).sort(), ["e", "ig", "n"]);
});

test("cliques: sorteio, montagem, imagem e vídeo", () => {
  assert.equal(eventoDoClique(botao({ id: "sortear" }), false), "sorteou");
  assert.equal(eventoDoClique(botao({ id: "gerar", dataset: { gerar: "" } }), false), "montou");
  assert.equal(eventoDoClique(botao({ id: "story" }), false), "baixou_imagem");
  assert.equal(eventoDoClique(botao({ id: "story-video" }), false), "pediu_video");
  assert.equal(eventoDoClique(botao({ id: "story-video" }), true), "saiu_app");
  assert.equal(eventoDoClique(botao({ id: "compartilhar" }), false), "compartilhou");
  assert.equal(eventoDoClique(botao({ id: "compartilhar", classes: ["gerando"] }), false), null);
});

test("cliques que não contam: botão travado, story já montando, botões de navegação", () => {
  assert.equal(eventoDoClique(null, false), null);
  assert.equal(eventoDoClique(botao({ id: "story", disabled: true }), false), null);
  assert.equal(eventoDoClique(botao({ id: "story", classes: ["gerando"] }), false), null);
  assert.equal(eventoDoClique(botao({ id: "story-video", classes: ["gerando"] }), false), null);
  assert.equal(eventoDoClique(botao({ id: "outra" }), false), null, "Sortear de novo conta pelo clique que ele dá no #sortear");
  assert.equal(eventoDoClique(botao({ dataset: { ir: "montar" } }), false), null);
});

test("vídeo baixado: só o botão principal da tela com o vídeo pronto, uma vez por vídeo", () => {
  const pronta = telaDe(true);
  const postar = botao({ classes: ["btn", "cheio"], tela: pronta });
  assert.equal(eventoDoClique(postar, false), "baixou_video");
  assert.equal(eventoDoClique(postar, false), null, "segundo toque no mesmo vídeo não conta de novo");
  assert.equal(eventoDoClique(botao({ classes: ["btn"], tela: telaDe(true) }), false), null, "Fechar não conta");
  assert.equal(eventoDoClique(botao({ classes: ["btn", "cheio"], tela: telaDe(false) }), false), null, "recado sem vídeo não conta");
});
