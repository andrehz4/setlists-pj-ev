// Painel de colaboradores: regras da legenda (funções puras) e regra 0 (arquivos curtos).
// Roda no `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// legendas.js importa api.js, que só toca o DOM quando chamado; o import é seguro no node.
const { ESTILOS, grupoEm, palavrasDe, trechoEm } = await import("./legendas.js");

const PASTA = dirname(fileURLToPath(import.meta.url));
const MAX_LINHAS = 160;

test("regra 0: todo arquivo do painel tem no máximo 160 linhas", () => {
  const arquivos = readdirSync(PASTA).filter((f) => /\.(js|mjs|css)$/.test(f));
  assert.ok(arquivos.length >= 10);
  for (const f of arquivos) {
    const linhas = readFileSync(join(PASTA, f), "utf8").split("\n").length;
    assert.ok(linhas <= MAX_LINHAS, `${f} tem ${linhas} linhas (máx ${MAX_LINHAS}); quebrar em módulos`);
  }
});

test("três estilos de legenda mais a opção sem legenda", () => {
  assert.deepEqual(ESTILOS.map((e) => e.id), ["palavra", "faixa", "cinema", "nenhuma"]);
});

test("palavras do Whisper são usadas quando o texto não foi editado", () => {
  const t = { start: 0, end: 2, text: "Em 1991", words: [{ w: "Em", s: 0, e: 0.4 }, { w: "1991", s: 0.5, e: 1.8 }] };
  assert.equal(palavrasDe(t), t.words);
});

test("texto editado redistribui o tempo por igual no trecho", () => {
  const t = { start: 10, end: 13, text: "o Ten saiu", words: [{ w: "Ten", s: 10, e: 11 }] };
  assert.deepEqual(palavrasDe(t).map((p) => [p.w, p.s]), [["o", 10], ["Ten", 11], ["saiu", 12]]);
});

test("estilo palavra mostra grupos de 3 e acende a palavra falada", () => {
  const ps = ["um", "dois", "tres", "quatro", "cinco"].map((w, i) => ({ w, s: i, e: i + 1 }));
  assert.deepEqual(grupoEm(ps, 1.5), { itens: ["um", "dois", "tres"], ativa: 1 });
  assert.deepEqual(grupoEm(ps, 4.2), { itens: ["quatro", "cinco"], ativa: 1 });
});

test("trecho vigente no tempo, com folga curta no fim", () => {
  const ls = [{ start: 0, end: 2, text: "a" }, { start: 3, end: 5, text: "b" }];
  assert.equal(trechoEm(ls, 2.1)?.text, "a");
  assert.equal(trechoEm(ls, 2.6), null);
  assert.equal(trechoEm(ls, 4)?.text, "b");
});
