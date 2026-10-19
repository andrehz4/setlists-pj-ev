// Bug 18/10/2026: no reel, a fala da manchete longa ("O pai de Jeff Ament... viu a Califórnia", ~9,5 s) era cortada
// e a próxima entrava por cima. Causa: a cena tinha teto de 9 s mesmo com a voz mais longa. Durações reais das falas
// do reel 2026-W42 (whisper): 9,5 s, 11 s (Jack Irons) e 9 s (Matt Cameron).
import test from "node:test";
import assert from "node:assert/strict";
import { duracoesSincronizadas } from "../publish/narracao/narracao.mjs";

const INICIO_FALA = 0.25;
const scenes = [{ kind: "coldopen", dur: 3 }, ...Array.from({ length: 4 }, () => ({ kind: "card", dur: 4.5 })), { kind: "outro", dur: 2.5 }];
const falas = new Map([[0, 3.5], [1, 4.9], [2, 9.5], [3, 11.0], [4, 9.0], [5, 4.6]]);

// Cada voz tem que acabar antes da próxima começar.
function sobreposicoes(durs) {
  const inicios = durs.reduce((acc, d, i) => [...acc, i ? acc[i - 1] + durs[i - 1] : 0], []);
  const out = [];
  for (let i = 0; i < durs.length - 1; i++) {
    const fim = inicios[i] + INICIO_FALA + falas.get(i), proxima = inicios[i + 1] + INICIO_FALA;
    if (fim > proxima) out.push(i);
  }
  return out;
}

test("teto antigo de 9 s fazia voz falar por cima (prova do bug)", () => {
  const antigo = scenes.map((s, i) => Math.min(Math.max(3.5, INICIO_FALA + falas.get(i) + 0.8), 9.0));
  assert.deepEqual(sobreposicoes(antigo), [2, 3]); // a de 9 s encostava na próxima sem respiro
});

test("nenhuma fala é cortada pela próxima", () => {
  assert.deepEqual(sobreposicoes(duracoesSincronizadas(scenes, falas)), []);
});
