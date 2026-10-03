// Script do painel de cápsulas (roda no navegador). DADOS e ORDEM vêm injetados pela página.
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
  const corpo = d.corpo.split("\n\n").map((p) => "<p>" + esc(p) + "</p>").join("");
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
// barra do topo: retrair e expandir todas as levas de uma vez
function dobraTodas(fechar) {
  document.querySelectorAll("section[data-leva]").forEach((sec) => {
    sec.classList.toggle("fechada", fechar);
    const h = sec.querySelector("h2.dobra");
    if (h) h.setAttribute("aria-expanded", String(!fechar));
  });
}
document.getElementById("retrair").addEventListener("click", () => dobraTodas(true));
document.getElementById("expandir").addEventListener("click", () => dobraTodas(false));
// índice: abre a leva (se estiver recolhida) e rola até ela
document.querySelectorAll(".chip-leva").forEach((a) => {
  a.addEventListener("click", (ev) => {
    ev.preventDefault();
    const sec = document.getElementById("leva-" + a.dataset.leva);
    if (!sec) return;
    sec.classList.remove("fechada");
    const h = sec.querySelector("h2.dobra");
    if (h) h.setAttribute("aria-expanded", "true");
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
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
