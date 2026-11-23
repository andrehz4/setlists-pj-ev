import test from "node:test";
import assert from "node:assert/strict";
import { publicarReelAgenda, tercaDaVez } from "./publicar.mjs";

const SHOWS = [{ data: "2026-12-05", cidade: "Ribeirão Preto", uf: "SP", banda: "pearljamcoverribeirao", nome: "Pearl Jam Cover Ribeirão", casa: "galpao20", hora: "22:00" }];
const fakeRender = async () => ({ arquivo: "/tmp/x.mp4", shows: SHOWS, layout: "B", paleta: "amarelo", duracao: 15.4, aviso: "voz: Jessica" });

test("terça da vez em BRT", () => {
  assert.equal(tercaDaVez("2026-11-24"), "2026-11-24");
  assert.equal(tercaDaVez("2026-11-23"), "2026-11-24");
  assert.equal(tercaDaVez("2026-11-25"), "2026-12-01");
});

test("desligado sem AGENDA_REEL=1", async () => {
  const r = await publicarReelAgenda({ inicio: "2026-12-01", env: {}, deps: { renderizar: () => assert.fail("não devia renderizar") } });
  assert.equal(r.pulou, "desligado");
});

test("semana que já saiu não publica de novo (W48 foi à mão)", async () => {
  const r = await publicarReelAgenda({ inicio: "2026-11-24", env: { AGENDA_REEL: "1" }, deps: { renderizar: () => assert.fail("não devia renderizar") } });
  assert.equal(r.pulou, "já publicado");
});

test("prévia: sobe o vídeo e manda o link no Telegram, sem chamar o IG", async () => {
  const msgs = [];
  const r = await publicarReelAgenda({ inicio: "2026-12-01", modo: "previa", git: false, env: {}, deps: {
    renderizar: fakeRender, publicarViaR2: async (_a, chave) => `https://midia.x/${chave}`,
    enviarTelegram: async (t) => msgs.push(t), publishReelComFallback: () => assert.fail("prévia não publica") } });
  assert.match(r.url, /especiais\/agenda-semana\/2026-W49-previa-\d+\.mp4$/);
  assert.match(msgs[0], /NÃO publicado/);
  assert.match(r.legenda, /@pearljamcoverribeirao/);
});

test("publicar: IG com capa no fim da abertura, FB espelhado, aviso no Telegram", async () => {
  const msgs = [];
  let chamada;
  const r = await publicarReelAgenda({ inicio: "2026-12-01", git: false, env: { AGENDA_REEL: "1" }, deps: {
    renderizar: fakeRender, publicarViaR2: async () => "https://midia.x/v.mp4", enviarTelegram: async (t) => msgs.push(t),
    publishReelComFallback: async (o) => { chamada = o; return { postId: "123" }; }, espelharNoFacebook: async () => "fb9" } });
  assert.equal(r.postId, "123");
  assert.equal(chamada.thumbOffsetMs, 2700);
  assert.equal(chamada.shareToFeed, true);
  assert.match(msgs[0], /no ar/);
});

test("falha no IG avisa no Telegram e propaga", async () => {
  const msgs = [];
  await assert.rejects(publicarReelAgenda({ inicio: "2026-12-01", git: false, env: { AGENDA_REEL: "1" }, deps: {
    renderizar: fakeRender, publicarViaR2: async () => "https://midia.x/v.mp4", enviarTelegram: async (t) => msgs.push(t),
    publishReelComFallback: async () => { throw new Error("rate limit"); } } }), /rate limit/);
  assert.match(msgs[0], /FALHOU/);
});
