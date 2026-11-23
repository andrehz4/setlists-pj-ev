// Bug (23/11/2026): o carrossel "Agenda da semana" W48 saiu com um show errado, os dados foram corrigidos e o post foi
// republicado meia hora depois. O script gerou os slides certos, mas o Instagram mostrou as imagens ANTIGAS: as duas
// publicações subiram pro R2 na mesma chave (stories/agenda-semana-2026-W48-01.jpg) e o domínio público guarda cada
// URL por 4 h (cache-control max-age=14400), então o IG baixou a cópia velha. Agora a chave leva o hash do conteúdo.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { publicarViaR2, chaveUnica } from "../publish/midia-r2.mjs";
import { pastaTemp } from "../lib/pasta-temp.mjs";

const ENV = { R2_ACCOUNT_ID: "conta", R2_ACCESS_KEY_ID: "a".repeat(32), R2_SECRET_ACCESS_KEY: "b".repeat(64),
  R2_MIDIA_BUCKET: "smufdpj-midia", R2_MIDIA_PUBLIC_BASE: "https://midia.exemplo.com" };
const CHAVE = "stories/agenda-semana-2026-W48-01.jpg";
const slide = (conteudo) => { const f = path.join(pastaTemp("r2-rep-"), "agenda-semana-2026-W48-01.jpg"); fs.writeFileSync(f, conteudo); return f; };
const fetchImpl = async () => ({ ok: true });
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
