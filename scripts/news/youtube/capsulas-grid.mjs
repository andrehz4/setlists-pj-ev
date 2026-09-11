// Painel das cápsulas: grid com a capa de cada uma, agrupado pela LEVA em que
// a matéria foi escrita, mostrando status (postada, agendada) e a data que vai
// ao ar. Serve pra bater o olho e saber o que foi feito em cada rodada.
//
// Uso: node scripts/news/youtube/capsulas-grid.mjs

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("../../..", import.meta.url).pathname;
const sharp = (await import(`${ROOT}node_modules/sharp/lib/index.js`)).default;
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
  blocos.push(`<section>
    <h2 class="dobra" tabindex="0" role="button" aria-expanded="true"><span class="seta">▾</span> Leva ${leva || "sem leva"} <small>escrita em ${escritaEm} · ${itens.length} matérias · ${postadas} no ar</small></h2>
    <div class="grid">${cards.join("")}</div>
  </section>`);
}

const total = rasc.length;
const noAr = rasc.filter((c) => naFila.get(c.id)?.postedAt).length;
const ultima = fila.filter((e) => !e.postedAt).map((e) => e.publishAt).sort().pop();

const html = `<!doctype html><meta charset="utf8"><title>Cápsulas por leva</title>
<style>
:root{color-scheme:dark}
body{background:#0f1115;color:#e8e6e0;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:28px 24px 60px}
h1{font-size:22px;margin:0 0 4px}
.resumo{color:#8b93a0;font-size:13px;margin-bottom:32px}
h2{font-size:15px;color:#e8e6e0;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #262b35;text-transform:uppercase;letter-spacing:.06em}
h2 small{text-transform:none;letter-spacing:0;color:#8b93a0;font-weight:400;margin-left:8px}
h2.dobra{cursor:pointer;user-select:none;transition:color .15s}
h2.dobra:hover,h2.dobra:focus{color:#63c295;outline:none}
.seta{display:inline-block;width:14px;color:#6f7784;transition:transform .18s}
h2.dobra:hover .seta{color:#63c295}
section.fechada .seta{transform:rotate(-90deg)}
section.fechada .grid{display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
article{background:#161a21;border:1px solid #262b35;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:border-color .15s,transform .15s}
article:hover,article:focus{border-color:#63c295;transform:translateY(-2px);outline:none}
article.postada{border-color:#2f6b4f}
article img{width:100%;display:block;aspect-ratio:4/5;object-fit:cover}
.meta{display:flex;justify-content:space-between;align-items:center;padding:10px 12px 0;font-size:10px;letter-spacing:.08em}
.tag{color:#8b93a0;font-weight:700}
.postada .tag{color:#63c295}
.quando{color:#8b93a0;text-transform:uppercase}
h3{font-size:13px;line-height:1.4;margin:8px 12px 6px;font-weight:600}
.sub{margin:0 12px 12px;font-size:11px;color:#6f7784}
.dica{color:#6f7784;font-size:12px;margin:-24px 0 30px}
/* modal de conferência */
#fundo{position:fixed;inset:0;background:rgba(8,10,14,.86);display:none;z-index:9;backdrop-filter:blur(3px)}
#fundo.on{display:block}
#modal{position:fixed;inset:0;display:none;z-index:10;overflow-y:auto;padding:40px 20px}
#modal.on{display:block}
.caixa{max-width:720px;margin:0 auto;background:#161a21;border:1px solid #2f3846;border-radius:14px;padding:28px 30px 34px;position:relative}
.fechar{position:absolute;top:14px;right:16px;background:none;border:none;color:#8b93a0;font-size:26px;line-height:1;cursor:pointer;padding:4px 8px}
.fechar:hover{color:#e8e6e0}
.caixa .chip{display:inline-block;font-size:10px;letter-spacing:.08em;color:#8b93a0;border:1px solid #333c4a;border-radius:20px;padding:3px 10px;margin:0 6px 14px 0}
.caixa .chip.ok{color:#63c295;border-color:#2f6b4f}
.caixa h2{border:none;text-transform:none;letter-spacing:0;font-size:20px;line-height:1.35;margin:6px 0 10px;padding:0}
.caixa .intro{color:#b6bcc6;font-size:14px;line-height:1.6;margin:0 0 22px}
.rotulo{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6f7784;margin:26px 0 12px}
.tira{display:flex;gap:12px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;cursor:grab;overscroll-behavior-x:contain}
.tira.arrastando{cursor:grabbing;scroll-behavior:auto}
.tira figure{margin:0;flex:0 0 auto}
.tira img{width:250px;border-radius:8px;display:block;border:1px solid #2f3846;user-select:none;-webkit-user-drag:none}
.tira figcaption{font-size:10px;color:#6f7784;margin-top:6px;text-align:center;text-transform:uppercase;letter-spacing:.08em}
.frase{border-left:3px solid #63c295;padding:2px 0 2px 16px;margin:0 0 18px}
.frase p{margin:0 0 6px;font-size:16px;line-height:1.5;color:#f2f0ea}
.frase span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b93a0}
.frase b{color:#6f7784;font-weight:400;font-size:11px;margin-left:8px}
.corpo p{font-size:14px;line-height:1.75;color:#c9cdd4;margin:0 0 14px}
.rodape{margin-top:26px;padding-top:16px;border-top:1px solid #262b35;font-size:12px;color:#6f7784;display:flex;flex-wrap:wrap;gap:14px}
.rodape a{color:#63c295;text-decoration:none}
.nav{display:flex;justify-content:space-between;gap:10px;margin-top:22px}
.nav button{background:#1d222b;border:1px solid #333c4a;color:#c9cdd4;border-radius:8px;padding:9px 16px;font-size:13px;cursor:pointer}
.nav button:hover:not(:disabled){border-color:#63c295;color:#fff}
.nav button:disabled{opacity:.35;cursor:default}
@media(max-width:520px){body{padding:20px 16px 40px}.grid{grid-template-columns:1fr 1fr;gap:12px}#modal{padding:16px 10px}.caixa{padding:22px 18px 26px}}
</style>
<h1>Cápsulas do YouTube, por leva</h1>
<p class="resumo">${total} matérias escritas · ${noAr} já no ar · fila agendada até ${dataBR(ultima)} (1 por dia, 20h BRT)</p>
<p class="dica">Clique no título de uma leva pra recolher ou expandir. Clique numa cápsula pra conferir o carrossel e a matéria inteira: setas ← → navegam, Esc fecha.</p>
${blocos.join("")}
<div id="fundo"></div>
<div id="modal"><div class="caixa"><button class="fechar" aria-label="fechar">×</button><div id="conteudo"></div>
<div class="nav"><button id="ant">← anterior</button><button id="prox">próxima →</button></div></div></div>
<script>
const DADOS = ${JSON.stringify(detalhes)};
const ORDEM = ${JSON.stringify(Object.keys(detalhes))};
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
let atual = -1;

// A tira de slides rola na horizontal. Sem isso, o mouse não arrasta e a roda
// (que é vertical) não move nada, o que dá a impressão de estar invertido.
function ligaArraste(tira) {
  if (!tira || tira.dataset.arraste) return;
  tira.dataset.arraste = "1";
  let pegando = false, xInicial = 0, scrollInicial = 0, moveu = 0;
  tira.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    pegando = true; moveu = 0;
    xInicial = ev.clientX; scrollInicial = tira.scrollLeft;
    tira.classList.add("arrastando");
    tira.setPointerCapture(ev.pointerId);
  });
  tira.addEventListener("pointermove", (ev) => {
    if (!pegando) return;
    const d = ev.clientX - xInicial;
    moveu = Math.max(moveu, Math.abs(d));
    tira.scrollLeft = scrollInicial - d; // arrastar pra esquerda avança
    ev.preventDefault();
  });
  const solta = (ev) => {
    if (!pegando) return;
    pegando = false;
    tira.classList.remove("arrastando");
    try { tira.releasePointerCapture(ev.pointerId); } catch { /* já solto */ }
  };
  tira.addEventListener("pointerup", solta);
  tira.addEventListener("pointercancel", solta);
  tira.addEventListener("click", (ev) => { if (moveu > 5) ev.preventDefault(); }, true);
  // roda vertical do mouse move a tira na horizontal
  tira.addEventListener("wheel", (ev) => {
    if (Math.abs(ev.deltaY) <= Math.abs(ev.deltaX)) return; // trackpad horizontal: deixa nativo
    tira.scrollLeft += ev.deltaY;
    ev.preventDefault();
  }, { passive: false });
}

function abrir(i) {
  atual = i;
  const d = DADOS[ORDEM[i]];
  const tira = d.slides.map((s, n) =>
    '<figure><img src="' + s.src + '" alt=""><figcaption>' + (n + 1) + '. ' + s.rotulo + '</figcaption></figure>').join("");
  const frases = d.frases.map((f, n) =>
    '<div class="frase"><p>' + esc(f.texto) + '</p><span>' + esc(f.autor) +
    '</span><b>slide ' + (n + 2) + ' · ' + f.texto.length + ' caracteres</b></div>').join("");
  const corpo = d.corpo.split("\\n\\n").map((p) => "<p>" + esc(p) + "</p>").join("");
  document.getElementById("conteudo").innerHTML =
    '<span class="chip' + (d.postada ? " ok" : "") + '">' + (d.postada ? "PUBLICADA" : "NA FILA") + '</span>' +
    '<span class="chip">leva ' + d.leva + '</span><span class="chip">' + esc(d.status) + '</span>' +
    '<h2>' + esc(d.titulo) + '</h2>' +
    '<p class="intro">' + esc(d.intro) + '</p>' +
    '<div class="rotulo">Carrossel como vai ao ar (' + d.slides.length + ' slides, arraste →)</div>' +
    '<div class="tira">' + tira + '</div>' +
    '<div class="rotulo">Frases em texto, pra conferir (' + d.frases.length + ')</div>' + frases +
    '<div class="rotulo">Matéria completa (' + d.corpo.length + ' caracteres)</div><div class="corpo">' + corpo + '</div>' +
    '<div class="rodape"><span>tags: ' + d.tags.join(", ") + '</span>' +
    '<a href="' + d.video + '" target="_blank" rel="noopener">vídeo de origem</a>' +
    '<span>foto: ' + esc(d.foto.split("/").pop()) + '</span></div>';
  document.getElementById("ant").disabled = i === 0;
  document.getElementById("prox").disabled = i === ORDEM.length - 1;
  ligaArraste(document.querySelector(".tira"));
  document.getElementById("modal").classList.add("on");
  document.getElementById("fundo").classList.add("on");
  document.getElementById("modal").scrollTop = 0;
  document.body.style.overflow = "hidden";
}
function fechar() {
  document.getElementById("modal").classList.remove("on");
  document.getElementById("fundo").classList.remove("on");
  document.body.style.overflow = "";
  atual = -1;
}
// clique no título da leva recolhe e expande a seção inteira
document.querySelectorAll("h2.dobra").forEach((h) => {
  const alterna = () => {
    const sec = h.closest("section");
    const fechada = sec.classList.toggle("fechada");
    h.setAttribute("aria-expanded", String(!fechada));
  };
  h.addEventListener("click", alterna);
  h.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); alterna(); }
  });
});
document.querySelectorAll("article[data-id]").forEach((el) => {
  const ir = () => abrir(ORDEM.indexOf(el.dataset.id));
  el.addEventListener("click", ir);
  el.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ir(); } });
});
document.querySelector(".fechar").addEventListener("click", fechar);
document.getElementById("fundo").addEventListener("click", fechar);
document.getElementById("ant").addEventListener("click", () => atual > 0 && abrir(atual - 1));
document.getElementById("prox").addEventListener("click", () => atual < ORDEM.length - 1 && abrir(atual + 1));
document.addEventListener("keydown", (ev) => {
  if (atual < 0) return;
  if (ev.key === "Escape") fechar();
  if (ev.key === "ArrowLeft" && atual > 0) abrir(atual - 1);
  if (ev.key === "ArrowRight" && atual < ORDEM.length - 1) abrir(atual + 1);
});
</script>`;

const destino = LEVE ? "/tmp/capsulas-grid-leve.html" : "/tmp/capsulas-grid.html";
fs.writeFileSync(destino, html);
console.log(`\npainel: ${destino}`);
if (!LEVE) try { spawnSync("open", [destino]); } catch { /* sem GUI */ }
