import test from "node:test";
import assert from "node:assert/strict";
import { citaConta, distribuirPosts, postsDasCasas } from "./index.mjs";

test("citaConta acha o @ com ou sem o @, e não confunde conta parecida", () => {
  assert.ok(citaConta("banda do Planeta: loveboat_tribute, e com abertura", "loveboat_tribute"));
  assert.ok(citaConta("com @loveboat_tribute!", "loveboat_tribute"));
  assert.ok(!citaConta("loveboat_tribute_fas", "loveboat_tribute"));
  assert.ok(!citaConta("vikings_pub.df", "vikings_pub"));
});

test("distribuirPosts entrega à banda citada, com a casa dona e sem imagem", () => {
  const casa = { conta: "studiorockcafe", cidade: "Santos", uf: "SP" };
  const lidas = [{ casa, posts: [{ legenda: "Sábado tem loveboat_tribute", imagens: ["x"] }, { legenda: "Sexta tem outra banda" }] }];
  const m = distribuirPosts(lidas, [{ conta: "loveboat_tribute" }, { conta: "pjnoventa" }]);
  assert.deepEqual([...m.keys()], ["loveboat_tribute"]);
  assert.equal(m.get("loveboat_tribute")[0].casaDona, casa);
  assert.deepEqual(m.get("loveboat_tribute")[0].imagens, []);
});

test("AGENDA_CASAS=0 desliga e casa que falha é pulada", async () => {
  assert.equal((await postsDasCasas([], { env: { AGENDA_CASAS: "0" } })).size, 0);
  const ler = async () => { throw new Error("conta pessoal"); };
  assert.equal((await postsDasCasas([{ conta: "loveboat_tribute" }], { env: {}, ler })).size, 0);
});
