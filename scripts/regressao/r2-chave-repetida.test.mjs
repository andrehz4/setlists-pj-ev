// Bug (23/11/2026): o carrossel "Agenda da semana" W48 saiu com um show errado, os dados foram corrigidos e o post foi
// republicado meia hora depois. O script gerou os slides certos, mas o Instagram mostrou as imagens ANTIGAS: as duas
// publicações subiram pro R2 na mesma chave (stories/agenda-semana-2026-W48-01.jpg) e o domínio público guarda cada
// URL por 4 h (cache-control max-age=14400), então o IG baixou a cópia velha. Agora a chave leva o hash do conteúdo
// e, como segunda trava, o link público é baixado e comparado com o arquivo local antes de ir pro IG/FB.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { publicarViaR2, chaveUnica, conferirPublico } from "../publish/midia-r2.mjs";
import { pastaTemp } from "../lib/pasta-temp.mjs";

const ENV = { R2_ACCOUNT_ID: "conta", R2_ACCESS_KEY_ID: "a".repeat(32), R2_SECRET_ACCESS_KEY: "b".repeat(64),
  R2_MIDIA_BUCKET: "smufdpj-midia", R2_MIDIA_PUBLIC_BASE: "https://midia.exemplo.com" };
const CHAVE = "stories/agenda-semana-2026-W48-01.jpg";
const slide = (conteudo) => { const f = path.join(pastaTemp("r2-rep-"), "agenda-semana-2026-W48-01.jpg"); fs.writeFileSync(f, conteudo); return f; };
// R2 falso: guarda o que recebeu no PUT e devolve no GET, como o domínio público sem cache.
const guardado = new Map();
const fetchImpl = async (url, o) => {
  const chave = url.split("/").slice(-1)[0];
  if (o.method === "PUT") guardado.set(chave, o.body);
  return { ok: true, arrayBuffer: async () => guardado.get(chave) };
};
const publicar = (conteudo, chave = CHAVE) => publicarViaR2(slide(conteudo), chave, { env: ENV, fetchImpl });

test("regra antiga (chave fixa): as duas publicações da semana caíam na mesma URL (prova do bug)", () => {
  const antiga = (chave) => `${ENV.R2_MIDIA_PUBLIC_BASE}/${chave}`;
  assert.equal(antiga(CHAVE), antiga(CHAVE));
});

test("republicar a mesma semana com a arte corrigida gera URL diferente", async () => {
  const errada = await publicar("capa com a Blaymorphed na quinta");
  const certa = await publicar("capa sem a quinta, 9 shows");
  assert.notEqual(errada, certa);
  for (const u of [errada, certa]) assert.match(u, /^https:\/\/midia\.exemplo\.com\/stories\/agenda-semana-2026-W48-01-[0-9a-f]{12}\.jpg$/);
});

test("mesmo conteúdo dá a mesma URL (determinístico) e a extensão fica no fim", async () => {
  assert.equal(await publicar("igual"), await publicar("igual"));
  assert.match(chaveUnica("especiais/agenda-semana/2026-W48.mp4", Buffer.from("v")), /^especiais\/agenda-semana\/2026-W48-[0-9a-f]{12}\.mp4$/);
  assert.match(chaveUnica("sem-extensao", Buffer.from("v")), /^sem-extensao-[0-9a-f]{12}$/);
});

test("os outros publicadores de chave fixa (story do dia, story por banda, reel da agenda) também mudam de URL", async () => {
  for (const chave of ["stories/agenda-2026-11-23-SP.jpg", "stories/agenda-2026-11-23-pjnoventa.mp4", "especiais/agenda-semana/2026-W48.mp4"]) {
    assert.notEqual(await publicar("versão 1", chave), await publicar("versão 2", chave));
  }
});

// Segunda trava: cache entregando a arte velha no link público.
const comCache = (velho, viraNovoNa = Infinity) => {
  let enviado, gets = 0;
  const f = async (_u, o) => {
    if (o.method === "PUT") { enviado = o.body; return { ok: true }; }
    if (o.method === "HEAD") return { ok: true };
    gets++;
    return { ok: true, arrayBuffer: async () => (gets >= viraNovoNa ? enviado : Buffer.from(velho)) };
  };
  return { f, gets: () => gets };
};

test("regra antiga (só HEAD no link): cache com a arte velha passava e a publicação seguia (prova do bug)", async () => {
  const { f } = comCache("arte velha");
  const head = await f("https://midia.exemplo.com/x.jpg", { method: "HEAD" });
  assert.equal(head.ok, true);
  assert.equal(await conferirPublico("https://midia.exemplo.com/x.jpg", Buffer.from("arte nova"), { fetchImpl: f, tentativas: 1 }), false);
});

test("link público com mídia diferente da gerada: tenta de novo e FALHA a publicação (não cai pro GitHub)", async () => {
  const { f, gets } = comCache("arte velha");
  await assert.rejects(publicarViaR2(slide("arte nova"), CHAVE, { env: ENV, fetchImpl: f, tentativas: 3, esperaMs: 1 }),
    (e) => e.midiaDiferente === true && /diferente da gerada/.test(e.message));
  assert.equal(gets(), 3);
});

test("cache que se corrige na segunda tentativa: publica com a URL conferida", async () => {
  const { f, gets } = comCache("arte velha", 2);
  const url = await publicarViaR2(slide("arte nova"), CHAVE, { env: ENV, fetchImpl: f, tentativas: 3, esperaMs: 1 });
  assert.match(url, /agenda-semana-2026-W48-01-[0-9a-f]{12}\.jpg$/);
  assert.equal(gets(), 2);
});
