// Porta do painel do contador: só abre com usuário e senha (HTTP Basic Auth). O acesso antigo por ?k=<chave> acabou.
import { test } from "node:test";
import assert from "node:assert/strict";
import { credenciais, igual, acesso } from "../../functions/_lib/painel-acesso.js";
import { somar } from "../../functions/_lib/contador.js";
import { onRequestGet as painel } from "../../functions/painel-setlist.js";
import { bancoFalso } from "./banco-falso.mjs";

const SITE = "https://somaisumfadepearljam.com.br";
const basic = (u, s) => "Basic " + Buffer.from(`${u}:${s}`, "utf8").toString("base64");
const SEGREDOS = { PAINEL_USUARIO: "andre", PAINEL_SENHA: "Senha:com dois pontos e ção" };
const abrir = (q, env, auth) => painel({ request: new Request(`${SITE}/painel-setlist${q}`, { headers: auth ? { Authorization: auth } : {} }), env });

test("credenciais: lê usuário e senha (senha pode ter dois pontos e acento), recusa cabeçalho torto", () => {
  assert.deepEqual(credenciais(basic("andre", "a:b ção")), { usuario: "andre", senha: "a:b ção" });
  for (const ruim of [null, "", "Bearer abc", "Basic", "Basic ###", "Basic " + Buffer.from("semdoispontos").toString("base64"), "Basic /w=="]) {
    assert.equal(credenciais(ruim), null, String(ruim));
  }
});

test("igual: só texto idêntico, com qualquer tamanho", async () => {
  assert.equal(await igual("abc", "abc"), true);
  for (const [a, b] of [["abc", "abd"], ["abc", "abcd"], ["", "abc"], ["abc", ""], ["ABC", "abc"]]) assert.equal(await igual(a, b), false);
});

test("acesso: falta sem os segredos, negado sem credencial ou com errada, ok com a certa", async () => {
  const req = (auth) => new Request(SITE, { headers: auth ? { Authorization: auth } : {} });
  const certa = basic("andre", SEGREDOS.PAINEL_SENHA);
  for (const env of [undefined, {}, { PAINEL_USUARIO: "andre" }, { PAINEL_SENHA: "x" }, { PAINEL_USUARIO: "", PAINEL_SENHA: "" }]) {
    assert.equal(await acesso(req(certa), env), "falta");
  }
  assert.equal(await acesso(req(), SEGREDOS), "negado");
  for (const [u, s] of [["andre", "errada"], ["outro", SEGREDOS.PAINEL_SENHA], ["", ""], ["andre", ""], ["andre", SEGREDOS.PAINEL_SENHA + " "]]) {
    assert.equal(await acesso(req(basic(u, s)), SEGREDOS), "negado", `${u}:${s}`);
  }
  assert.equal(await acesso(req(certa), SEGREDOS), "ok");
});

test("painel: 401 sem credencial e com errada, 200 com a certa, 503 sem segredos, ?k= velho não abre", async () => {
  const db = bancoFalso(), env = { CONTADOR_DB: db, ...SEGREDOS }, certa = basic("andre", SEGREDOS.PAINEL_SENHA);
  for (let i = 0; i < 1234; i++) await somar(db, { e: "visita", noite: null, ig: false });
  const chaveVelha = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
  const fechados = [["", null], ["", basic("andre", "errada")], ["", basic("hacker", SEGREDOS.PAINEL_SENHA)], [`?k=${chaveVelha}`, null], ["?json=1", null]];
  for (const [q, auth] of fechados) {
    const r = await abrir(q, { ...env, PAINEL_SETLIST_CHAVE: chaveVelha }, auth);
    assert.equal(r.status, 401, q + " " + auth);
    assert.equal(r.headers.get("WWW-Authenticate"), 'Basic realm="Painel", charset="UTF-8"');
    assert.match(r.headers.get("Cache-Control"), /no-store/);
    assert.match(r.headers.get("X-Robots-Tag"), /noindex/);
    assert.ok(!(await r.text()).includes("1.234"));
  }
  for (const e of [{ CONTADOR_DB: db }, { CONTADOR_DB: db, PAINEL_USUARIO: "andre" }, { CONTADOR_DB: db, PAINEL_SETLIST_CHAVE: chaveVelha }]) {
    const r = await abrir(`?k=${chaveVelha}`, e, certa);
    assert.equal(r.status, 503, "sem usuário e senha configurados ninguém entra");
    assert.match(await r.text(), /falta configurar usuário e senha/);
    assert.match(r.headers.get("Cache-Control"), /no-store/);
  }
  const ok = await abrir("", env, certa), html = await ok.text();
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("X-Robots-Tag"), /noindex/);
  assert.match(ok.headers.get("Cache-Control"), /no-store/);
  assert.match(html, /name="robots" content="noindex/);
  assert.ok(html.includes("1.234") && html.includes("#f0b93a") && html.includes("setInterval(atualizar, 30000)"));
  assert.ok(!html.includes(SEGREDOS.PAINEL_SENHA) && !html.includes("location.search"), "senha e query não vão pra página");
  assert.ok(!/(src|href)="https?:/.test(html), "nada de fora");
  const json = await (await abrir("?json=1", env, certa)).json();
  assert.equal(json.dias[json.hoje].visita, 1234);
  assert.equal((await abrir("", SEGREDOS, certa)).status, 503, "sem o banco ligado");
});
