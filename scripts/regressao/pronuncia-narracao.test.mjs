// Bug 18/10/2026: a abertura do reel "Fã de Pearl Jam? ..." saía "Fá de Pearl Jam" nas duas vozes, e "Semana agitada
// no mundo Pearl Jam" saía "Mungo" na Jessica. Conferido ouvindo pelo whisper (mlx_whisper do voz-hz).
// "Fã" no meio da frase sai certo ("Só Mais um Fã de Pearl Jam" foi conferido). As regras abaixo valem pra toda
// frase fixa gravada (reel, story, agenda); achou pronúncia ruim nova? Acrescenta aqui.
import test from "node:test";
import assert from "node:assert/strict";
import { ABERTURAS, FINAIS } from "../publish/narracao/fala.mjs";
import { FINAIS_STORY } from "../publish/narracao/story.mjs";
import { ABERTURAS as AG_ABERTURAS, FINAIS as AG_FINAIS } from "../agenda/redes/voz.mjs";

const PRONUNCIA_RUIM = [
  [/(^|[.!?]\s+)fã(?!\p{L})/iu, "frase começando com Fã (a voz lê Fá)"],
  [/\bmundo Pearl Jam\b/i, "mundo Pearl Jam (a voz lê Mungo)"],
  [/\bagitad[ao]s?\b/i, "agitada (a voz lê com sotaque espanhol, 19/10/2026)"],
  [/(?<![\p{L}-])pros?(?![\p{L}-])/iu, "pro (a voz lê PRÓ de profissional, 13/11/2026)"],
];
const problemas = (frase) => PRONUNCIA_RUIM.filter(([re]) => re.test(frase)).map(([, motivo]) => motivo);

test("frases antigas caem nas regras (prova do bug)", () => {
  assert.deepEqual(problemas("Fã de Pearl Jam? Olha o que rolou essa semana."), ["frase começando com Fã (a voz lê Fá)"]);
  assert.deepEqual(problemas("Semana agitada no mundo Pearl Jam. Vem ver."), ["mundo Pearl Jam (a voz lê Mungo)", "agitada (a voz lê com sotaque espanhol, 19/10/2026)"]);
});

test("agitada cai na regra (prova do bug de 19/10)", () => {
  assert.deepEqual(problemas("Semana agitada para o Pearl Jam. Vem ver."), ["agitada (a voz lê com sotaque espanhol, 19/10/2026)"]);
});

test("Fã no meio da frase passa (a voz lê certo)", () => {
  assert.deepEqual(problemas("Amanhã tem mais. Segue o Só Mais um Fã de Pearl Jam!"), []);
});

test("nenhuma frase fixa gravada tem pronúncia ruim conhecida", () => {
  const todas = [...ABERTURAS, ...FINAIS, ...FINAIS_STORY, ...AG_ABERTURAS.map((f) => f("Black Circle")), ...AG_FINAIS];
  for (const frase of todas) assert.deepEqual(problemas(frase), [], frase);
});

test("pro cai na regra (prova do bug de 13/11)", () => {
  assert.deepEqual(problemas("Chama a turma pro show!"), ["pro (a voz lê PRÓ de profissional, 13/11/2026)"]);
  assert.deepEqual(problemas("Chama a turma para o show!"), []);
});

test("manchete lida no reel troca pro por para o", async () => {
  const { normalizarFala } = await import("../publish/narracao/fala.mjs");
  assert.equal(normalizarFala("Eddie volta pro Brasil e leva os filhos pros shows"), "Eddie volta para o Brasil e leva os filhos para os shows.");
  assert.equal(normalizarFala("Ingresso pro-rata e Pro Tools"), "Ingresso pro-rata e Pro Tools.");
});
