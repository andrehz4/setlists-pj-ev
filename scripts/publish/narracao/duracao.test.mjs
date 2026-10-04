// Duração das cenas narradas: a fala inteira SEMPRE cabe na cena (reel 2026-W40 saiu com
// manchetes de 11 a 13 s presas no teto de 9 s, e a voz invadia a cena seguinte).
//   node --test scripts/publish/narracao/duracao.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { duracoesSincronizadas } from "./narracao.mjs";
import { buildScenePlan } from "../reel-video.mjs";

const ITENS = [
  { id: "a", format: "kinetic", title_pt: "Manchete curta" },
  { id: "b", format: "card", title_pt: "Manchete comprida, de uns 180 caracteres, que a voz leva 13 s pra ler" },
];
const INICIO = 0.25;
const FOLGA_MINIMA = 0.3;

test("fala longa nunca invade a cena seguinte", () => {
  const { scenes } = buildScenePlan(ITENS);
  for (const fala of [7.0, 7.95, 8.5, 9.0, 11.2, 12.8]) {
    const d = duracoesSincronizadas(scenes, new Map([[1, fala]]));
    assert.ok(d[1] >= INICIO + fala + FOLGA_MINIMA, `fala de ${fala}s ficou presa em ${d[1]}s`);
    assert.ok(d[1] <= Math.max(9.0, INICIO + fala + FOLGA_MINIMA) + 1e-9, `fala de ${fala}s esticou demais: ${d[1]}s`);
  }
});

test("fala que cabe no teto continua em 9 s (só a folga encurta), reel não estica à toa", () => {
  const { scenes } = buildScenePlan(ITENS);
  assert.equal(duracoesSincronizadas(scenes, new Map([[1, 8.0]]))[1], 9.0);
  assert.ok(Math.abs(duracoesSincronizadas(scenes, new Map([[1, 5.0]]))[1] - 6.05) < 1e-9);
});

test("semana 2026-W40 (voz a ~14 caracteres/s): nenhuma fala termina depois da próxima começar", () => {
  const chars = [83, 123, 74, 179, 87, 157, 68, 160];
  const itens = chars.map((n, i) => ({ id: String(i), format: "card", title_pt: "x".repeat(n) }));
  const falas = new Map([[0, 3.4], ...chars.map((n, i) => [i + 1, n / 14]), [chars.length + 1, 5.4]]);
  const durs = duracoesSincronizadas(buildScenePlan(itens).scenes, falas);
  const { scenes } = buildScenePlan(itens, durs);
  scenes.forEach((s, i) => {
    const fimVoz = s.start + INICIO + falas.get(i);
    const proxima = scenes[i + 1];
    if (proxima) assert.ok(fimVoz < proxima.start + INICIO, `cena ${i}: voz até ${fimVoz.toFixed(2)}s, próxima fala em ${(proxima.start + INICIO).toFixed(2)}s`);
  });
});
