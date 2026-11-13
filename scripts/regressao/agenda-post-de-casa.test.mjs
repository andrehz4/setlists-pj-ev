// Bug (13/11/2026): o show da Love Boat Tribute no Studio Rock Café (sáb 14/11) não entrou na agenda. Dois motivos:
// 1. era post de COLABORAÇÃO publicado pela casa: a API só lê o feed da própria banda, então o post não vinha;
// 2. a legenda só dizia "Sábado tem" (a data estava na arte) e o extrator só entendia "14/11" ou "14 de novembro".
import test from "node:test";
import assert from "node:assert/strict";
import { montarAgenda } from "../agenda/montar.mjs";
import { distribuirPosts } from "../agenda/casas/index.mjs";

const BANDA = { conta: "loveboat_tribute", nome: "Love Boat Tribute", cidade: "Santos", uf: "SP" };
const CASA = { conta: "studiorockcafe", nome: "Studio Rock Café", cidade: "Santos", uf: "SP" };
const POST = { data: "2026-11-09T08:44:47+0000", link: "https://www.instagram.com/p/Dfg7ox3hl4T/", imagens: [],
  legenda: "Sábado tem espetáculo da melhor banda de Pearl Jam do Planeta: loveboat_tribute, e com abertura do igorbranco79 ! "
    + "Teremos surpresas 🤫, vem pro rock 🤘🏻 ! \n\n🥃 Double Dose Jack Daniels à noite toda✓\n\n🍻 05 Amstel LN no balde por R$ 59,99✓"
    + "\n\n🕰️ Abertura da casa às 22:00 hs✓\n\n💵 Couvert Artístico R$ 25,00✓" };

test("só com o feed da banda, o show não existe (prova do bug 1)", () => {
  assert.deepEqual(montarAgenda(BANDA, [], "2026-11-13"), []);
});

test("post da casa vira show de sábado 14/11 no Studio Rock Café, em Santos", () => {
  const posts = distribuirPosts([{ casa: CASA, posts: [POST] }], [BANDA]).get("loveboat_tribute");
  const [s, ...resto] = montarAgenda(BANDA, posts, "2026-11-13");
  assert.equal(resto.length, 0);
  assert.equal(s.data, "2026-11-14");
  assert.equal(s.casa, "studiorockcafe"); // não o artista da abertura (igorbranco79)
  assert.equal(s.cidade, "Santos");
  assert.equal(s.uf, "SP");
  assert.equal(s.hora, "22:00");
  assert.equal(s.fonte, POST.link);
});

test("post de casa falando no passado não vira show", () => {
  const passado = { ...POST, legenda: "Sábado foi incrível com a loveboat_tribute!" };
  const posts = distribuirPosts([{ casa: CASA, posts: [passado] }], [BANDA]).get("loveboat_tribute");
  assert.deepEqual(montarAgenda(BANDA, posts, "2026-11-09"), []);
});
