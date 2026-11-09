// Agenda (09/11/2026), legendas reais em fixtures/agenda-pj90-homer.json:
// 1. PJ 90: "AGENDA NOVEMBRO" + blocos "05. QUINTA / 🏠 casa / 📍 cidade" era lido como lista e a cidade saía
//    ". SEXTA", sem casa nem hora; o bloco "07. JUKADANI" (sem dia da semana) sumia;
// 2. The Homer: "31/11 Réveillon Mister" virava show num dia que não existe.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { montarAgenda } from "../agenda/montar.mjs";
import { showsDoPostDeAgenda } from "../agenda/extrair.mjs";

const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/agenda-pj90-homer.json", import.meta.url), "utf8"));
const PJ90 = { conta: "pjnoventa", nome: "PJ 90", uf: "SP" };
const HOMER = { conta: "thehomerpj", nome: "The Homer", uf: "MG" };

test("regra antiga: lista lia o bloco e a cidade saía '. SEXTA' (prova do bug 1)", () => {
  const lista = showsDoPostDeAgenda(fx.pjnoventa.legenda, fx.pjnoventa.data);
  assert.equal(lista.find((s) => s.data === "2026-11-13").cidade, ". SEXTA");
});

test("PJ 90: blocos com casa, cidade e hora, inclusive dia sem dia da semana e casa sem @", () => {
  const a = montarAgenda(PJ90, [fx.pjnoventa], "2026-11-01");
  assert.ok(a.every((s) => !s.cidade?.startsWith(".")));
  const dia = (d) => a.filter((s) => s.data === d);
  assert.deepEqual(dia("2026-11-13").map((s) => [s.casa, s.cidade, s.hora]), [["vitaorockbaroficial", "Carapicuíba", "22:00"]]);
  assert.deepEqual(dia("2026-11-07").map((s) => [s.casa, s.hora]), [["jukadani", "23:00"]]); // "Casa abre 20h / Começamos 23h"
  assert.ok(dia("2026-11-20").some((s) => s.casaNome === "Festival Rock" && s.cidade === "Santo Antônio da Posse"));
  assert.equal(dia("2026-11-27").length, 2);
});

test("The Homer: 31/11 não existe e não vira show; as outras datas ficam", () => {
  assert.match(fx.thehomerpj.legenda, /31\/11 Réveillon/);
  const a = montarAgenda(HOMER, [fx.thehomerpj], "2026-11-01");
  assert.deepEqual(a.map((s) => s.data), ["2026-11-20", "2026-11-20", "2026-11-28", "2026-12-19"]);
});
