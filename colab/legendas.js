// Legenda do vídeo: 3 estilos + "sem legenda", prévia ao vivo sobre o vídeo e lista editável.
// A prévia é CSS por cima do <video>; a legenda definitiva é queimada no render (fase 5),
// que deve seguir estes mesmos estilos (colab/legendas.css).

import { h } from "./api.js";

export const ESTILOS = [
  { id: "palavra", nome: "Palavra", desc: "acende palavra por palavra", amostra: "O TEN" },
  { id: "faixa", nome: "Faixa", desc: "frase numa tarja clara", amostra: "o Ten" },
  { id: "cinema", nome: "Cinema", desc: "serifa, discreta", amostra: "o Ten" },
  { id: "nenhuma", nome: "Sem legenda", desc: "o vídeo sai limpo", amostra: "" },
];
const POR_GRUPO = 3;

// Palavras com tempo. Se a pessoa editou o texto, redistribui o tempo por igual no trecho.
export function palavrasDe(trecho) {
  const toks = trecho.text.trim().split(/\s+/).filter(Boolean);
  const orig = (trecho.words || []).map((w) => w.w);
  if (orig.length && orig.join(" ") === toks.join(" ")) return trecho.words;
  const passo = (trecho.end - trecho.start) / Math.max(toks.length, 1);
  return toks.map((w, i) => ({ w, s: trecho.start + i * passo, e: trecho.start + (i + 1) * passo }));
}

export function trechoEm(legendas, t) {
  return legendas.find((x) => t >= x.start && t < x.end + 0.15) || null;
}

// Estilo "palavra": grupo de até 3 palavras em volta da palavra que está sendo dita.
export function grupoEm(palavras, t) {
  let i = 0;
  palavras.forEach((p, j) => { if (p.s <= t) i = j; });
  const ini = Math.floor(i / POR_GRUPO) * POR_GRUPO;
  return { itens: palavras.slice(ini, ini + POR_GRUPO).map((p) => p.w), ativa: i - ini };
}

export function ligarPreview(video, camada, estado) {
  let raf = 0;
  let ultimo = "";
  const passo = () => {
    const t = video.currentTime;
    if (estado.trim && !video.paused && (t >= estado.trim[1] || t < estado.trim[0] - 0.3)) {
      video.currentTime = estado.trim[0];
    }
    ultimo = desenhar(camada, estado, t, ultimo);
    raf = requestAnimationFrame(passo);
  };
  passo();
  return () => cancelAnimationFrame(raf);
}

function desenhar(camada, estado, t, ultimo) {
  const trecho = estado.estilo === "nenhuma" ? null : trechoEm(estado.legendas, t);
  let assinatura = estado.estilo + "|" + (trecho ? trecho.start + trecho.text : "");
  let grupo = null;
  if (trecho && estado.estilo === "palavra") {
    grupo = grupoEm(palavrasDe(trecho), t);
    assinatura += "|" + grupo.itens.join(" ") + grupo.ativa;
  }
  if (assinatura === ultimo) return ultimo;
  camada.className = "cap cap-" + estado.estilo;
  if (!trecho) camada.replaceChildren();
  else if (grupo) camada.replaceChildren(...grupo.itens.map((w, i) => h("span", { class: i === grupo.ativa ? "on" : "" }, w)));
  else camada.replaceChildren(h("span", {}, trecho.text));
  return assinatura;
}

export function escolhaEstilo(estado, aoMudar) {
  const grupo = h("div", { class: "estilos", role: "radiogroup", "aria-label": "Estilo da legenda" });
  const pintar = () => grupo.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === estado.estilo)));
  for (const e of ESTILOS) {
    grupo.append(h("button", {
      type: "button", role: "radio", "data-id": e.id,
      onclick: () => { estado.estilo = e.id; pintar(); aoMudar(); },
    },
    h("span", { class: "amostra amostra-" + e.id }, e.amostra ? h("span", {}, e.amostra) : h("s", {}, "Aa")),
    h("b", {}, e.nome), h("small", {}, e.desc)));
  }
  pintar();
  return grupo;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function listaLegendas(estado, video, aoMudar) {
  const caixa = h("div", { class: "subs" });
  const render = () => {
    caixa.replaceChildren(...estado.legendas.map((tr, i) => h("div", { class: "sub" + (tr.duvida ? " duvida" : "") },
      h("button", { type: "button", class: "tempo", title: "Ir pra esse ponto", onclick: () => { video.currentTime = tr.start; video.play?.(); } }, mmss(tr.start)),
      h("input", {
        value: tr.text, maxlength: "300", "aria-label": "Texto da legenda em " + mmss(tr.start),
        oninput: (ev) => { tr.text = ev.target.value; tr.duvida = false; ev.target.parentElement.classList.remove("duvida"); aoMudar(); },
      }),
      h("button", { type: "button", class: "tirar", "aria-label": "Apagar linha", onclick: () => { estado.legendas.splice(i, 1); render(); aoMudar(); } }, "×"))));
    if (!estado.legendas.length) caixa.append(h("p", { class: "vazio" }, "Nenhuma linha ainda. Toque em adicionar no ponto do vídeo onde a fala começa."));
  };
  const adicionar = h("button", {
    type: "button", class: "btn ghost small",
    onclick: () => {
      const t = video.currentTime || 0;
      estado.legendas.push({ start: t, end: t + 2.5, text: "", words: [] });
      estado.legendas.sort((a, b) => a.start - b.start);
      render();
      aoMudar();
    },
  }, "+ Linha no ponto atual");
  render();
  return { el: h("div", { class: "subs-wrap" }, caixa, adicionar), render };
}
