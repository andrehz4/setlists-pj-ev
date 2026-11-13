// Agenda na arte: quais posts vão pro curador, fila de imagens, leitura dele e encaixe no montar.mjs (só completa).
// Legenda real do Lost Dogs de 03/11/2026 (a agenda de novembro estava só na imagem).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { precisaArte, showsDaArte } from "./quais.mjs";
import { aplicarLeituras, enfileirarArtes, limparFila } from "./index.mjs";
import { montarAgenda } from "../montar.mjs";

const posts = JSON.parse(fs.readFileSync(new URL("../../regressao/fixtures/lost-dogs-2026-11.json", import.meta.url), "utf8"));
const MES_ESPECIAL = posts.find((p) => p.legenda.startsWith("MÊS ESPECIAL"));
const BANDA = { conta: "pearljamsp", nome: "Lost Dogs", uf: "SP" };
const comImagem = (p) => ({ ...p, imagens: ["https://cdn.exemplo/a.jpg", "https://cdn.exemplo/b.jpg"] });
const LEITURA = { lidoEm: "2026-11-08T15:00:00Z", shows: [
  { dia: 13, mes: 11, hora: "20h", casa: "blues_beer", observacao: "Into The Wild" },
  { dia: 14, mes: 11, hora: "22h30", casa: "Mister Rock", cidade: "São Paulo", uf: "SP" },
  { dia: 19, mes: 11, hora: "21h", casa: "Mister Rock" },
] };
const fetchOk = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
const reduzirImpl = async (b) => b;

test("vai pro curador: post de agenda com imagem dos últimos 21 dias", () => {
  assert.equal(precisaArte(comImagem(MES_ESPECIAL), "2026-11-09"), true);
  assert.equal(precisaArte(MES_ESPECIAL, "2026-11-09"), false); // sem imagem
  assert.equal(precisaArte(comImagem(MES_ESPECIAL), "2026-12-20"), false); // velho
  assert.equal(precisaArte(comImagem({ data: "2026-11-08", legenda: "Nesta sexta dia 13/11 no blues_beer" }), "2026-11-09"), false);
});

test("leitura do curador vira show: hora, @ da casa, nome da casa e ano", () => {
  const s = showsDaArte(LEITURA, "2026-11-03T16:42:22+0000");
  assert.deepEqual(s.map((x) => [x.data, x.hora, x.casa, x.casaNome]), [
    ["2026-11-13", "20:00", "blues_beer", null], ["2026-11-14", "22:30", null, "Mister Rock"], ["2026-11-19", "21:00", null, "Mister Rock"],
  ]);
  assert.equal(showsDaArte({ shows: [{ dia: 5, mes: 1 }] }, "2026-12-10T12:00:00Z")[0].data, "2027-01-05");
  assert.deepEqual(showsDaArte({ shows: [{ dia: 40, mes: 13 }] }, "2026-11-03T00:00:00Z"), []);
  // comentário do curador não vira etiqueta pública (leitura real de 09/11/2026)
  const notas = showsDaArte({ shows: [{ dia: 7, mes: 11, observacao: "Patriarca; arte diz 01PM" },
    { dia: 19, mes: 11, observacao: "show especial Esquenta Eddie Vedder, Into The Wild + Lost Dogs" },
    { dia: 27, mes: 11, observacao: "datas na legenda" }, { dia: 26, mes: 11, observacao: "Eddie Vedder solo" }] }, "2026-11-03T00:00:00Z");
  assert.deepEqual(notas.map((x) => x.observacao), [null, null, null, "Eddie Vedder solo"]);
});

test("fila: baixa a arte uma vez, não repete pedido nem o que já foi lido, e limpa depois da leitura", async () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "arte-"));
  const lista = posts.map(comImagem);
  const pendentes = [];
  const opts = { pendentes, lidas: {}, hoje: "2026-11-09", raiz, fetchImpl: fetchOk, reduzirImpl };
  assert.equal(await enfileirarArtes(BANDA, lista, opts), 1);
  assert.equal(await enfileirarArtes(BANDA, lista, opts), 0);
  assert.deepEqual(pendentes[0].imagens, ["media/news/agenda-arte/DfSVhjYxuxQ-1.jpg", "media/news/agenda-arte/DfSVhjYxuxQ-2.jpg"]);
  assert.ok(fs.existsSync(path.join(raiz, pendentes[0].imagens[0])));
  const lidas = { [MES_ESPECIAL.link]: LEITURA };
  assert.equal(await enfileirarArtes(BANDA, lista, { ...opts, pendentes: [], lidas }), 0);
  const agora = Date.parse("2026-11-10T12:00:00Z");
  assert.equal((await limparFila(pendentes, {}, { raiz, agora })).length, 1); // ainda não lida: fica
  assert.equal((await limparFila(pendentes, lidas, { raiz, agora })).length, 0);
  assert.equal(fs.existsSync(path.join(raiz, pendentes[0].imagens[0])), false); // imagem saiu do repo
  fs.rmSync(raiz, { recursive: true, force: true });
});

test("fila: download que falha não entra nem derruba a banda", async () => {
  const pendentes = [];
  const fetchImpl = async () => ({ ok: false, status: 403 });
  const n = await enfileirarArtes(BANDA, [comImagem(MES_ESPECIAL)], { pendentes, lidas: {}, hoje: "2026-11-09", raiz: os.tmpdir(), fetchImpl, reduzirImpl });
  assert.equal(n, 0);
  assert.deepEqual(pendentes, []);
});

test("montar: a legenda manda, a arte só completa (hora vazia, data nova) e não duplica", () => {
  const lista = posts.map((p) => ({ ...p }));
  assert.equal(aplicarLeituras(lista, { [MES_ESPECIAL.link]: LEITURA }), 1);
  const a = montarAgenda(BANDA, lista, "2026-11-09");
  assert.deepEqual(a.map((s) => [s.data, s.casa || s.casaNome, s.hora]), [
    ["2026-11-13", "blues_beer", "20:00"],          // legenda já tinha: arte não duplica
    ["2026-11-14", "Mister Rock", "22:30"],         // só na arte: entra
    ["2026-11-19", "Mister Rock", "21:00"],         // legenda tinha data e hora sem casa: arte completa a casa
  ]);
  assert.equal(a[0].fonte, "https://www.instagram.com/p/DffhF7ktXt4/"); // fonte continua sendo o post da legenda
  assert.equal(a[0].observacao, "Into The Wild");
});
