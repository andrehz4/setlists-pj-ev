// Bug 23/11/2026: a agenda semanal do @santorockbar (quinta QROCK, sexta Blaymorphed, sábado e domingo outras bandas)
// virou show da Blaymorphed na QUINTA 26/11: o extrator pegava a primeira data da legenda inteira. Saiu no carrossel
// da semana W48. Agora a banda recebe só o bloco do dia que cita ela.
import test from "node:test";
import assert from "node:assert/strict";
import { distribuirPosts, trechoDaBanda } from "../agenda/casas/index.mjs";
import { showDoAvisoSolto } from "../agenda/extrair-solto.mjs";

const LEGENDA = "🔥🤘 AGENDA SEMANAL – SANTO ROCK SANTO ANDRÉ!\n\nQuatro dias de muito rock, grandes tributos e shows imperdíveis! 🎸🍻\n\n🎸 QUINTA | 26/11 – QROCK \n✅ Entrada FREE + Chopp e Caipirinha 50% OFF! \n⏰ Bar 20h | Show 22h\n\n🔥 SEXTA | 27/11 – PEARL JAM COVER \nOs clássicos do grunge com Blaymorphed! \n⏰ Bar 20h | Show 22h\n\n🎤 SÁBADO | 28/11 – SE7E CIDADES + 1 DOSE \nTributos à Legião Urbana, Barão Vermelho e Frejat! \n⏰ Bar 20h | Show 22h\n\n📍 Santo Rock Bar – Santo André \n📲 (11) 94787-0013";
const DATA_POST = "2026-11-23T11:00:01+0000";
const banda = { conta: "blaymorphed", nome: "Blaymorphed", uf: "SP" };

test("prova do bug: a legenda inteira dá quinta 26/11", () => {
  assert.equal(showDoAvisoSolto(LEGENDA, DATA_POST, banda).data, "2026-11-26");
});

test("corrigido: a banda recebe só o bloco dela e o show cai na sexta 27/11, 22h", () => {
  const casa = { conta: "santorockbar", cidade: "Santo André", uf: "SP" };
  const p = distribuirPosts([{ casa, posts: [{ legenda: LEGENDA, data: DATA_POST }] }], [banda]).get("blaymorphed")[0];
  const s = showDoAvisoSolto(p.legenda, p.data, banda);
  assert.equal(s.data, "2026-11-27");
  assert.equal(s.hora, "22:00");
});

test("aviso de um dia só segue com a legenda inteira", () => {
  const t = "Sábado tem loveboat_tribute\n\nshow às 22h";
  assert.equal(trechoDaBanda(t, "loveboat_tribute"), t);
});

test("agenda sem linha em branco entre os dias: na dúvida o post é ignorado, nunca vira show", () => {
  const t = "AGENDA\nQUINTA 26/11 QROCK 22h\nSEXTA 27/11 Blaymorphed 22h\nSÁBADO 28/11 Se7e Cidades";
  assert.equal(trechoDaBanda(t, "blaymorphed"), null);
  const casa = { conta: "santorockbar", cidade: "Santo André", uf: "SP" };
  assert.equal(distribuirPosts([{ casa, posts: [{ legenda: t, data: DATA_POST }] }], [banda]).size, 0);
});

test("trava de dados: show só da casa que conflita com a agenda da banda (mesma casa, 1 dia de diferença) fica segurado", async () => {
  const { separarSuspeitos } = await import("../agenda/suspeitos/index.mjs");
  const daBanda = { id: "b-27", data: "2026-11-27", banda: "blaymorphed", casa: "santorockbar", fonte: "https://ig/p/BANDA/" };
  const daCasa = { id: "b-26", data: "2026-11-26", banda: "blaymorphed", casa: "santorockbar", fonte: "https://ig/p/CASA/" };
  const outraCasa = { id: "b-28", data: "2026-11-28", banda: "blaymorphed", casa: "santorockbarcampinas", fonte: "https://ig/p/CASA/" };
  const r = separarSuspeitos([daBanda, daCasa, outraCasa], new Set(["https://ig/p/CASA/"]), {});
  assert.deepEqual(r.suspeitos.map((s) => s.id), ["b-26"]);
  assert.deepEqual(r.ok.map((s) => s.id), ["b-27", "b-28"]);
  // casa anunciando o MESMO dia da banda não é suspeito; e a trava desliga com AGENDA_SUSPEITOS=0
  assert.equal(separarSuspeitos([daBanda, { ...daCasa, data: "2026-11-27" }], new Set(["https://ig/p/CASA/"]), {}).suspeitos.length, 0);
  assert.equal(separarSuspeitos([daBanda, daCasa], new Set(["https://ig/p/CASA/"]), { AGENDA_SUSPEITOS: "0" }).suspeitos.length, 0);
});
