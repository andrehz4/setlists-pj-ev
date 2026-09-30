import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { escolherNoticias, hojeBRT } from "./kit-do-dia.mjs";

const agora = Date.parse("2026-09-30T20:00:00Z");
const h = (horas) => new Date(agora - horas * 3600e3).toISOString();
const indice = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, title_pt: id }));

test("pega só as últimas 24h, mais novas primeiro, máx. 4, sem repetir kit anterior", () => {
  const fila = [
    { id: "a", postedAt: h(1) }, { id: "b", postedAt: h(2) }, { id: "c", postedAt: h(3) },
    { id: "d", postedAt: h(30) }, { id: "e", postedAt: h(4) }, { id: "f", postedAt: h(5) }, { id: "g" },
  ];
  const r = escolherNoticias({ fila, indice, jaUsados: new Set(["b"]), agora, existeCard: () => true });
  assert.deepEqual(r.map((i) => i.id), ["a", "c", "e", "f"]);
});

test("sem card (imagem) a notícia fica de fora", () => {
  const r = escolherNoticias({ fila: [{ id: "a", postedAt: h(1) }], indice, jaUsados: new Set(), agora, existeCard: () => false });
  assert.equal(r.length, 0);
});

test("dia em BRT (UTC-3): 01h UTC ainda é o dia anterior", () => {
  assert.equal(hojeBRT(new Date("2026-10-01T01:00:00Z")), "2026-09-30");
});

test("Regra 0: arquivos do módulo X com no máximo 150 linhas", () => {
  const dir = path.dirname(new URL(import.meta.url).pathname);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mjs"))) {
    const linhas = fs.readFileSync(path.join(dir, f), "utf8").trimEnd().split("\n").length;
    assert.ok(linhas <= 150, `${f} tem ${linhas} linhas`);
  }
});
