// Formatos das bandas que entraram em 06/10: legendas reais (trechos) da PJ 90, Ribeirão, Lost Dogs e The Homer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { linhaParaShows } from "./extrair.mjs";
import { showsEmBlocos, tituloCidade } from "./extrair-blocos.mjs";
import { showDoAvisoSolto } from "./extrair-solto.mjs";
import { montarAgenda } from "./montar.mjs";

const PJ90 = "🔥AGENDA 2026🔥\n\nOUTUBRO ☑️\n\n02. SEXTA (Trio Acústico)\n📍 SÃO PAULO-SP\n🏠 casadamatrona \n🕰️ INÍCIO 20h \n\n"
  + "10. SÁBADO \n☑️ EVENTO FECHADO\n🕰️ 13h\n\n10. SÁBADO \n📍 BRAGANÇA PTA-SP\n🏠 brasilbeerfest \n🕰️ INÍCIO 23h \n\n"
  + "NOVEMBRO\n\n06. SEXTA\n📍 JUNDIAI-SP\n🏠 jumpbarbecue\n🕰️ INÍCIO 21h";

test("PJ 90: agenda em blocos com mês, observação, evento fechado e vários shows no dia", () => {
  const s = showsEmBlocos(PJ90, "2026-09-27T18:48:52+0000");
  assert.equal(s.length, 4);
  assert.deepEqual([s[0].data, s[0].casa, s[0].cidade, s[0].uf, s[0].hora, s[0].observacao],
    ["2026-10-02", "casadamatrona", "São Paulo", "SP", "20:00", "Trio Acústico"]);
  assert.equal(s[1].fechado, true);
  assert.deepEqual([s[2].cidade, s[2].casa], ["Bragança Pta", "brasilbeerfest"]);
  assert.equal(s[3].data, "2026-11-06");
});

test("PJ 90: anúncio de um show só não apaga os outros do mesmo dia", () => {
  const unico = "🔥SANTO ANDRÉ-SP🔥\n\n10. SÁBADO \n🏠 beersfestival \n📍 SANTO ANDRÉ-SP (Paço Municipal) \n🕰️ INÍCIO 17h30";
  const a = montarAgenda({ conta: "pjnoventa", nome: "PJ 90", uf: "SP" }, [
    { data: "2026-09-27T18:48:52+0000", link: "agenda", legenda: PJ90 },
    { data: "2026-10-05T02:06:38+0000", link: "unico", legenda: unico },
  ], "2026-10-06");
  const dia10 = a.filter((s) => s.data === "2026-10-10");
  assert.equal(dia10.length, 3);
  assert.ok(dia10.some((s) => s.casa === "beersfestival" && s.casaNome === "Paço Municipal" && s.hora === "17:30"));
});

test("Ribeirão: linha com • e —, casa depois do travessão", () => {
  assert.deepEqual(linhaParaShows("08/10 • Araxá/MG — oktobeeraraxa", 10, 2026).map((s) => [s.data, s.cidade, s.uf, s.casa]),
    [["2026-10-08", "Araxá", "MG", "oktobeeraraxa"]]);
});

test("Lost Dogs: aviso solto com Alô cidade, casa e horário", () => {
  const leg = "ALÔ SUZANO E REGIÃO \nNeste sábado dia 10/10 estaremos fazendo nossa ESTRÉIA no botecohelena em Suzano.\n"
    + "O show começa às 22h onde estaremos tocando os maiores sucessos do PEARL JAM";
  const s = showDoAvisoSolto(leg, "2026-10-05T12:00:00+0000", { conta: "pearljamsp", uf: "SP" });
  assert.deepEqual([s.data, s.casa, s.cidade, s.uf, s.hora], ["2026-10-10", "botecohelena", "Suzano", "SP", "22:00"]);
});

test("The Homer: casa certa (não 'cidade'), relato de show passado não vira show", () => {
  const leg = "Alô Lagoa da prata, pela primeira vez a thehomerpj  chega na cidade para levar o melhor do Pearl jam  no festivaldopeixemg  esperamos vocês lá para uma noite insana só vem!!\n\nÉ nesse sábado dia 05/09 às 22hs";
  const s = showDoAvisoSolto(leg, "2026-09-02T12:00:00+0000", { conta: "thehomerpj", uf: "MG" });
  assert.deepEqual([s.casa, s.cidade, s.hora], ["festivaldopeixemg", "Lagoa da Prata", "22:00"]);
  const relato = "Não poderia ficar de fora do Projeto que aconteceu no dia 18/09/26 no teatrobor .Ficou linda";
  assert.equal(showDoAvisoSolto(relato, "2026-09-24T12:00:00+0000", { conta: "pearljamsp", uf: "SP" }), null);
});

test("cidade em maiúsculas vira nome próprio", () => {
  assert.equal(tituloCidade("SÃO JOSÉ DOS CAMPOS"), "São José dos Campos");
});
