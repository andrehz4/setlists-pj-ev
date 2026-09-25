// Tela principal: postar. Regras de ouro fixas no topo, mídia, texto, aceite e envio.

import { api, aviso, h, proximoHorario } from "./api.js";
import { seletorFotos, seletorVideo } from "./midia.js";
import { enviarArquivo } from "./upload.js";

export const REGRAS = [
  ["Sem música", "Nada de som de show, disco ou rádio no fundo. O Instagram derruba o post e pode banir a conta. A sua voz pode e deve aparecer."],
  ["Só Pearl Jam e Eddie, e só o que é seu", "Foto ou vídeo que você fez, ou que você tem direito de usar."],
  ["Respeito e verdade", "Sem ofensa, sem boato, sem link nem golpe. Curiosidade tem que ser fato."],
];

function faixaRegras() {
  return h("details", { class: "gold" },
    h("summary", {}, h("span", { class: "gl" }, "Regras de ouro"),
      h("span", { class: "gi" }, h("b", {}, "1"), " sem música ", h("b", {}, "2"), " só PJ e o que é seu ", h("b", {}, "3"), " respeito e verdade")),
    h("div", { class: "rules" }, REGRAS.map(([t, d], i) =>
      h("div", { class: "rule" }, h("div", { class: "n" }, String(i + 1)), h("div", {}, h("h3", {}, t), h("p", {}, d))))));
}

export function telaEditor(cfg, aoEnviar) {
  const estado = { tipo: cfg.video_enabled ? "video" : "foto", fotos: [], video: null, trim: null, legendas: [], estilo: "palavra" };
  const titulo = h("input", { id: "c-titulo", maxlength: "120", placeholder: "Ex: O Pearl Jam antes de ser Pearl Jam" });
  const texto = h("textarea", { id: "c-texto", rows: "4", maxlength: "5000", placeholder: "Conte a história, a curiosidade ou o contexto da foto." });
  const conta = h("div", { class: "count" });
  const aceite = h("input", { type: "checkbox", id: "c-aceite" });
  const enviar = h("button", { type: "button", class: "btn", disabled: true }, "Enviar pra curadoria");
  const hora = h("b", {}, proximoHorario());
  const progresso = h("div", { class: "progresso", hidden: true }, h("span", {}));
  const zonaMidia = h("div", {});

  const pronto = () => {
    const temMidia = estado.tipo === "foto" ? estado.fotos.length > 0 : !!estado.video;
    return temMidia && titulo.value.trim().length >= 3 && texto.value.trim().length >= 20 && aceite.checked;
  };
  const aoMudar = () => {
    conta.textContent = `${texto.value.length} / 5000`;
    hora.textContent = proximoHorario();
    enviar.disabled = !pronto();
  };
  [titulo, texto].forEach((c) => c.addEventListener("input", aoMudar));
  aceite.onchange = aoMudar;

  const trocarTipo = (tipo) => {
    estado.tipo = tipo;
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === tipo)));
    zonaMidia.replaceChildren(tipo === "foto" ? seletorFotos(estado, cfg, aoMudar) : seletorVideo(estado, cfg, aoMudar));
    aoMudar();
  };
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Tipo de post" },
    h("button", { type: "button", "data-k": "video", disabled: !cfg.video_enabled, onclick: () => trocarTipo("video") }, "Vídeo"),
    h("button", { type: "button", "data-k": "foto", onclick: () => trocarTipo("foto") }, "Fotos"));

  enviar.onclick = async () => {
    if (!pronto()) return;
    enviar.disabled = true;
    enviar.textContent = "Enviando...";
    progresso.hidden = false;
    try {
      const arquivos = estado.tipo === "foto" ? estado.fotos.map((f) => f.arquivo) : [estado.video.arquivo];
      const keys = [];
      for (const [i, arq] of arquivos.entries()) {
        keys.push(await enviarArquivo(arq, (p) => { progresso.firstChild.style.width = `${((i + p) / arquivos.length) * 100}%`; }));
      }
      const corpo = { title: titulo.value.trim(), body: texto.value.trim(), media_keys: keys, agreed_rules: true };
      if (estado.tipo === "video") {
        corpo.video = {
          trim_start: estado.trim[0], trim_end: estado.trim[1], estilo: estado.estilo,
          legendas: estado.legendas.filter((t) => t.text.trim()).map((t) => ({ start: t.start, end: t.end, text: t.text.trim() })),
        };
      }
      const envio = await api("/contrib/submissions", { method: "POST", json: corpo });
      aoEnviar(envio);
    } catch (e) {
      aviso(e.message, "erro");
      enviar.textContent = "Enviar pra curadoria";
      progresso.hidden = true;
      aoMudar();
    }
  };

  trocarTipo(estado.tipo);
  return h("div", { class: "body" },
    faixaRegras(),
    seg,
    zonaMidia,
    h("div", { class: "field" }, h("label", { for: "c-titulo" }, "Título"), titulo),
    h("div", { class: "field" }, h("label", { for: "c-texto" }, "Texto do post"), texto, conta),
    h("div", { class: "when" }, h("span", {}, "Se enviar agora, vai ao ar às"), hora),
    h("label", { class: "agree" }, aceite, " Meu post segue as três regras de ouro."),
    progresso,
    enviar);
}
