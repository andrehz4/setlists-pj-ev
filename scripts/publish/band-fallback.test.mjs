// Testes unitarios para band-fallback.mjs
// Rodar: node --test scripts/publish/band-fallback.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { loadBandFallbacks, pickFallback, BAND_DIR } from "./band-fallback.mjs";

// Sharp carregado so para os testes de resolucao (nao impacta o modulo principal).
const { default: sharp } = await import("sharp");

const MIN_WIDTH = 700; // px minimo aceitavel para um slide 1080px

describe("loadBandFallbacks", () => {
  test("retorna ao menos 1 arquivo", async () => {
    const fallbacks = await loadBandFallbacks();
    assert.ok(fallbacks.length >= 1, "pool vazio");
  });

  test("todos os arquivos existem no disco", async () => {
    const fallbacks = await loadBandFallbacks();
    for (const f of fallbacks) {
      const stat = await fs.stat(f).catch(() => null);
      assert.ok(stat !== null, `arquivo ausente: ${path.basename(f)}`);
      assert.ok(stat.size > 10_000, `arquivo muito pequeno (provavel corrompido): ${path.basename(f)} — ${stat.size} bytes`);
    }
  });

  test("todas as fotos tem largura minima de " + MIN_WIDTH + "px", async () => {
    const fallbacks = await loadBandFallbacks();
    for (const f of fallbacks) {
      const meta = await sharp(f).metadata();
      assert.ok(
        meta.width >= MIN_WIDTH,
        `${path.basename(f)} abaixo do minimo: ${meta.width}x${meta.height} (minimo ${MIN_WIDTH}px de largura)`
      );
    }
  });

  test("usa emergencia se pasta nao existir", async () => {
    const fallbacks = await loadBandFallbacks("/caminho/inexistente/xyz");
    assert.equal(fallbacks.length, 1);
    assert.ok(fallbacks[0].includes("_band-fallback-1.jpg"));
  });

  test("lista em ordem alfabetica", async () => {
    const fallbacks = await loadBandFallbacks();
    const names = fallbacks.map(f => path.basename(f));
    const sorted = [...names].sort();
    assert.deepEqual(names, sorted, "lista nao esta em ordem alfabetica");
  });
});

describe("pickFallback", () => {
  const pool = ["/a.jpg", "/b.jpg", "/c.jpg"];

  test("sempre retorna um item do pool", () => {
    for (const id of ["584585954a", "abc123", "0", "f", "zz99"]) {
      const result = pickFallback(pool, id, 0);
      assert.ok(pool.includes(result), `resultado fora do pool para id=${id}: ${result}`);
    }
  });

  test("ids diferentes produzem resultados diferentes (com pool suficiente)", () => {
    const bigPool = Array.from({ length: 16 }, (_, i) => `/foto-${i}.jpg`);
    const results = new Set();
    for (let hex = 0; hex < 16; hex++) {
      results.add(pickFallback(bigPool, hex.toString(16), 0));
    }
    assert.ok(results.size > 1, "todos os IDs mapearam pra mesma foto — rotacao nao esta funcionando");
  });

  test("mesmo id em dias diferentes produz fotos diferentes (com pool > 1)", () => {
    const results = new Set();
    for (let day = 0; day < pool.length; day++) {
      results.add(pickFallback(pool, "5a", day));
    }
    assert.equal(results.size, pool.length, "rotacao por dia nao esta ciclando todas as fotos");
  });

  test("id nulo nao lanca excecao", () => {
    assert.doesNotThrow(() => pickFallback(pool, null, 0));
    assert.doesNotThrow(() => pickFallback(pool, undefined, 0));
    assert.doesNotThrow(() => pickFallback(pool, "", 0));
  });

  test("id com caracteres nao-hex usa '0' como fallback", () => {
    const result = pickFallback(pool, "!!!!", 0);
    assert.equal(result, pickFallback(pool, "0", 0));
  });

  test("pool com 1 elemento sempre retorna o mesmo", () => {
    for (let day = 0; day < 100; day++) {
      assert.equal(pickFallback(["/unica.jpg"], "abc", day), "/unica.jpg");
    }
  });
});

describe("integracao: media/band/ real", () => {
  test("pasta media/band contem apenas JPEGs validos (sem corrompidos)", async () => {
    const fallbacks = await loadBandFallbacks(BAND_DIR);
    for (const f of fallbacks) {
      const meta = await sharp(f).metadata().catch(e => ({ error: e.message }));
      assert.ok(
        !meta.error,
        `${path.basename(f)} falhou ao decodificar com sharp: ${meta.error}`
      );
      assert.ok(
        meta.width >= MIN_WIDTH,
        `${path.basename(f)} resolucao insuficiente: ${meta.width}x${meta.height}`
      );
    }
  });

  test("pickFallback com pool real nunca retorna undefined", async () => {
    const fallbacks = await loadBandFallbacks(BAND_DIR);
    for (const id of ["0", "5", "a", "f", "584585954a", "d83c1231b7", null, ""]) {
      const result = pickFallback(fallbacks, id);
      assert.ok(typeof result === "string" && result.length > 0, `resultado invalido para id=${id}`);
    }
  });
});
