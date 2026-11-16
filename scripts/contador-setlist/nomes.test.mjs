// Nomes do gerador de setlist: o que o gerador manda, o que o servidor aceita e grava, e o painel escapando o HTML.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PASTA } from "../setlist-ibirapuera/versao.mjs";
import { validar, MAX_CORPO } from "../../functions/_lib/contador.js";
import { EVENTOS_NOME, MAX_NOME, limparNome, nomesDoCorpo, quandoBrt, gravarNomes, lerNomes } from "../../functions/_lib/contador-nomes.js";
import { desenhar } from "../../functions/_lib/painel-setlist-desenho.js";
import { onRequestPost } from "../../functions/api/contador.js";
import { bancoFalso } from "./banco-falso.mjs";

Object.assign(globalThis, { location: { search: "", hash: "" } });
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Mozilla/5.0 (iPhone) Safari" }, configurable: true });
const { COM_NOME, corpo, nomeDoCampo } = await import(PASTA + "contador.js");

const SITE = "https://somaisumfadepearljam.com.br";
const pedido = (c) => new Request(`${SITE}/api/contador`, { method: "POST", body: c, headers: { Origin: SITE, "User-Agent": "Mozilla/5.0 (iPhone) Safari" } });
const MEIO_DIA = Date.UTC(2026, 10, 20, 15, 30, 5);
const RETRATO = { agora: new Date(MEIO_DIA).toISOString(), hoje: "2026-11-20", dias: {}, horas: [] };

test("gerador: nome só vai nos eventos certos e nunca vazio", () => {
  assert.deepEqual([...COM_NOME].sort(), [...EVENTOS_NOME].sort());
  for (const e of COM_NOME) assert.equal(JSON.parse(corpo(e, { nome: "Ana" })).nome, "Ana");
  for (const e of ["visita", "montou", "pediu_video", "saiu_app", "abriu_fora"]) {
    assert.deepEqual(Object.keys(JSON.parse(corpo(e, { nome: "Ana", barrado: "xx" }))).sort(), ["e", "ig"], e);
  }
  for (const vazio of ["", undefined, null]) assert.ok(!("nome" in JSON.parse(corpo("sorteou", { nome: vazio }))));
  assert.deepEqual(JSON.parse(corpo("sorteou", { noite: 2, nome: "", barrado: "p3d0" })), { e: "sorteou", ig: 0, n: 22, bar: "p3d0" });
});

test("gerador: primeiro nome igual ao do título, texto barrado vem do campo, tudo cabe no corpo", () => {
  assert.deepEqual(nomeDoCampo({ value: "  André Luiz ", dataset: {} }), { nome: "André", barrado: "" });
  assert.deepEqual(nomeDoCampo({ value: "", dataset: { barrado: "p u t a" } }), { nome: "", barrado: "p u t a" });
  assert.deepEqual(nomeDoCampo(null), { nome: "", barrado: "" });
  const cheio = corpo("baixou_imagem", { noite: 2, dentro: true, ...nomeDoCampo({ value: "ç".repeat(80), dataset: { barrado: "é".repeat(80) } }) });
  assert.ok(Buffer.byteLength(cheio) <= MAX_CORPO, "o maior corpo possível passa no limite do servidor");
  assert.equal(validar(cheio).e, "baixou_imagem");
});

test("servidor: nome só texto, até 30 caracteres, sem caractere de controle", () => {
  assert.equal(limparNome("  Ana   Maria \n"), "Ana Maria");
  assert.equal(limparNome("x".repeat(80)).length, MAX_NOME);
  assert.equal(limparNome("a\u0000b\u202ec\u200bd"), "a b c d");
  for (const ruim of [null, undefined, 42, true, ["Ana"], { nome: "Ana" }, "", "   ", "\u0000\u200b"]) assert.equal(limparNome(ruim), null, String(ruim));
});

test("servidor: nomesDoCorpo separa o nome do texto barrado e ignora evento sem nome", () => {
  assert.deepEqual(nomesDoCorpo('{"e":"sorteou","nome":"Ana","bar":"p3d0"}', "sorteou"), [{ nome: "Ana", barrado: 0 }, { nome: "p3d0", barrado: 1 }]);
  assert.deepEqual(nomesDoCorpo('{"e":"sorteou","nome":""}', "sorteou"), []);
  assert.deepEqual(nomesDoCorpo('{"e":"sorteou","nome":["Ana"],"bar":7}', "sorteou"), []);
  assert.deepEqual(nomesDoCorpo('{"e":"visita","nome":"Ana"}', "visita"), []);
  assert.deepEqual(nomesDoCorpo("{", "sorteou"), []);
});

test("POST /api/contador: grava nome, noite, evento, origem e hora de Brasília; nada além disso", async () => {
  assert.equal(quandoBrt(MEIO_DIA), "2026-11-20 12:30:05");
  const db = bancoFalso(), env = { CONTADOR_DB: db };
  await onRequestPost({ request: pedido('{"e":"sorteou","ig":1,"n":22,"nome":"Ana","bar":"<b>x</b>","ip":"1.2.3.4"}'), env });
  await onRequestPost({ request: pedido('{"e":"sorteou","ig":0}'), env });
  await onRequestPost({ request: pedido('{"e":"visita","ig":0,"nome":"Bia"}'), env });
  assert.equal(db.nomes.length, 2);
  assert.deepEqual(Object.keys(db.nomes[0]).sort(), ["barrado", "dentro_app", "evento", "id", "noite", "nome", "quando"]);
  assert.deepEqual({ ...db.nomes[1], id: 0, quando: "" }, { id: 0, nome: "<b>x</b>", barrado: 1, noite: 22, evento: "sorteou", dentro_app: 1, quando: "" });
  assert.match(db.nomes[0].quando, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  assert.equal(db.linhas.get([...db.linhas.keys()].find((k) => k.endsWith(":sorteou"))), 2, "a contagem segue igual");
});

test("banco novo: a tabela nomes nasce sob demanda e o painel abre vazio antes disso", async () => {
  const db = bancoFalso({ semTabela: true });
  assert.deepEqual(await lerNomes(db), { lista: [], distintos: 0, barrados: 0 });
  assert.equal(await gravarNomes(db, { e: "sorteou", noite: 20, ig: false }, [{ nome: "Ana", barrado: 0 }], MEIO_DIA), 1);
  assert.ok(db.sqls.some((s) => s.startsWith("CREATE TABLE IF NOT EXISTS nomes")));
  assert.equal(db.nomes.length, 1);
  await assert.rejects(gravarNomes({ prepare: () => ({ bind() { return this; }, run: async () => { throw new Error("D1 fora"); } }) }, { e: "sorteou" }, [{ nome: "A", barrado: 0 }]));
});

test("lerNomes: mais novo primeiro, no máximo 100, distintos sem contar barrado nem maiúscula", async () => {
  const db = bancoFalso(), ev = { e: "sorteou", noite: 20, ig: false };
  for (let i = 0; i < 120; i++) await gravarNomes(db, ev, [{ nome: i % 2 ? "Ana" : "ANA", barrado: 0 }], MEIO_DIA);
  await gravarNomes(db, ev, [{ nome: "Bia", barrado: 0 }, { nome: "feio", barrado: 1 }], MEIO_DIA);
  const r = await lerNomes(db);
  assert.equal(r.lista.length, 100);
  assert.equal(r.lista[0].nome, "feio");
  assert.deepEqual([r.distintos, r.barrados], [2, 1]);
});

test("painel: seção Nomes com hora, noite, evento e selo; HTML do nome sempre escapado (XSS)", () => {
  const ataque = `<img src=x onerror="alert(1)">'</script>`;
  const html = desenhar({ ...RETRATO, nomes: { distintos: 1234, barrados: 1, lista: [
    { nome: ataque, barrado: 1, noite: 22, evento: "sorteou", dentro_app: 1, quando: "2026-11-20 12:30:05" },
    { nome: "Ana & Bia", barrado: 0, noite: 20, evento: "<script>x</script>", dentro_app: 0, quando: "<svg onload=1>" },
  ] } });
  assert.ok(html.includes("<h2>Nomes</h2>") && html.includes("1.234"));
  assert.ok(!html.includes("<img") && !html.includes("<script") && !html.includes("</script") && !html.includes("<svg") && !html.includes('onerror="'));
  assert.ok(html.includes("&#60;img src=x onerror=&#34;alert(1)&#34;&#62;&#39;&#60;/script&#62;") && html.includes("Ana &#38; Bia"));
  assert.ok(html.includes("20/11 12:30") && html.includes("22/11") && html.includes("Sorteou") && html.includes("Instagram"));
  assert.equal(html.split('class="selo"').length - 1, 1, "selo só na linha barrada");
  assert.ok(desenhar(RETRATO).includes("Nenhum nome ainda."), "retrato antigo, sem nomes, não quebra");
});
