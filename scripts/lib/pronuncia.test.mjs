import { test } from "node:test";
import assert from "node:assert/strict";
import { checarFala, bloqueia } from "./pronuncia.mjs";
import { ABERTURAS, FINAIS, nomeFalado } from "../agenda/redes/voz.mjs";

test("pronúncia: bloqueia o que já soou estranho e só avisa o suspeito", () => {
  assert.ok(bloqueia("Divide com quem vai de primeira viagem!"));
  assert.ok(bloqueia("Fã de Pearl Jam, anota aí!"));
  assert.ok(bloqueia("O show é em Osasco!"));
  assert.ok(!bloqueia("Alô, fã de Pearl Jam!"));
  assert.ok(!bloqueia("Marca quem vai com você!"), "quem sozinho é só suspeita");
  assert.equal(checarFala("Marca quem vai com você!")[0].nivel, "suspeita");
  assert.deepEqual(checarFala("Manda pra galera que vai pela primeira vez!"), []);
});

test("pronúncia: nenhuma fala fixa do story cai numa regra que bloqueia", () => {
  const falas = [...ABERTURAS.map((f) => f(nomeFalado("Banda Teste"))), ...FINAIS];
  const ruins = falas.filter(bloqueia);
  assert.deepEqual(ruins, [], `trocar estas falas (ver scripts/agenda/redes/pronuncia.mjs): ${ruins.join(" | ")}`);
});
