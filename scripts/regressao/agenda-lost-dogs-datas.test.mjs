// Agenda do Lost Dogs (09/11/2026): com as legendas reais de out/nov (fixtures/lost-dogs-2026-11.json) o robô
// perdia "DIA 19 DE NOVEMBRO 21H" e "30 de Outubro" (data por extenso), juntava os dois shows de 07/11 num só,
// punha outra banda do line-up como casa (soundstones.oficial) e lia o preço "após às 22h R$40" como hora do show.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { montarAgenda } from "../agenda/montar.mjs";
import { casaNaLegenda } from "../agenda/extrair.mjs";

const posts = JSON.parse(fs.readFileSync(new URL("./fixtures/lost-dogs-2026-11.json", import.meta.url), "utf8"));
const BANDA = { conta: "pearljamsp", nome: "Lost Dogs", uf: "SP" };
const agenda = montarAgenda(BANDA, posts, "2026-10-15");
const doDia = (d) => agenda.filter((s) => s.data === d);
const legenda = (trecho) => posts.find((p) => p.legenda.includes(trecho)).legenda;

test("regra antiga: só aceitava data dd/mm (prova do bug da data por extenso)", () => {
  const antiga = (t) => /\b(\d{1,2})\/(\d{1,2})(?!\/\d)/.test(t);
  assert.equal(antiga(legenda("DIA 19 DE NOVEMBRO")), false);
  assert.equal(antiga(legenda("30 de Outubro")), false);
});

test("data por extenso vira show, com a hora colada nela", () => {
  assert.deepEqual(doDia("2026-11-19").map((s) => s.hora), ["21:00"]);
  assert.deepEqual(doDia("2026-10-30").map((s) => [s.casa, s.hora]), [["beer4upinheiros", "19:00"]]);
});

test("dois shows no mesmo dia em casas diferentes ficam separados", () => {
  assert.deepEqual(doDia("2026-11-07").map((s) => s.casa).sort(), ["misterrockinsampa", "rooftopgaleriadorock"]);
});

test("banda do line-up não vira casa; hora vem da linha da própria banda", () => {
  const rooftop = legenda("rooftopgaleriadorock atendeu");
  assert.match(rooftop, /\nsoundstones\.oficial 15:30h\n/); // a linha que a regra antiga pegava como casa
  assert.equal(casaNaLegenda(rooftop, ["pearljamsp"]), "rooftopgaleriadorock");
  assert.equal(doDia("2026-11-07").find((s) => s.casa === "rooftopgaleriadorock").hora, "17:00");
});

test("preço do ingresso não é hora do show", () => {
  const alma = legenda("almacampinas");
  assert.match(alma, /após às 22h R\$40/); // "às 22h" que a regra antiga lia como hora
  assert.equal(doDia("2026-11-06")[0].hora, null);
  assert.equal(doDia("2026-11-06")[0].cidade, "Campinas"); // "ATENÇÃO CAMPINAS"
});
