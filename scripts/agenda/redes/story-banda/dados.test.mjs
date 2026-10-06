import { test } from "node:test";
import assert from "node:assert/strict";
import { storiesDoDia, contasDoStory, clipesDoStory } from "./dados.mjs";
import { primeiraPausa } from "./data-cortada.mjs";

const bandas = [{ conta: "pjnoventa", nome: "PJ 90", cidade: "São Paulo", uf: "SP", desde: 2015 }];
const shows = [
  { banda: "pjnoventa", nome: "PJ 90", data: "2026-10-10", cidade: "Bragança Pta", uf: "SP", casa: "brasilbeerfest", hora: "23:00" },
  { banda: "pjnoventa", nome: "PJ 90", data: "2026-10-10", cidade: "Santo André", uf: "SP", casa: "beersfestival", hora: "17:30" },
  { banda: "pjnoventa", nome: "PJ 90", data: "2026-10-10", fechado: true, cidade: "X", uf: "SP" },
  { banda: "outra", nome: "Outra", data: "2026-10-11", cidade: "Rio de Janeiro", uf: "RJ" },
];

test("um story por banda: shows do dia juntos, por horário, sem evento fechado, cidade oficial", () => {
  const s = storiesDoDia(shows, bandas, "2026-10-10");
  assert.equal(s.length, 1);
  assert.deepEqual(s[0].shows.map((x) => [x.cidade, x.hora]), [["Santo André", "17:30"], ["Bragança Paulista", "23:00"]]);
  assert.equal(s[0].conta, "@pjnoventa");
  assert.deepEqual(contasDoStory(s[0]), ["pjnoventa", "beersfestival", "brasilbeerfest"]);
});

test("b-roll: 3 trechos, e duas bandas do mesmo dia não pegam a mesma abertura", () => {
  const acervo = Array.from({ length: 20 }, (_, i) => ({ file: `t${i}.mp4`, dur: 1.5, broll: { acao: i % 2 ? ["canta"] : ["guitarra"] } }));
  const a = clipesDoStory(acervo, "2026-10-10", 0), b = clipesDoStory(acervo, "2026-10-10", 1);
  assert.equal(a.length, 3);
  assert.notEqual(a[0].file, b[0].file);
  assert.equal(clipesDoStory(acervo.slice(0, 2), "2026-10-10", 0), null);
});

test("data: corta na primeira pausa depois do começo", () => {
  const saida = "silence_start: 0.1\nsilence_end: 0.3\nsilence_start: 1.438\nsilence_end: 1.65";
  assert.equal(primeiraPausa(saida), 1.438);
  assert.equal(primeiraPausa("nada"), null);
});
