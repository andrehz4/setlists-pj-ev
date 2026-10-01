import test from "node:test";
import assert from "node:assert/strict";

test("rodízio: dias seguidos não repetem trecho nem capa até o acervo acabar", async () => {
  const { planejarTransicoes, trechosDaAbertura, ordem } = await import("./transicoes.mjs");
  assert.equal(ordem("2026-01-02") - ordem("2026-01-01"), 1);
  assert.equal(ordem("2026-W41") - ordem("2026-W40"), 1);
  const lista = Array.from({ length: 60 }, (_, i) => ({ file: `t${i}.mp4` }));
  for (let c = 0; c < 4; c++) lista.push({ file: `capa${c}.mp4`, capa: 0 });
  const cenas = [0, 3, 6, 9, 12, 15, 18].map((start) => ({ start }));
  const vistos = new Set();
  for (let d = 1; d <= 10; d++) for (const p of planejarTransicoes(cenas, lista, `2026-03-${String(d).padStart(2, "0")}`)) {
    assert.ok(!vistos.has(p.trecho.file), `repetiu ${p.trecho.file} no dia ${d}`);
    vistos.add(p.trecho.file);
  }
  const capas = [1, 2, 3, 4].map((d) => trechosDaAbertura(lista, `2026-03-0${d}`)[0].file);
  assert.equal(new Set(capas).size, 4);
});
