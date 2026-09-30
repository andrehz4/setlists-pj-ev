// Testes do slide de citação das cápsulas (estilos editorial e revista).
//   node --test scripts/publish/citacao/citacao.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolverAutor, carregarCatalogo, arquivoRetrato } from "./retratos.mjs";
import { quebrarEquilibrado, iniciais } from "./texto.mjs";
import { paleta } from "./paleta.mjs";
import { fonteDoVideo } from "./fontes.mjs";
import { svgCitacao, estiloDoDia, montarContexto, ESTILOS } from "./slide-citacao.mjs";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const EDDIE = resolverAutor("Eddie Vedder, em 1990", "cap-x");
const DL = resolverAutor("David Letterman");

test("autor com contexto separa nome e contexto e acha retrato", () => {
  assert.equal(EDDIE.nome, "Eddie Vedder");
  assert.equal(EDDIE.contexto, "em 1990");
  assert.match(EDDIE.foto, /eddie-vedder-[1-4]\.jpg$/);
  assert.equal(resolverAutor("Jeff Ament, segundo Dave Krusen, em 2020").contexto, "segundo Dave Krusen, em 2020");
  assert.equal(resolverAutor("stone").slug, "stone-gossard");
});

test("quem não tem retrato sai sem foto; autor vazio cai no Eddie", () => {
  for (const a of ["David Letterman", "Pearl Jam, em 1991", "Eddie Vedder e Stone Gossard"]) assert.equal(resolverAutor(a).foto, null, a);
  assert.equal(resolverAutor("").slug, "eddie-vedder");
});

test("mesma cápsula sempre pega a mesma foto do Eddie", () => {
  const f = resolverAutor("Eddie Vedder", "cap-abc").foto;
  for (let i = 0; i < 5; i++) assert.equal(resolverAutor("Eddie Vedder", "cap-abc").foto, f);
});

test("todo retrato do catálogo existe em disco e é quadrado", async () => {
  const sharp = (await import("sharp")).default;
  for (const [slug, p] of Object.entries(carregarCatalogo())) {
    for (let n = 1; n <= p.fotos.length; n++) {
      const m = await sharp(arquivoRetrato(slug, n)).metadata();
      assert.equal(m.width, m.height, `${slug}-${n}`);
    }
  }
});

test("iniciais do círculo sem foto", () => {
  assert.equal(iniciais("David Letterman"), "DL");
  assert.equal(iniciais("Pearl Jam"), "PJ");
  assert.equal(iniciais("Eddie Vedder e Stone Gossard"), "E&S");
  assert.equal(iniciais("Soundgarden"), "S");
});

test("quebra equilibrada não passa da largura e mantém o número de linhas", async () => {
  const medida = async (t) => t.length * 10;
  const texto = "uma frase comprida o bastante pra quebrar em várias linhas no slide";
  const r = await quebrarEquilibrado(texto, 300, medida);
  for (const l of r) assert.ok((await medida(l)) <= 300, l);
  assert.equal(r.join(" "), texto);
});

test("contexto + fonte: junta o que existir", () => {
  assert.equal(montarContexto("em 1990", "Apple Music, 2024"), "em 1990 · Apple Music, 2024");
  assert.equal(montarContexto("", "MTV, 1994"), "MTV, 1994");
  assert.equal(montarContexto("em 1990", ""), "em 1990");
  assert.equal(montarContexto("", ""), "");
});

test("fontes: vídeo conhecido tem fonte, desconhecido sai vazio", () => {
  assert.equal(fonteDoVideo("xGJfUa_r08Q"), "MTV, 1994");
  assert.equal(fonteDoVideo("nao-existe"), "");
});

test("nenhuma fonte usa travessão", () => {
  const f = JSON.parse(fs.readFileSync("media/news/youtube-acervo/_fontes.json", "utf8")).fontes;
  for (const [id, t] of Object.entries(f)) assert.doesNotMatch(t, /[—–]/, id);
});

test("rodízio alterna por dia (BRT) e respeita estilo fixo", () => {
  const d1 = new Date("2026-10-01T15:00:00Z"), d2 = new Date("2026-10-02T15:00:00Z");
  assert.notEqual(estiloDoDia("rodizio", d1), estiloDoDia("rodizio", d2));
  assert.ok(ESTILOS.includes(estiloDoDia("rodizio", d1)));
  assert.equal(estiloDoDia("revista", d1), "revista");
  // 02:59Z do dia 2 ainda é 23:59 BRT do dia 1
  assert.equal(estiloDoDia("rodizio", new Date("2026-10-02T02:59:00Z")), estiloDoDia("rodizio", d1));
});

test("paleta conhecida do ciclo e derivada pra cor nova", () => {
  assert.equal(paleta("#2A5B9E").bg, "#0a1220");
  assert.match(paleta("#123456").claro, /^#[0-9a-f]{6}$/);
});

test("editorial: @smufdpj, seta de arrastar, escapa texto, foto só quando tem", async () => {
  const com = await svgCitacao({ quote: "Rock & <roll>", autor: EDDIE, fonte: "MTV, 1994", estilo: "editorial" });
  assert.equal(com.estilo, "editorial");
  assert.match(com.svg, /@smufdpj/);
  assert.match(com.svg, /ARRASTE/);
  assert.match(com.svg, /Rock &amp; &lt;roll&gt;/);
  assert.match(com.svg, /em 1990 · MTV, 1994/);
  assert.match(com.svg, /<image/);
  const sem = await svgCitacao({ quote: "Frase.", autor: DL, estilo: "editorial" });
  assert.doesNotMatch(sem.svg, /<image/);
  assert.match(sem.svg, />DL</);
});

test("revista: com foto usa duotone, sem foto usa nome gigante", async () => {
  const com = await svgCitacao({ quote: "Frase curta.", autor: EDDIE, estilo: "revista", cor: "#a87f2c" });
  assert.equal(com.estilo, "revista");
  assert.match(com.svg, /<image/);
  const sem = await svgCitacao({ quote: "Frase curta.", autor: DL, estilo: "revista" });
  assert.equal(sem.estilo, "revista");
  assert.match(sem.svg, /LETTERMAN/);
});

test("revista sem foto com nome enorme cai no editorial", async () => {
  const a = resolverAutor("Kelly Curtis, segundo Matt Vaughan, na cerimônia de indução do Hall da Fama");
  const nomeLongo = { ...a, nome: "Associação Internacional dos Fãs Brasileiros de Grunge" };
  const r = await svgCitacao({ quote: "Frase.", autor: nomeLongo, estilo: "revista" });
  assert.equal(r.estilo, "editorial");
});

test("Regra 0: arquivos do módulo ficam curtos", () => {
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs"))) {
    const linhas = fs.readFileSync(path.join(DIR, f), "utf8").split("\n").length;
    assert.ok(linhas <= 150, `${f} tem ${linhas} linhas`);
  }
});
