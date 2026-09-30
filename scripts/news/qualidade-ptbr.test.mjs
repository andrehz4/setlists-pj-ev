// Testes da trava de qualidade PT-BR e do conserto da legenda do Instagram.
//   node --test scripts/news/qualidade-ptbr.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { checarPtBr, corrigirPtPt, contarSemAcento } from "./qualidade-ptbr.mjs";
import { truncateBody, limparMarkdown } from "../publish/instagram.mjs";

const BOM = {
  titulo_pt: "Jeff Ament fala em turnê para 2027 e novo álbum do Pearl Jam",
  titulo_ig: "Pearl Jam planeja turnê em 2027 e disco novo",
  intro_pt: "Jeff Ament disse à Rolling Stone que uma turnê em 2027 está nos planos.",
  corpo_pt: "Desde maio de 2025 o Pearl Jam estava fora dos palcos. Na última sexta, a banda voltou com dois shows no Ohana. "
    + "Ament falou dos planos pra 2027 com um entusiasmo que não dá pra fingir: \"Eu adoraria voltar pra estrada. Está na hora.\"\n\n_via Igor Miranda_",
};

// Caso real de 2026-09-29 que foi pro ar: matéria inteira sem acento.
const ACHATADO = {
  titulo_pt: "Jeff Ament fala em turne para 2027 e novo album do Pearl Jam",
  titulo_ig: "Pearl Jam planeja turne em 2027 e novo disco",
  intro_pt: "Jeff Ament disse a Rolling Stone que uma turne em 2027 esta nos planos e que o novo album ainda esta em gestacao.",
  corpo_pt: "Desde maio de 2025 o Pearl Jam estava fora dos palcos. Na ultima sexta, a banda voltou com dois shows no Ohana. "
    + "Ament falou dos planos pra 2027 com um entusiasmo que nao da pra fingir: \"Eu adoraria voltar pra estrada. Esta na hora.\"",
};

test("texto normal passa sem bloqueio", () => {
  assert.deepEqual(checarPtBr(BOM).bloqueios, []);
});

test("matéria inteira sem acento é barrada", () => {
  const r = checarPtBr(ACHATADO);
  assert.equal(r.bloqueios.length, 1);
  assert.match(r.bloqueios[0], /sem acento/);
});

test("título sem acento é barrado mesmo com corpo bom", () => {
  const r = checarPtBr({ ...BOM, titulo_ig: "Novo baterista do PJ ainda nao e oficial" });
  assert.ok(r.bloqueios.some((b) => /título/.test(b)));
});

test("palavra com acento não conta como sem acento (alemão, São Paulo, já)", () => {
  assert.equal(contarSemAcento("o Rolling Stone alemão e a edição alemã em São Paulo já saiu"), 0);
  assert.equal(contarSemAcento("nao, tambem, alem"), 3);
});

test("português de Portugal: corrige o seguro e avisa o resto", () => {
  assert.equal(corrigirPtPt("o vocalista dos Pearl Jam e o fã aos Pearl Jam"), "o vocalista do Pearl Jam e o fã ao Pearl Jam");
  assert.equal(corrigirPtPt("todos os Pearl Jam"), "todos os Pearl Jam");
  assert.deepEqual(checarPtBr({ ...BOM, corpo_pt: BOM.corpo_pt + " Os Pearl Jam tocaram." }).avisos, ["português de Portugal"]);
});

test("legenda: corte no fim de frase sai sem reticências", () => {
  const t = "Primeira frase aqui. Segunda frase com \"aspas no fim.\" Terceira frase que vai ser cortada no meio";
  assert.equal(truncateBody(t, 60), "Primeira frase aqui. Segunda frase com \"aspas no fim.\"");
  assert.doesNotMatch(truncateBody("Uma. Duas frases longas que passam muito do limite de caracteres permitido", 40), /\.…/);
});

test("legenda: corte no meio da palavra recua pro espaço e põe reticências", () => {
  assert.equal(truncateBody("aaaa bbbb cccc dddd eeee", 12), "aaaa bbbb…");
});

test("legenda: tira _via Fonte_ e marcas de itálico, preserva 'via' no meio do texto", () => {
  assert.equal(limparMarkdown("Saiu *Vs.* e _Ten_.\n\n_via Stereogum_"), "Saiu Vs. e Ten.");
  assert.equal(limparMarkdown("Lançado via streaming."), "Lançado via streaming.");
  assert.equal(limparMarkdown("A.\n\nVia Twitter, a banda confirmou a data do show em Curitiba e a venda começa sexta."),
    "A.\n\nVia Twitter, a banda confirmou a data do show em Curitiba e a venda começa sexta.");
});
