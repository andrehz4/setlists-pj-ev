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

test("transições: uma por troca de cena, rodízio sem repetir, filtro sobrepõe no ponto certo", async () => {
  const { planejarTransicoes, filtroFfmpeg, DUR } = await import("./transicoes.mjs");
  const scenes = [{ start: 0 }, { start: 3 }, { start: 7.5 }, { start: 12 }];
  const lista = ["a", "b", "c"].map((f) => ({ file: f, arq: f, dur: 1.5 }));
  const p = planejarTransicoes(scenes, lista, "2026-W40");
  assert.equal(p.length, 3);
  assert.equal(new Set(p.map((x) => x.trecho.file)).size, 3);
  assert.equal(p[0].t, 3 - DUR / 2);
  const f = filtroFfmpeg(p);
  assert.match(f, /between\(t,2\.650,3\.350\)/);
  assert.match(f, /\[v\]$/);
  assert.deepEqual(planejarTransicoes(scenes, [], "x"), []);
});

test("capa na abertura: entre 1,8 e 2,4 s, antes do fim da abertura", async () => {
  const { capaNaAbertura } = await import("./transicoes.mjs");
  assert.equal(capaNaAbertura(3), 2400);
  assert.equal(capaNaAbertura(3.9), 2400);
  assert.equal(capaNaAbertura(2.2), 1800);
});

test("trazer do baixa: só o que é novo, com capa/foco e tags em lista", async () => {
  const { novos } = await import("./trazer-do-baixa.mjs");
  const la = [
    { file: "a.mp4", musica: "Alive", capa: 0.75, foco: 0.3, tags: "eddie, memoria", extra: "x" },
    { file: "b.mp4" },
  ];
  const r = novos(la, [{ file: "b.mp4" }]);
  assert.deepEqual(r, [{ file: "a.mp4", musica: "Alive", capa: 0.75, foco: 0.3, tags: ["eddie", "memoria"] }]);
});

test("recorte: foco fixo, centro por padrão e trilha do rosto vira expressão por tempo", async () => {
  const { recorte } = await import("./transicoes.mjs");
  assert.equal(recorte({}), "crop=ih*9/16:ih:x=(iw-ih*9/16)*(0.5)");
  assert.equal(recorte({ foco: 1.4 }), "crop=ih*9/16:ih:x=(iw-ih*9/16)*(1)");
  const r = recorte({ focoTrilha: [{ t: 0, foco: 0.2 }, { t: 1, foco: 0.8 }] });
  assert.match(r, /if\(lt\(t\\,1\)\\,0\.200\+\(0\.600\)\*\(t-0\)\/1\\,0\.800\)/);
});

test("recorte: foco fixo, centro por padrão e trilha do rosto vira expressão por tempo", async () => {
  const { recorte } = await import("./transicoes.mjs");
  assert.equal(recorte({}), "crop=ih*9/16:ih:x=(iw-ih*9/16)*(0.5)");
  assert.equal(recorte({ foco: 1.4 }), "crop=ih*9/16:ih:x=(iw-ih*9/16)*(1)");
  const r = recorte({ focoTrilha: [{ t: 0, foco: 0.2 }, { t: 1, foco: 0.8 }] });
  assert.match(r, /if\(lt\(t\\,1\)\\,0\.200\+\(0\.600\)\*\(t-0\)\/1\\,0\.800\)/);
});


test("abertura sem capa: 4 trechos iguais somando a duração, sem o da 1a transição", async () => {
  const { trechosDaAbertura, planejarTransicoes } = await import("./transicoes.mjs");
  const lista = ["a", "b", "c", "d", "e", "f"].map((f) => ({ file: f, arq: f, dur: 1.5 }));
  for (const dur of [3, 3.9]) {
    const ab = trechosDaAbertura(lista, "2026-W40", { dur });
    assert.equal(ab.length, 4);
    assert.equal(new Set(ab.map((t) => t.file)).size, 4);
    assert.ok(Math.abs(ab.reduce((s, t) => s + t.slot, 0) - dur) < 1e-9);
    const primeira = planejarTransicoes([{ start: 0 }, { start: 3 }], lista, "2026-W40")[0].trecho.file;
    assert.ok(!ab.some((t) => t.file === primeira));
  }
  assert.deepEqual(trechosDaAbertura([], "x"), []);
});

test("abertura com capa: a abertura inteira é o clipe da capa, do começo", async () => {
  const { trechosDaAbertura } = await import("./transicoes.mjs");
  const lista = [{ file: "a", arq: "a", dur: 1.5 }, { file: "c", arq: "c", dur: 3, capa: 0 }];
  const ab = trechosDaAbertura(lista, "x", { dur: 3.6 });
  assert.deepEqual(ab.map((t) => [t.file, t.iniAbertura, t.slot]), [["c", 0, 3.6]]);
});
