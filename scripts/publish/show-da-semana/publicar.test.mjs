import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { RAIZ } from "../../config.mjs";
import { quandoUtc, montarFila, proximoDaVez, checarPost } from "./fila.mjs";
import { publicarShowDaSemana } from "./publicar.mjs";
import { chaveDoSlide } from "./subir.mjs";

const fichaReal = (id) => JSON.parse(fs.readFileSync(path.join(RAIZ, "media/show-da-semana/fichas", `${id}.json`), "utf8"));
const URLS = [1, 2, 3, 4].map((i) => `https://midia.exemplo.com/especiais/show-da-semana/11/0${i}-abc.jpg`);
const AGENDA = { posts: [
  { n: 10, quando: "2026-12-22 17:00", id: "pj-2016-05-10" },
  { n: 11, quando: "2026-12-26 11:00", id: "pj-2015-11-17" },
  { n: 12, quando: "2026-12-29 17:00", id: "pj-2018-08-08" },
] };

test("quandoUtc: BRT vira UTC (+3 h)", () => {
  assert.equal(quandoUtc("2026-12-26 11:00"), "2026-12-26T14:00:00.000Z");
  assert.throws(() => quandoUtc("26/12 11h"));
});

test("montarFila: #1 a #10 marcados business-suite, postado nunca é reescrito", () => {
  const f1 = montarFila(AGENDA);
  assert.equal(f1.posts[0].canal, "business-suite");
  assert.equal(f1.posts[1].canal, "api");
  f1.posts[1].postedAt = "2026-12-26T14:01:00Z"; f1.posts[1].igId = "ig1"; f1.posts[2].urls = URLS;
  const remarcada = { posts: AGENDA.posts.map((p) => ({ ...p, quando: "2027-01-01 10:00" })) };
  const f2 = montarFila(remarcada, f1);
  assert.equal(f2.posts[1].igId, "ig1");
  assert.equal(f2.posts[2].quando, "2027-01-01T13:00:00.000Z");
  assert.deepEqual(f2.posts[2].urls, URLS, "remarcar data mantém os slides");
  const trocado = { posts: [...AGENDA.posts.slice(0, 2), { n: 12, quando: "2026-12-29 17:00", id: "pj-2018-08-13" }] };
  assert.deepEqual(montarFila(trocado, f1).posts[2].urls, [], "trocar o show zera os slides");
});

test("proximoDaVez: pula business-suite, não repete postado, respeita a hora", () => {
  const f = montarFila(AGENDA);
  assert.equal(proximoDaVez(f, new Date("2026-12-26T13:59:00Z")), null);
  assert.equal(proximoDaVez(f, new Date("2026-12-26T14:00:00Z")).n, 11);
  f.posts[1].postedAt = "x";
  assert.equal(proximoDaVez(f, new Date("2026-12-27T00:00:00Z")), null);
  assert.equal(proximoDaVez(f, new Date("2026-12-27T00:00:00Z"), { force: true }).n, 12);
  assert.equal(proximoDaVez(f, new Date("2027-06-01T00:00:00Z")).n, 12, "atrasado sai na próxima run");
});

test("checarPost: ficha real do #11 passa; 5 hashtags, não aprovada e sem slides barram", () => {
  const post = { n: 11, id: "pj-2015-11-17", urls: URLS };
  const f = fichaReal(post.id);
  assert.deepEqual(checarPost(post, f), []);
  assert.match(checarPost(post, { ...f, legenda: f.legenda + " #grunge" }).join(), /5 hashtags/);
  assert.match(checarPost(post, { ...f, status: "rascunho" }).join(), /aprovado/);
  assert.match(checarPost({ ...post, urls: [] }, f).join(), /subir\.mjs/);
  assert.match(checarPost({ ...post, n: 12 }, f).join(), /#12/);
  assert.match(checarPost(post, null).join(), /não encontrada/);
});

test("todas as fichas da API (#11 em diante) passam na checagem de legenda", () => {
  const agenda = JSON.parse(fs.readFileSync(path.join(RAIZ, "media/show-da-semana/agenda.json"), "utf8"));
  for (const p of montarFila(agenda).posts.filter((x) => x.canal === "api")) {
    assert.deepEqual(checarPost({ ...p, urls: URLS }, fichaReal(p.id)), [], `#${p.n} ${p.id}`);
  }
});

test("chaveDoSlide: pasta especiais/ (não expira) e hash muda com o conteúdo", () => {
  const a = chaveDoSlide(11, 0, Buffer.from("a"));
  assert.match(a, /^especiais\/show-da-semana\/11\/01-[0-9a-f]{12}\.jpg$/);
  assert.notEqual(a, chaveDoSlide(11, 0, Buffer.from("b")));
});

// ---------- publicar (com deps falsas, sem rede) ----------
function cenario(filaExtra = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "sds-"));
  const fila = montarFila(AGENDA);
  Object.assign(fila.posts[1], { urls: URLS, ...filaExtra });
  fs.mkdirSync(path.join(raiz, "media/show-da-semana"), { recursive: true });
  fs.writeFileSync(path.join(raiz, "media/show-da-semana/_fila.json"), JSON.stringify(fila));
  const log = { ig: 0, git: [], tg: [] };
  const deps = {
    lerFicha: (_r, id) => fichaReal(id),
    publicarCarrossel: async () => { log.ig++; return { postId: "ig123", fbPostId: "fb456" }; },
    commitAndPush: async (_p, msg) => { log.git.push(msg); },
    enviarTelegram: async (m) => { log.tg.push(m); },
    getRecentMedia: async () => [],
  };
  const ler = () => JSON.parse(fs.readFileSync(path.join(raiz, "media/show-da-semana/_fila.json"), "utf8"));
  return { raiz, deps, log, ler };
}
const AGORA = new Date("2026-12-26T14:07:00Z");
const ENV = { SHOW_DA_SEMANA: "1" };

test("publicar: desligado sem a flag", async () => {
  const c = cenario();
  const r = await publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: {}, deps: c.deps });
  assert.equal(r.pulou, "desligado");
  assert.equal(c.log.ig, 0);
});

test("publicar: posta 1 vez, grava tentativa antes e marca postado; 2a run não repete", async () => {
  const c = cenario();
  await publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: ENV, deps: c.deps });
  assert.equal(c.log.ig, 1);
  assert.match(c.log.git[0], /tentativa do #11/);
  const p = c.ler().posts[1];
  assert.equal(p.igId, "ig123"); assert.equal(p.fbId, "fb456"); assert.ok(p.postedAt);
  const r2 = await publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: ENV, deps: c.deps });
  assert.equal(r2.pulou, "nada maduro");
  assert.equal(c.log.ig, 1);
});

test("publicar: run anterior caiu depois do IG aceitar, acha pela legenda e não posta de novo", async () => {
  const c = cenario({ tentativaEm: "2026-12-26T14:07:00Z" });
  const leg = fichaReal("pj-2015-11-17").legenda;
  c.deps.getRecentMedia = async () => [{ id: "igVelho", caption: leg, timestamp: "2026-12-26T14:08:00Z" }];
  await publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: ENV, deps: c.deps });
  assert.equal(c.log.ig, 0);
  assert.equal(c.ler().posts[1].igId, "igVelho");
});

test("publicar: falha grava erro, avisa no Telegram e deixa pendente", async () => {
  const c = cenario();
  c.deps.publicarCarrossel = async () => { throw new Error("rate limit"); };
  await assert.rejects(publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: ENV, deps: c.deps }), /rate limit/);
  const p = c.ler().posts[1];
  assert.equal(p.postedAt, null); assert.equal(p.erro, "rate limit");
  assert.match(c.log.tg.at(-1), /FALHOU/);
});

test("publicar: ficha barrada não chama o IG", async () => {
  const c = cenario();
  c.deps.lerFicha = (_r, id) => ({ ...fichaReal(id), status: "rascunho" });
  await assert.rejects(publicarShowDaSemana({ raiz: c.raiz, agora: AGORA, env: ENV, deps: c.deps }), /barrado/);
  assert.equal(c.log.ig, 0);
  assert.match(c.log.tg[0], /não saiu/);
});
