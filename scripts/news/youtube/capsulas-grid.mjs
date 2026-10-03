// Painel das cápsulas: grid com a capa de cada uma, agrupado pela LEVA em que
// a matéria foi escrita, mostrando status (postada, agendada) e a data que vai
// ao ar. Serve pra bater o olho e saber o que foi feito em cada rodada.
//
// Uso: node scripts/news/youtube/capsulas-grid.mjs

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("../../..", import.meta.url).pathname;
// CSS e script do navegador ficam em capsulas-grid/ (arquivos estáticos, fáceis de editar)
const ler = (f) => fs.readFileSync(new URL(`./capsulas-grid/${f}`, import.meta.url), "utf8").replace(/\n$/, "");
const { default: sharp } = await import("sharp"); // import do pacote (o caminho interno mudou no sharp 0.35)
const { buildCoverSlide, buildQuoteSlide, buildCtaSlide } = await import(`${ROOT}scripts/publish/slide-image.mjs`);
const { CYCLE_COLORS } = await import(`${ROOT}scripts/publish/color-cycle.mjs`);

// --leve gera uma versão enxuta (imagens menores) pra publicar como página web
const LEVE = process.argv.includes("--leve");
const ACERVO = path.join(ROOT, "media/news/youtube-acervo");
const SLIDES = path.join(ROOT, "media/news/instagram-slides");
const rasc = JSON.parse(fs.readFileSync(path.join(ACERVO, "_rascunhos.json"), "utf8"));
const fila = fs.existsSync(path.join(ACERVO, "_capsula-queue.json"))
  ? JSON.parse(fs.readFileSync(path.join(ACERVO, "_capsula-queue.json"), "utf8"))
  : [];
const naFila = new Map(fila.map((e) => [e.id, e]));

const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "");

// A capa publicada usa a cor do ciclo pela posição na fila; aqui reproduzimos
// a mesma conta pra o painel bater com o que vai ao ar.
function corDe(id) {
  const i = fila.findIndex((e) => e.id === id);
  return CYCLE_COLORS[(i < 0 ? 0 : i) % CYCLE_COLORS.length];
}

async function uri(arquivo, largura, qualidade = 72) {
  const buf = await sharp(arquivo).resize(largura, null).jpeg({ quality: qualidade, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// Renderiza o carrossel inteiro da cápsula (capa -> citações -> CTA) com a cor
// que ela vai usar de verdade, e devolve as imagens embutidas. Os arquivos
// temporários saem do disco na hora.
async function carrosselDe(cap) {
  const cor = corDe(cap.id);
  const slides = [];
  const temporarios = [];

  const publicada = path.join(ROOT, "media/news/img", `${cap.id}.jpg`);
  let capa = publicada;
  if (!fs.existsSync(publicada)) {
    const tid = `_grid-${cap.id}-capa`;
    await buildCoverSlide(
      { id: tid, title_pt: cap.title_capa || cap.title_pt, img: cap.img, tags: cap.tags, kind: "youtube", url: "" },
      tid, cor,
    );
    capa = path.join(SLIDES, `${tid}.jpg`);
    temporarios.push(capa);
  }
  slides.push({ rotulo: "capa", src: await uri(capa, LEVE ? 150 : 320, LEVE ? 46 : 72) });
  // gerada agora, antes de os temporários saírem do disco
  const miniatura = await uri(capa, LEVE ? 150 : 230, LEVE ? 48 : 66);

  const cs = Array.isArray(cap.carrossel) ? cap.carrossel : [];
  for (let i = 0; i < cs.length; i++) {
    const tid = `_grid-${cap.id}-q${i}`;
    await buildQuoteSlide({ id: tid, quote: cs[i].texto, author: cs[i].autor || "Eddie Vedder" }, tid, cor);
    const arq = path.join(SLIDES, `${tid}.jpg`);
    temporarios.push(arq);
    slides.push({ rotulo: `citação ${i + 1}`, src: await uri(arq, LEVE ? 150 : 320, LEVE ? 46 : 72) });
  }

  const tidCta = `_grid-${cap.id}-cta`;
  await buildCtaSlide({ hook: "o maior acervo de Pearl Jam do Brasil" }, tidCta, cor);
  const arqCta = path.join(SLIDES, `${tidCta}.jpg`);
  temporarios.push(arqCta);
  slides.push({ rotulo: "CTA", src: await uri(arqCta, LEVE ? 150 : 320, LEVE ? 46 : 72) });

  for (const t of temporarios) fs.rmSync(t, { force: true });
  return { slides, miniatura };
}

const levas = new Map();
for (const c of rasc) {
  const k = c.leva || 0;
  if (!levas.has(k)) levas.set(k, []);
  levas.get(k).push(c);
}

// Dados que o modal de conferência consome (frases + matéria inteira).
const detalhes = {};

const blocos = [];
const indice = [];
for (const [leva, itens] of [...levas.entries()].sort((a, b) => a[0] - b[0])) {
  const cards = [];
  for (const c of itens) {
    const e = naFila.get(c.id);
    const postada = !!e?.postedAt;
    const status = postada
      ? `no ar desde ${dataBR(e.postedAt)}`
      : e ? `agenda ${dataBR(e.publishAt)}` : "fora da fila";
    const { slides, miniatura } = await carrosselDe(c);
    detalhes[c.id] = {
      titulo: c.title_pt, capa: c.title_capa, intro: c.intro_pt, corpo: c.body_pt, slides,
      frases: (c.carrossel || []).map((q) => ({ texto: q.texto, autor: q.autor || "Eddie Vedder" })),
      tags: c.tags || [], video: `https://youtu.be/${c.videoId}`, foto: c.img,
      status, postada, leva,
    };
    cards.push(`<article class="${postada ? "postada" : "pendente"}" data-id="${c.id}" tabindex="0">
      <img src="${miniatura}" alt="" loading="lazy">
      <div class="meta">
        <span class="tag">${postada ? "PUBLICADA" : "NA FILA"}</span>
        <span class="quando">${status}</span>
      </div>
      <h3>${c.title_pt.replace(/</g, "&lt;")}</h3>
      <p class="sub">${c.carrossel?.length || 0} citações · ${(c.body_pt || "").length} caracteres</p>
    </article>`);
    console.log(`leva ${leva}: ${c.id}`);
  }
  const escritaEm = itens[0]?.criadoEm ? new Date(itens[0].criadoEm + "T12:00:00").toLocaleDateString("pt-BR") : "sem data";
  const postadas = itens.filter((c) => naFila.get(c.id)?.postedAt).length;
  indice.push({ leva, n: itens.length });
  blocos.push(`<section id="leva-${leva}" data-leva="${leva}">
    <h2 class="dobra" tabindex="0" role="button" aria-expanded="true"><span class="seta">▾</span> Leva ${leva || "sem leva"} <small>escrita em ${escritaEm} · ${itens.length} matérias · ${postadas} no ar</small></h2>
    <div class="grid">${cards.join("")}</div>
  </section>`);
}

const total = rasc.length;
const noAr = rasc.filter((c) => naFila.get(c.id)?.postedAt).length;
const ultima = fila.filter((e) => !e.postedAt).map((e) => e.publishAt).sort().pop();

const html = `<!doctype html><meta charset="utf8"><title>Cápsulas por leva</title>
<style>
${ler("estilo.css")}
</style>
<h1>Cápsulas do YouTube, por leva</h1>
<p class="resumo">${total} matérias escritas · ${noAr} já no ar · fila agendada até ${dataBR(ultima)} (1 por dia, 20h BRT)</p>
<p class="dica">Clique no título de uma leva pra recolher ou expandir. Clique numa cápsula pra conferir o carrossel e a matéria inteira: setas ← → navegam, Esc fecha.</p>
<div class="barra">
  <div class="acoes"><button id="retrair">retrair todas</button><button id="expandir">expandir todas</button></div>
  <nav class="indice">${indice.map(({ leva, n }) => `<a class="chip-leva" href="#leva-${leva}" data-leva="${leva}">Leva ${leva || "?"} <small>${n}</small></a>`).join("")}</nav>
</div>
${blocos.join("")}
<div id="fundo"></div>
<div id="modal"><div class="caixa"><button class="fechar" aria-label="fechar">×</button><div id="conteudo"></div>
<div class="nav"><button id="ant">← anterior</button><button id="prox">próxima →</button></div></div></div>
<script>
const DADOS = ${JSON.stringify(detalhes)};
const ORDEM = ${JSON.stringify(Object.keys(detalhes))};
${ler("cliente.js")}
</script>`;

const destino = LEVE ? "/tmp/capsulas-grid-leve.html" : "/tmp/capsulas-grid.html";
fs.writeFileSync(destino, html);
console.log(`\npainel: ${destino}`);
if (!LEVE) try { spawnSync("open", [destino]); } catch { /* sem GUI */ }
