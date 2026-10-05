import { test } from "node:test";
import assert from "node:assert/strict";
import { montarAgenda } from "./montar.mjs";

const BC = { conta: "blackcirclepj", nome: "Black Circle" };
const posts = [
  { data: "2026-10-01T15:00:00+0000", link: "https://ig/agenda", legenda: "OUTUBRO COMEÇOU!\n\n📍 08/10 // São Gonçalo/RJ\n📍 10/10 // Rio de Janeiro/RJ\n📍 11/10 // Volta Redonda/RJ" },
  { data: "2026-10-07T15:00:00+0000", link: "https://ig/dia", legenda: "AMANHÃ TEM SHOW!\n\n📍 08/10, quinta\n📍 rocknbeerpub  São Gonçalo/RJ\n🕙 22h showtime" },
  { data: "2026-09-01T15:00:00+0000", link: "https://ig/velho", legenda: "Agenda de SETEMBRO\n\nSex 04 - capivarasrockbar - Ponta Grossa - PR\nSáb 05 - torkandroll - Curitiba - PR" },
];

test("agenda do mês + post do dia: casa e horário entram, passado sai", () => {
  const a = montarAgenda(BC, posts, "2026-10-04");
  assert.deepEqual(a.map((s) => s.data), ["2026-10-08", "2026-10-10", "2026-10-11"]);
  assert.equal(a[0].casa, "rocknbeerpub");
  assert.equal(a[0].hora, "22:00");
  assert.equal(a[0].cidade, "São Gonçalo");
  assert.equal(a[0].id, "blackcirclepj-2026-10-08-sao-goncalo");
  assert.equal(a[0].fonte, "https://ig/agenda");
  assert.equal(a[1].casa, null);
});

test("aviso solto sem agenda vira show (data, casa, cidade/UF e horário do próprio post)", () => {
  const a = montarAgenda(BC, [posts[1]], "2026-10-04");
  assert.equal(a.length, 1);
  assert.deepEqual([a[0].data, a[0].casa, a[0].hora], ["2026-10-08", "rocknbeerpub", "22:00"]);
});

test("post sem data nenhuma: lista vazia", () => {
  assert.deepEqual(montarAgenda(BC, [{ data: "2026-10-01T00:00:00+0000", link: "x", legenda: "Obrigado galera!" }], "2026-10-01"), []);
});
