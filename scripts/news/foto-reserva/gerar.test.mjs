import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SAIDA, conteudo, montar } from "./gerar.mjs";

test("dados/fotos-reserva.js em sincronia com media/band/subjects", () => {
  assert.equal(fs.readFileSync(SAIDA, "utf8"), conteudo(), "rode node scripts/news/foto-reserva/gerar.mjs");
});

test("acervo tem fotos da banda e das pessoas, e todas existem", () => {
  const m = montar();
  assert.ok(m.banda.length > 5);
  assert.ok(m.pessoas.length > 5);
  for (const f of [...m.banda, ...m.pessoas.flatMap((p) => p.fotos)]) {
    assert.ok(fs.existsSync(new URL(`../../..${decodeURIComponent(f)}`, import.meta.url)), f);
  }
});
