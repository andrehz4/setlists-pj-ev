// Curadoria de colaboradores: travas do veredito e regra 0 (arquivos curtos). Roda no `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decidir, resumoTelegram, semTravessao } from "./veredito.mjs";
import { montarPedido } from "./gemini-curador.mjs";

const PASTA = dirname(fileURLToPath(import.meta.url));
const OK = { musica: { status: "ok" }, tema: { status: "ok" }, respeito: { status: "ok" } };
const foto = { id: "1", title: "Minha fita de 2005", body: "Achei a fita do show no fundo da gaveta.", media: [{ key: "a.jpg" }], autor: { nome: "Marina" } };
const video = {
  ...foto, media: [{ key: "a.mp4" }],
  video: { estilo: "palavra", trim_start: 0, trim_end: 20, legendas: [{ start: 0, end: 2, text: "em 1991 saiu o ten" }, { start: 2, end: 4, text: "mookie blaylock" }] },
};
const ia = (extra = {}) => ({ regras: OK, fatos: [], decisao: "aprovado", titulo: foto.title, texto: foto.body, resumo: "ok", ...extra });

test("regra 0: todo arquivo da curadoria tem no máximo 160 linhas", () => {
  for (const f of readdirSync(PASTA).filter((n) => n.endsWith(".mjs"))) {
    const linhas = readFileSync(join(PASTA, f), "utf8").split("\n").length;
    assert.ok(linhas <= 160, `${f} tem ${linhas} linhas`);
  }
});

test("sem mudança nenhuma = aprovado, sem motivo", () => {
  const v = decidir(foto, ia());
  assert.equal(v.decisao, "aprovado");
  assert.equal(v.motivo, null);
});

test("IA corrigiu o texto = ajustado, com o motivo pra pessoa", () => {
  const v = decidir(foto, ia({ texto: "Achei a fita do show no fundo da gaveta, em 2005.", motivo: "Incluímos o ano." }));
  assert.equal(v.decisao, "ajustado");
  assert.equal(v.motivo, "Incluímos o ano.");
});

test("regra violada recusa mesmo se a IA disser aprovado", () => {
  const v = decidir(video, ia({ regras: { ...OK, musica: { status: "violada" } } }));
  assert.equal(v.decisao, "recusado");
  assert.match(v.motivo, /regra de ouro 1/);
});

test("regra incerta também recusa (na dúvida, recusa)", () => {
  const v = decidir(video, ia({ regras: { ...OK, musica: { status: "incerto" } } }));
  assert.equal(v.decisao, "recusado");
  assert.match(v.motivo, /certeza/);
});

test("regra sem resposta da IA conta como não ok", () => {
  assert.equal(decidir(foto, ia({ regras: { musica: { status: "ok" } } })).decisao, "recusado");
});

test("travessão some do título, do texto e do motivo", () => {
  assert.equal(semTravessao("O Ten — de 1991 — mudou tudo"), "O Ten, de 1991, mudou tudo");
  assert.equal(semTravessao("Fim da frase —."), "Fim da frase.");
  const v = decidir(foto, ia({ titulo: "Minha fita — de 2005", motivo: "Tiramos o travessão — só isso." }));
  assert.equal(v.titulo, "Minha fita, de 2005");
  assert.ok(!/[—–]/.test(v.motivo));
});

test("legenda corrigida mantém os tempos e a quantidade de linhas", () => {
  const v = decidir(video, ia({ legendas: ["Em 1991 saiu o Ten", "Mookie Blaylock"] }));
  assert.equal(v.decisao, "ajustado");
  assert.deepEqual(v.legendas, [{ start: 0, end: 2, text: "Em 1991 saiu o Ten" }, { start: 2, end: 4, text: "Mookie Blaylock" }]);
});

test("legenda com número de linhas diferente é ignorada (fica a da pessoa)", () => {
  const v = decidir(video, ia({ legendas: ["tudo junto numa linha só"] }));
  assert.equal(v.decisao, "aprovado");
  assert.equal(v.legendas[0].text, "em 1991 saiu o ten");
});

test("texto curto ou vazio da IA cai no original", () => {
  const v = decidir(foto, ia({ titulo: "", texto: "curto" }));
  assert.equal(v.titulo, foto.title);
  assert.equal(v.texto, foto.body);
});

test("pedido pro Gemini numera as linhas da legenda", () => {
  assert.match(montarPedido(video), /1\. em 1991 saiu o ten\n2\. mookie blaylock/);
  assert.match(montarPedido(foto), /regra 1 \(música\) fica ok/);
});

test("resumo do Telegram diz o horário ou que não vai ao ar", () => {
  assert.match(resumoTelegram(foto, decidir(foto, ia()), "15h30"), /vai ao ar às 15h30/);
  const recusa = decidir(video, ia({ regras: { ...OK, tema: { status: "violada" } } }));
  assert.match(resumoTelegram(video, recusa, "15h30"), /não vai ao ar/);
});
