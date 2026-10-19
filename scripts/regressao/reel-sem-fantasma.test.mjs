// Bug 18/10/2026: no reel, notícia sem foto própria (Lightning Bolt, Jeff Ament na pista de skate) saía com fundo
// escuro escrito "CLIPE" e o selo "CLIPE · MUDO", sem clipe nenhum. Parecia erro pra quem assistia.
// Causa: hasImg false pulava direto pro fundo fantasma, sem tentar a foto reserva do integrante/banda.
import test from "node:test";
import assert from "node:assert/strict";
import { fotoDaCena } from "../publish/reel/foto-cena.mjs";
import { kineticSvg } from "../publish/reel/cenas-blocos.mjs";

const semFoto = { id: "regressao-sem-foto", title_pt: "Jeff Ament abre a sexta pista de skate na reserva Flathead, em Montana",
  tags: ["jeff"], hasImg: false, img: null, imgRemote: null };
const cena = { kind: "kinetic", item: semFoto };

test("regra antiga: notícia sem foto própria ficava sem foto (prova do bug)", async () => {
  const regraAntiga = (scene, buscar) => (scene.item.hasImg !== false ? buscar(scene.item) : null);
  assert.equal(await regraAntiga(cena, () => Buffer.from("x")), null);
});

test("notícia sem foto própria ganha a foto reserva (integrante/banda)", async () => {
  const buf = await fotoDaCena(cena, [semFoto]);
  assert.ok(Buffer.isBuffer(buf) && buf.length > 1000);
});

test("fundo de último caso não escreve CLIPE", () => {
  const svg = kineticSvg(1, { item: semFoto, n: 1, total: 8, accent: "#E10600", ghost: true, showChip: false });
  assert.doesNotMatch(svg, />CLIPE</);
  assert.doesNotMatch(svg, /CLIPE · MUDO/);
});
