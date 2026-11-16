// Contador do gerador de setlist do Ibirapuera: validação e soma dos eventos, leitura do painel e trava da chave.
// Sem rede: o D1 é um banco de mentira em memória que entende o upsert e as duas consultas do módulo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENTOS, MAX_CORPO, validar, pedidoValido, brt, chaves, somar, ler, chaveConfere } from "../../functions/_lib/contador.js";
import { onRequestPost } from "../../functions/api/contador.js";
import { onRequestGet as painel } from "../../functions/painel-setlist.js";

function bancoFalso() {
  const linhas = new Map();
  const prepare = (sql) => ({
    args: [],
    bind(...a) { this.args = a; return this; },
    async run() { for (const k of this.args) linhas.set(k, (linhas.get(k) || 0) + 1); },
    async all() {
      const de = this.args[0] ?? "d:", ate = sql.includes("'h;'") ? "h;" : "d;";
      return { results: [...linhas].filter(([k]) => k >= de && k < ate).map(([chave, n]) => ({ chave, n })) };
    },
  });
  return { linhas, prepare };
}
const SITE = "https://somaisumfadepearljam.com.br";
const pedido = (corpo, cab = {}) => new Request(`${SITE}/api/contador`, { method: "POST", body: corpo,
  headers: { Origin: SITE, "User-Agent": "Mozilla/5.0 (iPhone) Safari", ...cab } });
const MEIO_DIA = Date.UTC(2026, 10, 20, 15, 30); // 12:30 em Brasília

test("validar: só evento da lista, noite 20 ou 22, corpo pequeno", () => {
  assert.deepEqual(validar('{"e":"visita","ig":1}'), { e: "visita", noite: null, ig: true });
  assert.deepEqual(validar('{"e":"sorteou","n":22,"ig":0}'), { e: "sorteou", noite: 22, ig: false });
  assert.equal(validar('{"e":"sorteou","n":21}').noite, null);
  for (const ruim of ['{"e":"hack"}', '{"e":"__proto__"}', "[]", "null", "{", "", '{"e":["visita"]}', 42]) assert.equal(validar(ruim), null, String(ruim));
  assert.equal(validar(JSON.stringify({ e: "visita", lixo: "x".repeat(MAX_CORPO) })), null);
});

test("validar: dado pessoal mandado junto nunca passa adiante", () => {
  assert.deepEqual(Object.keys(validar('{"e":"visita","nome":"Ana","ip":"1.2.3.4"}')), ["e", "noite", "ig"]);
});

test("brt: dia e hora de Brasília, inclusive na virada da meia-noite", () => {
  assert.deepEqual(brt(MEIO_DIA), { dia: "2026-11-20", hora: "2026-11-20T12" });
  assert.deepEqual(brt(Date.UTC(2026, 10, 21, 2, 59)), { dia: "2026-11-20", hora: "2026-11-20T23" });
  assert.deepEqual(brt(Date.UTC(2026, 10, 21, 3, 0)), { dia: "2026-11-21", hora: "2026-11-21T00" });
});

test("chaves: dia com origem e noite, hora só do evento puro", () => {
  assert.deepEqual(chaves({ e: "baixou_video", noite: 22, ig: true }, MEIO_DIA),
    ["d:2026-11-20:baixou_video", "d:2026-11-20:baixou_video.ig", "d:2026-11-20:baixou_video.n22", "h:2026-11-20T12:baixou_video"]);
  assert.deepEqual(chaves({ e: "visita", noite: null, ig: false }, MEIO_DIA),
    ["d:2026-11-20:visita", "d:2026-11-20:visita.fora", "h:2026-11-20T12:visita"]);
});

test("somar e ler: soma por dia e por hora, 48 horas em ordem, total sai dos dias", async () => {
  const db = bancoFalso();
  await somar(db, { e: "visita", noite: null, ig: true }, MEIO_DIA - 24 * 3600e3);
  for (let i = 0; i < 3; i++) await somar(db, { e: "visita", noite: null, ig: i === 0 }, MEIO_DIA);
  await somar(db, { e: "sorteou", noite: 20, ig: false }, MEIO_DIA);
  await somar(db, { e: "visita", noite: null, ig: false }, MEIO_DIA - 60 * 3600e3); // fora das 48 h, mas conta no dia
  const d = await ler(db, MEIO_DIA);
  assert.equal(d.hoje, "2026-11-20");
  assert.deepEqual(d.dias["2026-11-20"], { visita: 3, "visita.ig": 1, "visita.fora": 2, sorteou: 1, "sorteou.fora": 1, "sorteou.n20": 1 });
  assert.equal(d.dias["2026-11-19"].visita, 1);
  assert.equal(d.dias["2026-11-18"].visita, 1);
  assert.equal(d.horas.length, 48);
  assert.deepEqual(d.horas.at(-1), { h: "2026-11-20T12", visita: 3, sorteou: 1 });
  assert.deepEqual(d.horas.at(-25), { h: "2026-11-19T12", visita: 1 });
  assert.equal(d.horas[0].h, "2026-11-18T13");
  assert.equal(d.horas.reduce((s, h) => s + (h.visita || 0), 0), 4);
});

test("POST /api/contador: conta evento bom, recusa o resto e não quebra sem banco", async () => {
  const db = bancoFalso(), env = { CONTADOR_DB: db };
  assert.equal((await onRequestPost({ request: pedido('{"e":"visita","ig":1}'), env })).status, 204);
  assert.equal(db.linhas.size, 3);
  assert.equal((await onRequestPost({ request: pedido('{"e":"apagar_tudo"}'), env })).status, 400);
  assert.equal((await onRequestPost({ request: pedido(JSON.stringify({ e: "visita", x: "y".repeat(500) })), env })).status, 400);
  assert.equal((await onRequestPost({ request: pedido('{"e":"visita"}', { "Content-Length": "5000" }), env })).status, 413);
  for (const cab of [{ Origin: "https://outro.site" }, { "User-Agent": "Googlebot/2.1" }, { "User-Agent": "curl/8" }]) {
    assert.equal((await onRequestPost({ request: pedido('{"e":"visita"}', cab), env })).status, 204);
  }
  assert.equal(db.linhas.size, 3, "outro site e robô não somam");
  assert.equal((await onRequestPost({ request: pedido('{"e":"visita"}'), env: {} })).status, 204);
  const quebrado = { prepare: () => ({ bind() { return this; }, run: async () => { throw new Error("D1 fora"); } }) };
  assert.equal((await onRequestPost({ request: pedido('{"e":"visita"}'), env: { CONTADOR_DB: quebrado } })).status, 204);
});

test("pedidoValido: sem Origin vale o Referer do próprio site", () => {
  const r = (h) => new Request(`${SITE}/api/contador`, { method: "POST", headers: { "User-Agent": "Mozilla/5.0", ...h } });
  assert.equal(pedidoValido(r({ Referer: `${SITE}/setlist-ibirapuera/` })), true);
  assert.equal(pedidoValido(r({ Referer: "https://somaisumfadepearljam.com.br.golpe.com/" })), false);
  assert.equal(pedidoValido(r({})), false);
});

test("trava da chave: só a chave exata abre; segredo curto ou ausente deixa fechado", () => {
  const certa = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
  assert.equal(chaveConfere(certa, certa), true);
  for (const dada of [null, undefined, "", certa.slice(0, -1), certa + "0", certa.replace("a", "b")]) assert.equal(chaveConfere(dada, certa), false);
  assert.equal(chaveConfere("curta", "curta"), false);
  assert.equal(chaveConfere("", ""), false);
  assert.equal(chaveConfere("undefined", undefined), false);
});

test("painel: 404 sem a chave, página noindex com os números e JSON com a chave", async () => {
  const chave = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", db = bancoFalso(), env = { CONTADOR_DB: db, PAINEL_SETLIST_CHAVE: chave };
  for (let i = 0; i < 1234; i++) await somar(db, { e: "visita", noite: null, ig: false });
  const abrir = (q, e = env) => painel({ request: new Request(`${SITE}/painel-setlist${q}`), env: e });
  for (const q of ["", "?k=", "?k=errada", `?k=${chave}x`]) {
    const r = await abrir(q);
    assert.equal(r.status, 404, q);
    assert.ok(!(await r.text()).includes("1.234"));
  }
  assert.equal((await abrir(`?k=${chave}`, { CONTADOR_DB: db })).status, 404, "sem o segredo configurado ninguém entra");
  const ok = await abrir(`?k=${chave}`), html = await ok.text();
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("X-Robots-Tag"), /noindex/);
  assert.match(ok.headers.get("Cache-Control"), /no-store/);
  assert.match(html, /name="robots" content="noindex/);
  assert.ok(html.includes("1.234") && html.includes("#f0b93a") && html.includes("setInterval(atualizar, 30000)"));
  assert.ok(!html.includes(chave), "a chave não é escrita na página");
  assert.ok(!/(src|href)="https?:/.test(html), "nada de fora: a chave está na URL");
  const json = await (await abrir(`?k=${chave}&json=1`)).json();
  assert.equal(json.dias[json.hoje].visita, 1234);
  assert.equal((await abrir(`?k=${chave}`, { PAINEL_SETLIST_CHAVE: chave })).status, 503);
});

test("lista de eventos do servidor não tem repetido", () => assert.equal(new Set(EVENTOS).size, EVENTOS.length));
