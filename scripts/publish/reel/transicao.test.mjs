import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { argsFfmpeg, lerArgs, nomeValido, PASTA } from "./importar-transicao.mjs";

test("importador sempre tira o som e corta preciso", () => {
  const a = argsFfmpeg({ entrada: "in.mp4", saida: "out.mp4", ini: 0.4, fim: 2 });
  assert.ok(a.includes("-an"));
  assert.deepEqual(a.slice(a.indexOf("-ss"), a.indexOf("-ss") + 2), ["-ss", "0.4"]);
  assert.equal(a[a.indexOf("-t") + 1], "1.6");
});

test("argumentos e nome curto", () => {
  assert.deepEqual(lerArgs(["a.mp4", "alive-mike", "--musica", "Alive"]), { arquivo: "a.mp4", nome: "alive-mike", musica: "Alive" });
  assert.ok(nomeValido("even-flow-2"));
  assert.ok(!nomeValido("Even Flow"));
});

test("transicoes.json válido e todo arquivo listado existe", () => {
  const doc = JSON.parse(fs.readFileSync(`${PASTA}/transicoes.json`, "utf8"));
  assert.ok(Array.isArray(doc.transicoes));
  for (const t of doc.transicoes) assert.ok(fs.existsSync(`${PASTA}/${t.file}`), `falta ${t.file}`);
});
