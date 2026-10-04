// Extrator da agenda com legendas REAIS lidas pela POC (Blaymorphed e Black Circle, out/2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { showsDoPostDeAgenda, detalhesDoPostDoDia, mesDoCabecalho } from "./extrair.mjs";

const BLAY_OUT = `🔥 Agenda de OUTUBRO 🔥

Sex 02 e Sáb 03 - bluesbarms - Campo Grande - MS
Seg 05 (SV Solo) - comics_smashburger - Mauá - SP
Sex 09 - barrockclub_ - São Bernardo - SP
Sáb 10 - acervodotuzzibar - Bragança Pta. - SP
Dom 11 - stones_bar - São Paulo - SP
Sex 16 e Sáb 17 - sergiovedder - Evento Fechado
Sex 23 - brothers_rock_bar - Ribeirão Pires - SP
Sáb 24 - santorockbar - Santo André - SP
Sáb 31 - buxixorockbar - Mogi das Cruzes- SP

VEM COM A BLAY !!!

#Blay26 #Blaymorphed #PearlJamCoverBrasil #PearlJam #PearlJamCover`;

const BC_OUT = `OUTUBRO COMEÇOU E VAI TER BLACK CIRCLE PRA TODO LADO!

BC + você com 9 encontros marcados de tributo ao Pearl Jam, músicas autorais e algumas surpresas também.

🎻 02/10 // Florianópolis/SC
🎻 03/10 // Itajaí/SC
📍 10/10 // Rio de Janeiro/RJ
📍 11/10 // Volta Redonda/RJ
📍 15/10 // Rio de Janeiro/RJ
📍 16/10 // Niterói/RJ
📍 23/10 // Osasco/SP
📍 24/10 // São Bernardo do Campo/SP
📍 30/10 // Rio de Janeiro/RJ

🎟️ Informações e ingressos no link da bio.`;

test("mês do cabeçalho", () => {
  assert.equal(mesDoCabecalho(BLAY_OUT), 10);
  assert.equal(mesDoCabecalho(BC_OUT), 10);
  assert.equal(mesDoCabecalho("Agenda de JUNHO !!! 🚀"), 6);
});

test("Blaymorphed: agenda do mês vira 11 shows com casa, cidade e UF", () => {
  const s = showsDoPostDeAgenda(BLAY_OUT, "2026-09-30T20:00:00+0000");
  assert.equal(s.length, 11);
  assert.deepEqual(s.slice(0, 2).map((x) => x.data), ["2026-10-02", "2026-10-03"]);
  assert.deepEqual(s[0], { data: "2026-10-02", casa: "bluesbarms", casaNome: null, cidade: "Campo Grande", uf: "MS", fechado: false, observacao: null });
  assert.equal(s[2].observacao, "SV Solo");
  assert.equal(s[3].casa, "barrockclub_");
  assert.equal(s[4].cidade, "Bragança Pta");
  assert.equal(s[5].casa, "stones_bar");
  const fechado = s.filter((x) => x.fechado);
  assert.equal(fechado.length, 2);
  assert.equal(s.at(-1).cidade, "Mogi das Cruzes");
  assert.equal(s.at(-1).uf, "SP");
});

test("Black Circle: agenda do mês vira 9 shows com cidade/UF (casa vem depois)", () => {
  const s = showsDoPostDeAgenda(BC_OUT, "2026-10-01T15:00:00+0000");
  assert.equal(s.length, 9);
  assert.deepEqual(s[0], { data: "2026-10-02", casa: null, casaNome: null, cidade: "Florianópolis", uf: "SC", fechado: false, observacao: null });
  assert.equal(s.at(-1).data, "2026-10-30");
});

test("formatos antigos da Blay: sem traço depois do dia, sem cidade, semana com dd/mm", () => {
  const a = showsDoPostDeAgenda("⬇️ Agenda de AGOSTO ⬇️\n\nSáb 01 oldkick.kustombar - Sorocaba - SP\nQui 06 stones_bar - São Paulo - SP", "2026-07-30T12:00:00+0000");
  assert.deepEqual(a.map((x) => [x.data, x.casa, x.cidade]), [["2026-08-01", "oldkick.kustombar", "Sorocaba"], ["2026-08-06", "stones_bar", "São Paulo"]]);
  const b = showsDoPostDeAgenda("Agenda de JUNHO !!!\n\nQua 03 - misterrockinsampa\nQui 04 - stones_bar", "2026-06-01T12:00:00+0000");
  assert.deepEqual(b.map((x) => [x.data, x.casa, x.cidade]), [["2026-06-03", "misterrockinsampa", null], ["2026-06-04", "stones_bar", null]]);
  const c = showsDoPostDeAgenda("AGENDA DA SEMANA:\n\nQuinta 18/06 = thelordblackpub - Guarulhos - SP\nSexta 19/06 = santorockbar - Santo André - SP", "2026-06-16T12:00:00+0000");
  assert.deepEqual(c.map((x) => [x.data, x.casa, x.cidade, x.uf]), [["2026-06-18", "thelordblackpub", "Guarulhos", "SP"], ["2026-06-19", "santorockbar", "Santo André", "SP"]]);
});

test("post que não é agenda devolve null", () => {
  assert.equal(showsDoPostDeAgenda("Nossa estreia no palco do mágico thecavernclubsp na quinta passada (17/09/2026).", "2026-09-21T12:00:00+0000"), null);
});

test("agenda de janeiro postada em dezembro cai no ano seguinte", () => {
  const s = showsDoPostDeAgenda("Agenda de JANEIRO\n\nSex 08 - stones_bar - São Paulo - SP\nSáb 09 - torkandroll - Curitiba - PR", "2026-12-29T12:00:00+0000");
  assert.equal(s[0].data, "2027-01-08");
});

test("post do dia: data, casa e horário", () => {
  const d = detalhesDoPostDoDia("AMANHÃ TEM SHOW E COM CASA CHEIA!\n\n📍 08/08, sábado\n📍 rocknbeerpub  São Gonçalo/RJ\n🕙 22h showtime", "2026-08-07T12:00:00+0000", ["blackcirclepj"]);
  assert.equal(d.data, "2026-08-08");
  assert.equal(d.hora, "22:00");
  const e = detalhesDoPostDoDia("🇧🇷 BRASIL X HAITI ⚽️\n\nSEXTA 19/06 nosso show acontece lá no santorockbar em Santo André\n\n🎶 Showtime: 23:30", "2026-06-17T12:00:00+0000", ["blaymorphed"]);
  assert.equal(e.data, "2026-06-19");
  assert.equal(e.hora, "23:30");
  const f = detalhesDoPostDoDia("Quintou no STONES !!!\n\nHOJE 10/09, tem o nosso já tradicional encontrão jammer do mês, lá no stones_bar .", "2026-09-10T12:00:00+0000", ["blaymorphed"]);
  assert.equal(f.casa, "stones_bar");
});

test("casa sem @ (a API tira o @ das menções)", async () => {
  const { casaNaLegenda } = await import("./extrair.mjs");
  assert.equal(casaNaLegenda("📍 08/08, sábado\n📍 rocknbeerpub  São Gonçalo/RJ\n🕙 22h showtime", ["blackcirclepj"]), "rocknbeerpub");
  assert.equal(casaNaLegenda("Sexta agora, dia 18/09 estaremos no santorockbar com mais uma noite", ["blaymorphed"]), "santorockbar");
  assert.equal(casaNaLegenda("📍 19/09 // retrobar1141 - Olaria/RJ"), "retrobar1141");
  assert.equal(casaNaLegenda("Sábado no torkandroll Curitiba !!!\n\n📸 liverockphoto\n\n#BLAY26 #blaymorphed", ["blaymorphed"]), "torkandroll");
  assert.equal(casaNaLegenda("Obrigado a todos que vieram!", []), null);
});

test("ano escrito na data e nome do teatro sem @", () => {
  const s = showsDoPostDeAgenda("Próximos encontros:\n\n🎻 02/11/26 - Rio de Janeiro/RJ\n🎻 26/02/27 - São Paulo/SP", "2026-09-24T12:00:00+0000");
  assert.deepEqual(s.map((x) => x.data), ["2026-11-02", "2027-02-26"]);
  const t = showsDoPostDeAgenda("NOVAS DATAS\n\n📍 02/10 - Teatro Ademir Rosa - Florianópolis/SC\n📍 02/11 - Teatro Multiplan - Rio de Janeiro/RJ", "2026-08-20T12:00:00+0000");
  assert.deepEqual(t.map((x) => [x.casaNome, x.cidade, x.uf]), [["Teatro Ademir Rosa", "Florianópolis", "SC"], ["Teatro Multiplan", "Rio de Janeiro", "RJ"]]);
});

test("horário: showtime, emoji de relógio/calendário, ignora VIP e abertura", async () => {
  const { horaNaLegenda } = await import("./extrair.mjs");
  assert.equal(horaNaLegenda("📅 02/11, feriado - 20h\n📍 Teatro Multiplan"), "20:00");
  assert.equal(horaNaLegenda("🎶 Showtime: 23:30"), "23:30");
  assert.equal(horaNaLegenda("🕙 22h showtime"), "22:00");
  assert.equal(horaNaLegenda("‼️ Entrada VIP até as 22h\nAbertura da casa: 19h"), null);
});
