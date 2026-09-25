// Escolha de mídia: fotos (até 10, viram carrossel) ou 1 vídeo com corte, legenda e estilo.

import { api, aviso, h } from "./api.js";
import { extrairWav } from "./audio.js";
import { escolhaEstilo, ligarPreview, listaLegendas } from "./legendas.js";

const MAX_BRUTO_SEG = 180;

export function seletorFotos(estado, cfg, aoMudar) {
  const grade = h("div", { class: "photos" });
  const input = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true, hidden: true, id: "f-fotos" });
  const render = () => {
    grade.replaceChildren(
      ...estado.fotos.map((f, i) => h("figure", {},
        h("img", { src: f.url, alt: "Foto " + (i + 1) }),
        h("button", { type: "button", class: "tirar", "aria-label": "Tirar foto", onclick: () => { URL.revokeObjectURL(f.url); estado.fotos.splice(i, 1); render(); aoMudar(); } }, "×"))),
      estado.fotos.length < cfg.max_fotos ? h("button", { type: "button", class: "add", onclick: () => input.click() }, h("span", {}, "+"), h("small", {}, "foto")) : null,
    );
  };
  input.onchange = () => {
    for (const arq of input.files) {
      if (estado.fotos.length >= cfg.max_fotos) { aviso(`No máximo ${cfg.max_fotos} fotos.`, "erro"); break; }
      if (arq.size > 15 * 1024 * 1024) { aviso(`${arq.name} passa de 15 MB.`, "erro"); continue; }
      estado.fotos.push({ arquivo: arq, url: URL.createObjectURL(arq) });
    }
    input.value = "";
    render();
    aoMudar();
  };
  render();
  return h("div", {}, grade, input, h("p", { class: "nota" }, `Até ${cfg.max_fotos} fotos. Viram carrossel no Instagram.`));
}

export function seletorVideo(estado, cfg, aoMudar) {
  const caixa = h("div", { class: "video-box" });
  const input = h("input", { type: "file", accept: "video/mp4,video/quicktime", hidden: true, id: "f-video" });
  let parar = () => {};
  const vazio = () => h("button", { type: "button", class: "drop", onclick: () => input.click() },
    h("b", {}, "Escolher vídeo"), h("small", {}, `MP4 ou MOV, até ${cfg.max_video_seg} segundos no corte final. A legenda sai sozinha.`));

  input.onchange = async () => {
    const arq = input.files[0];
    input.value = "";
    if (!arq) return;
    const url = URL.createObjectURL(arq);
    const dur = await duracao(url).catch(() => 0);
    if (!dur) { aviso("Não consegui abrir esse vídeo. Tente um MP4.", "erro"); return; }
    if (dur > MAX_BRUTO_SEG) { aviso("Vídeo com mais de 3 minutos. Corte antes no celular e envie de novo.", "erro"); return; }
    parar();
    estado.video = { arquivo: arq, url, dur };
    estado.trim = [0, Math.min(dur, cfg.max_video_seg)];
    estado.legendas = [];
    parar = montar();
    aoMudar();
    if (cfg.legenda_auto) transcrever(arq);
  };

  const status = h("p", { class: "status-legenda", "aria-live": "polite" });
  let lista;
  async function transcrever(arq) {
    status.className = "status-legenda rodando";
    status.textContent = "Gerando a legenda automática...";
    try {
      const wav = await extrairWav(arq, MAX_BRUTO_SEG);
      const r = await api("/contrib/legenda", { method: "POST", body: wav, headers: { "Content-Type": "audio/wav" } });
      estado.legendas = r.trechos;
      lista.render();
      const duvidas = r.trechos.filter((t) => t.duvida).length;
      status.className = "status-legenda pronta";
      status.textContent = duvidas ? `Legenda pronta. Confira as ${duvidas} linhas em destaque.` : "Legenda pronta. Dê uma conferida no texto.";
    } catch (e) {
      status.className = "status-legenda erro";
      status.textContent = e.message + " Você pode escrever a legenda nas linhas abaixo.";
    }
    aoMudar();
  }

  function montar() {
    const video = h("video", { src: estado.video.url, controls: true, playsinline: true, preload: "metadata" });
    const camada = h("div", { class: "cap", "aria-hidden": "true" });
    lista = listaLegendas(estado, video, aoMudar);
    caixa.replaceChildren(
      h("div", { class: "palco" }, video, camada),
      corte(estado, video, cfg, aoMudar),
      h("div", { class: "bloco" }, h("div", { class: "rot" }, "Estilo da legenda"), escolhaEstilo(estado, aoMudar)),
      h("div", { class: "bloco" }, h("div", { class: "rot" }, "Legenda · toque no texto pra corrigir"), status, lista.el),
      h("button", { type: "button", class: "btn ghost small", onclick: () => { parar(); URL.revokeObjectURL(estado.video.url); estado.video = null; estado.legendas = []; caixa.replaceChildren(vazio()); aoMudar(); } }, "Trocar vídeo"),
    );
    return ligarPreview(video, camada, estado);
  }

  caixa.replaceChildren(vazio());
  return h("div", {}, caixa, input);
}

function corte(estado, video, cfg, aoMudar) {
  const dur = estado.video.dur;
  const ini = h("input", { type: "range", min: "0", max: String(dur), step: "0.1", value: "0", "aria-label": "Início do corte" });
  const fim = h("input", { type: "range", min: "0", max: String(dur), step: "0.1", value: String(estado.trim[1]), "aria-label": "Fim do corte" });
  const rot = h("div", { class: "trimlab" });
  const f = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const atualizar = (quem) => {
    let a = Number(ini.value), b = Number(fim.value);
    if (b - a < 1) { if (quem === ini) a = b - 1; else b = a + 1; }
    if (b - a > cfg.max_video_seg) { if (quem === ini) b = a + cfg.max_video_seg; else a = b - cfg.max_video_seg; }
    a = Math.max(0, a); b = Math.min(dur, b);
    ini.value = a; fim.value = b;
    estado.trim = [a, b];
    rot.replaceChildren(h("span", {}, "começa em " + f(a)), h("span", {}, `termina em ${f(b)} · ${Math.round(b - a)}s`));
    video.currentTime = quem === fim ? Math.max(a, b - 2) : a;
    aoMudar();
  };
  ini.oninput = () => atualizar(ini);
  fim.oninput = () => atualizar(fim);
  atualizar(null);
  return h("div", { class: "bloco" }, h("div", { class: "rot" }, "Corte"), h("div", { class: "trim" }, ini, fim), rot);
}

function duracao(url) {
  return new Promise((ok, falha) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const limite = setTimeout(falha, 15000);
    v.onloadedmetadata = () => { clearTimeout(limite); ok(v.duration); };
    v.onerror = () => { clearTimeout(limite); falha(); };
    v.src = url;
  });
}
