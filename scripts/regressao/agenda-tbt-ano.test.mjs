// Bug achado pela prova da data (23/11/2026): o tbt da Blaymorphed de 16/07/2026 ("ensaio feito em 31/10/2020 ...
// estávamos só na metade da batalha") virou show em 31/01/2027 na casa "metade": "31/10/2020" era lido como "31/1".
import test from "node:test";
import assert from "node:assert/strict";
import { showDoAvisoSolto } from "../agenda/extrair-solto.mjs";
import { detalhesDoPostDoDia } from "../agenda/extrair.mjs";

const TBT = "Tbt - MANKIND (Humanidade)\n\n Registro de um ensaio feito em 31/10/2020, durante a tentativa de flexibilização do isolamento social.\n\n Mas infelizmente estávamos só na metade da batalha.";
const banda = { conta: "blaymorphed", nome: "Blaymorphed", uf: "SP" };

test("data com ano no passado não vira show (nem 31/1 nem 31/10)", () => {
  assert.equal(showDoAvisoSolto(TBT, "2026-07-16T16:28:35+0000", banda), null);
  assert.equal(detalhesDoPostDoDia(TBT, "2026-07-16T16:28:35+0000"), null);
});

test("data com o ano certo continua valendo", () => {
  assert.equal(showDoAvisoSolto("Dia 27/11/2026 no santorockbar em Santo André", "2026-11-20T12:00:00+0000", banda).data, "2026-11-27");
  assert.equal(showDoAvisoSolto("Dia 27/11/26 no santorockbar", "2026-11-20T12:00:00+0000", banda).data, "2026-11-27");
});
