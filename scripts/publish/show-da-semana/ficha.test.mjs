import { test } from "node:test";
import assert from "node:assert/strict";
import { RAIZ } from "../../config.mjs";
import { lerChave, setlistFm, folego } from "./acervo.mjs";
import { rascunho, validar, LIMITE_HISTORIA } from "./ficha.mjs";

function fichaBoa() {
  const f = rascunho(RAIZ, "pj:2005-12-02", 1);
  f.poster.credito = "pôster oficial";
  f.historia = {
    titulo: "A primeira vez no Brasil",
    texto: "O Pearl Jam tocou no Brasil pela primeira vez em 2005, numa turnê pela América do Sul.",
    fontes: [{ url: "https://pearljam.com/", trecho: "trecho que comprova" }],
  };
  f.legenda = "Show nº 1 da série. Segue a gente: o maior acervo de Pearl Jam do Brasil.";
  return f;
}

test("lerChave aceita pj:data e id do site, recusa o resto", () => {
  assert.deepEqual(lerChave("pj:1996-11-15"), { prefixo: "pj", artista: "Pearl Jam", data: "1996-11-15" });
  assert.equal(lerChave("ev-2014-05-06").artista, "Eddie Vedder");
  assert.throws(() => lerChave("praga 1996"));
});

test("setlist.fm separa show e bis (Praga 1996)", () => {
  const s = setlistFm(RAIZ, "Pearl Jam", "1996-11-15");
  assert.ok(s, "Praga 1996 está no acervo");
  assert.equal(s.show[0], "Go");
  assert.ok(s.bis.length > 0);
  assert.match(s.url, /setlist\.fm/);
});

test("rascunho de show do site traz pôster do repo e setlist", () => {
  const f = rascunho(RAIZ, "pj-2005-12-02", 3);
  assert.equal(f.numero, 3);
  assert.equal(f.status, "rascunho");
  assert.equal(f.poster.arquivo, "media/pj-2005-12-02/poster.jpg");
  assert.ok(f.setlist.show.length > 10);
  assert.ok(validar(f).length > 0, "rascunho vazio não passa");
});

test("ficha completa passa; quebrar uma regra barra", () => {
  assert.deepEqual(validar(fichaBoa()), []);
  const semFonte = fichaBoa(); semFonte.historia.fontes = [];
  assert.ok(validar(semFonte).some((e) => e.includes("fonte")));
  const travessao = fichaBoa(); travessao.legenda = "Show histórico — imperdível.";
  assert.ok(validar(travessao).some((e) => e.includes("travessão")));
  const longa = fichaBoa(); longa.historia.texto = "é ".repeat(LIMITE_HISTORIA);
  assert.ok(validar(longa).some((e) => e.includes("caracteres")));
  const semCredito = fichaBoa(); semCredito.poster.credito = "";
  assert.ok(validar(semCredito).some((e) => e.includes("credito")));
});

test("publicar exige aprovação", () => {
  assert.ok(validar(fichaBoa(), { paraPublicar: true }).some((e) => e.includes("aprovado")));
  const ok = fichaBoa(); ok.status = "aprovado";
  assert.deepEqual(validar(ok, { paraPublicar: true }), []);
});

test("fôlego conta o material do repo", () => {
  const f = folego(RAIZ);
  assert.ok(f.comPosterNoRepo >= 20);
  assert.ok(f.setlistFm > 1000);
});
