// Trilha própria ligada no publish: flag, fallback pra trilha antiga, rodízio de camas, kit sem caminho do SSD
// e mixagens que não passam a trilha pronta por loudnorm (apagaria o golpe).
import { test } from "node:test";
import assert from "node:assert/strict";
import { trilhaPropria, camaDoDia, CAMAS_POR_USO } from "./ligar.mjs";
import { kitParaPublicar, relativo } from "./r2.mjs";
import { planoReel, golpesDoPlano } from "./plano.mjs";
import { filtroMixagem } from "../narracao/narracao.mjs";
import { COLD_DUR, BLOCK_DUR, OUTRO_DUR } from "../reel/base.mjs";

const cama = (id, passou = true) => ({ id, titulo: id, acr: { passou }, duracao_s: 120, comeco_sem_bateria_s: 4,
  partes: [{ de: 30, ate: 40, nivel: "cheio" }], pistas: { teclado: { arquivo: `/ssd/${id}/k.wav` } }, mix: "/ssd/mix.wav" });
const KIT = { gerado_por: "x", licenca: "Suno Premier", camas: ["hz-pj-01a", "hz-pj-03a", "hz-pj-04a", "hz-pj-04b"].map((i) => cama(i)) };
const base = { uso: "reel", semente: "2026-W46", plano: planoReel(8), duracao: 41.5, saida: "/tmp/x.m4a" };

test("sem TRILHA_PROPRIA=1 não liga (segue a trilha antiga)", () => {
  assert.equal(trilhaPropria({ ...base, env: {}, lerKit: () => { throw new Error("não devia ler"); } }), null);
});

test("sem kit, sem R2 ou com erro na mixagem: null, nunca derruba o publish", () => {
  const env = { TRILHA_PROPRIA: "1" };
  assert.equal(trilhaPropria({ ...base, env, lerKit: () => null }), null);
  assert.equal(trilhaPropria({ ...base, env, lerKit: () => KIT, materializar: () => null }), null);
  assert.equal(trilhaPropria({ ...base, env, lerKit: () => KIT, materializar: () => { throw new Error("rede"); } }), null);
});

test("ligada: devolve a trilha mixada marcada como própria", () => {
  let recebeu;
  const r = trilhaPropria({ ...base, env: { TRILHA_PROPRIA: "1" }, lerKit: () => KIT, materializar: (c) => c,
    montar: (a) => { recebeu = a; return { saida: a.saida, magro: "teclado" }; } });
  assert.equal(r.propria, true);
  assert.equal(r.path, "/tmp/x.m4a");
  assert.equal(recebeu.plano, base.plano);
});

test("rodízio: mesma semente, mesma cama; story e agenda só usam as camas do seu uso", () => {
  assert.equal(camaDoDia(KIT, "reel", "2026-W46").id, camaDoDia(KIT, "reel", "2026-W46").id);
  for (let d = 1; d <= 20; d++) {
    assert.ok(CAMAS_POR_USO.story.includes(camaDoDia(KIT, "story", `2026-11-${d}`).id));
    assert.ok(CAMAS_POR_USO.agenda.includes(camaDoDia(KIT, "agenda", `2026-11-${d}-banda`).id));
  }
  const vistas = new Set(Array.from({ length: 30 }, (_, i) => camaDoDia(KIT, "reel", `2026-W${i}`).id));
  assert.ok(vistas.size > 1, "o reel roda mais de uma cama");
});

test("kit publicado: sem caminho do SSD, sem cama reprovada no ACRCloud", () => {
  const k = kitParaPublicar({ ...KIT, camas: [...KIT.camas, cama("hz-pj-99", false)] });
  const txt = JSON.stringify(k);
  assert.doesNotMatch(txt, /\/ssd\//);
  assert.ok(!k.camas.some((c) => c.id === "hz-pj-99"));
  assert.equal(k.camas[0].pistas.teclado.arquivo, relativo("hz-pj-01a", "teclado"));
});

test("plano do reel com as cenas reais (narração): sem cenas é o mesmo plano fixo", () => {
  const fixas = [{ start: 0, dur: COLD_DUR }, ...Array.from({ length: 8 }, (_, i) => ({ start: COLD_DUR + i * BLOCK_DUR, dur: BLOCK_DUR })),
    { start: COLD_DUR + 8 * BLOCK_DUR, dur: OUTRO_DUR }];
  assert.deepEqual(planoReel(8, fixas), planoReel(8));
  const longas = fixas.map((c, i) => ({ start: i * 6, dur: 6 }));
  const p = planoReel(8, longas);
  assert.deepEqual(golpesDoPlano(p), [6, 36]);
  assert.equal(p.at(-1).ate, 60);
});

test("narração com trilha própria: ganho fixo na música, sem loudnorm (golpe preservado)", () => {
  const pronta = filtroMixagem([{ sceneIndex: 0 }], [0], { musicaPronta: true });
  assert.match(pronta, /\[0:a\]volume=-8dB/);
  assert.doesNotMatch(pronta.split("[cama]")[0], /loudnorm/);
  assert.match(filtroMixagem([{ sceneIndex: 0 }], [0]), /\[0:a\]loudnorm/);
});
