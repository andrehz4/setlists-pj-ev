import test from "node:test";
import assert from "node:assert/strict";
import { montarTempos, tempoDesign, marcasDeAudio, nomeCena, PUNCH } from "./tempos.mjs";
import { estiloDaSemana, semanaIso, showsDoReel, paraDesign } from "./semana.mjs";
import { textoDia, textoMapa, falasDoReel } from "./falas.mjs";
import { filaDaBanda, planoDoFundo } from "./fundo.mjs";

const DIAS = [{ data: "2026-11-26", n: 1, punch: [true] }, { data: "2026-11-27", n: 4, punch: [true, true, true, true] }];

test("nome da cena igual ao do Design", () => {
  assert.equal(nomeCena("2026-11-27"), "Sexta 27/11");
  assert.equal(nomeCena("2026-11-28"), "Sábado 28/11");
});

test("sem voz, cenas com a duração do Design; com voz, a cena estica e nunca corta a fala", () => {
  const sem = montarTempos(DIAS);
  assert.deepEqual(sem.cenas.map((c) => c.dur), [3, 3.5, 3, 8.1, 3]);
  const com = montarTempos(DIAS, { Abertura: 2.4, Mapa: 4, "2026-11-27": 9 });
  assert.deepEqual(com.cenas.map((c) => c.dur), [3, 4.5, 3, 9.5, 3]);
});

test("corte da banda antes de cada show e a régua do vídeo bate com a do Design", () => {
  const t = montarTempos(DIAS);
  const punches = t.segs.filter((s) => s.tipo === "punch");
  assert.equal(punches.length, 5);
  assert.ok(Math.abs(t.total - (t.totalDesign + 5 * PUNCH)) < 1e-3);
  // troca do 2º show da sexta: S + 0,9 + (8,1 - 0,9)/4 - 0,15
  const sexta = t.cenas[3];
  const seg = t.segs.find((s) => s.tipo === "design" && s.data === "2026-11-27" && s.show === 1);
  assert.ok(Math.abs(seg.de - (sexta.S + 0.9 + 1.8 - 0.15)) < 1e-6);
  // dentro de um corte não há desenho; logo depois, o Design retoma de onde parou
  assert.equal(tempoDesign(t.segs, punches[1].ini + 0.1), null);
  assert.ok(Math.abs(tempoDesign(t.segs, punches[1].ini + PUNCH + 0.2) - (sexta.S + 0.2)) < 1e-6);
});

test("banda sem vídeo não ganha corte; whoosh vai na entrada do dia", () => {
  const t = montarTempos([{ data: "2026-11-26", n: 1, punch: [false] }]);
  assert.equal(t.segs.filter((s) => s.tipo === "punch").length, 0);
  const m = marcasDeAudio(t);
  assert.ok(m.whoosh.includes(t.segs.find((s) => s.data === "2026-11-26").ini));
  assert.equal(m.falas.find((f) => f.chave === "2026-11-26").em, +(t.cenas[2].S + 0.15).toFixed(3));
});

test("rodízio: 12 semanas seguidas = 12 combinações diferentes; env força", () => {
  const combos = new Set(Array.from({ length: 12 }, (_, i) => JSON.stringify(estiloDaSemana(`2026-W${30 + i}`, {}))));
  assert.equal(combos.size, 12);
  assert.deepEqual(estiloDaSemana("2026-W49", { AGENDA_REEL_LAYOUT: "C", AGENDA_REEL_PALETA: "azul" }), { layout: "C", paleta: "azul" });
  assert.equal(semanaIso("2026-11-24"), "2026-W48");
  assert.equal(semanaIso("2027-01-01"), "2026-W53");
});

test("shows de terça a domingo, sem fechado, ordem por data", () => {
  const S = (data, extra = {}) => ({ data, banda: "b", nome: "B", cidade: "Osasco", uf: "SP", ...extra });
  const r = showsDoReel([S("2026-11-30"), S("2026-11-28"), S("2026-11-23"), S("2026-11-24", { fechado: true }), S("2026-11-26")], "2026-11-24");
  assert.deepEqual(r.map((s) => s.data), ["2026-11-26", "2026-11-28"]);
  const d = paraDesign({ ...S("2026-11-26"), banda: "pjnoventa", nome: "PJ 90", casa: "lmb", hora: "23:00" }, { comClipe: () => false });
  assert.equal(d.arrobaBanda, "@pjnoventa");
  assert.equal(d.arrobaCasa, "@lmb");
  assert.equal(d.semClipe, true);
  assert.ok(d.lat < -23 && d.lon < -46); // Osasco: lat e lon na ordem certa
});

test("falas com a pronúncia aprovada", () => {
  const s = [{ data: "2026-11-27", cidade: "Osasco", nome: "Lost Dogs" }, { data: "2026-11-27", cidade: "Osasco", nome: "PJ 90" }];
  assert.equal(textoDia("2026-11-27", s), "Na sexta, Ozasco, Lost Dogs e Pearl Jam noventa.");
  assert.equal(textoMapa(9, 8), "São nove shows em oito cidades.");
  assert.equal(falasDoReel(s).length, 4);
});

test("fundo: covers da própria banda, sem repetir trecho, corte prefere close", () => {
  const aprovados = (conta) => (conta === "b1" ? [
    { file: "a.mp4", dur: 3, nota: 4, broll: { plano: "close" } }, { file: "b.mp4", dur: 3, nota: 3 },
    { file: "c.mp4", dur: 3, nota: 5, tags: ["marca:x"] }, { file: "d.mp4", dur: 3, nota: 2 }] : []);
  assert.deepEqual(filaDaBanda("b1", "s", aprovados).map((c) => c.file).sort(), ["a.mp4", "b.mp4"]);
  const t = montarTempos([{ data: "2026-11-26", n: 1, punch: [true] }]);
  const p = planoDoFundo(t, [{ data: "2026-11-26", banda: "b1" }], { semente: "W", aprovados });
  const corte = p[5]; // 4 cortes do PJ, o mapa (preto), o corte da banda
  assert.equal(p.slice(0, 4).every((x) => x.fonte.tipo === "pj"), true);
  assert.equal(corte.fonte.trecho.file, "a.mp4");
  assert.ok(Math.abs(p.reduce((a, x) => a + x.dur, 0) - t.total) < 1e-6);
});
