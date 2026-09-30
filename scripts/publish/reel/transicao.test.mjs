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

test("momentos: janelas com mais movimento, sem atravessar corte, espaçadas", async () => {
  const { escolherCandidatos, lerMovimento } = await import("./momentos.mjs");
  assert.deepEqual(lerMovimento("frame:0 pts:0 pts_time:1.5\nlavfi.signalstats.YAVG=12.3\n"), [[1.5, 12.3]]);
  const mov = Array.from({ length: 400 }, (_, i) => [i / 10, i >= 200 && i < 230 ? 50 : 5]); // pico em 20 a 23 s
  const c = escolherCandidatos(mov, [21.2], 3);
  assert.ok(c.some((x) => x.ini >= 19.5 && x.fim <= 21.3 || x.ini >= 21.2 && x.fim <= 23.5), JSON.stringify(c));
  assert.ok(c.every((x) => !(x.ini < 21.05 && x.fim > 21.35)), "atravessou o corte");
});
