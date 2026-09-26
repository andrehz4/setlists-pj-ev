// Depois de enviar e "Meus envios": status, horário, motivo de ajuste ou recusa, cancelar.

import { api, aviso, h, rotuloDia, rotuloHora } from "./api.js";
import { cartaoPerfil } from "./perfil.js";

const STATUS = {
  enviado: ["Na curadoria", "p-wait"],
  aprovado: ["Aprovado", "p-ok"],
  ajustado: ["Ajustado", "p-adj"],
  recusado: ["Recusado", "p-no"],
  publicado: ["No ar", "p-ok"],
  cancelado: ["Cancelado", "p-off"],
};

export function telaEnviado(envio, irPara) {
  const cancelar = h("button", { type: "button", class: "btn ghost perigo" }, "Cancelar este envio");
  cancelar.onclick = async () => {
    if (cancelar.dataset.confirma !== "1") {
      cancelar.dataset.confirma = "1";
      cancelar.textContent = "Toque de novo pra confirmar";
      return;
    }
    try {
      await api(`/contrib/submissions/${envio.id}`, { method: "DELETE" });
      aviso("Envio cancelado. O horário ficou livre.");
      irPara("meus");
    } catch (e) { aviso(e.message, "erro"); }
  };
  return h("div", { class: "body" },
    h("div", { class: "kicker" }, "Recebido"),
    h("h2", { class: "title" }, "Vai ao ar às ", h("em", {}, envio.scheduled_label)),
    h("p", { class: "muted" }, "A curadoria confere as regras, revisa o português e pode ajustar o texto. Se mudar alguma coisa, você vê em Meus envios."),
    h("ol", { class: "tl" },
      passo("done", "Enviado", "arquivo e texto recebidos", rotuloHora(envio.created_at)),
      passo("now", "Curadoria", "regras de ouro, fatos, português", "antes das " + envio.scheduled_label),
      passo("", "No ar", "site e Instagram @smufdpj, com o seu crédito", envio.scheduled_label)),
    h("div", { class: "pilha" },
      h("button", { type: "button", class: "btn", onclick: () => irPara("postar") }, "Fazer outro post"),
      cancelar));
}

function passo(classe, titulo, desc, quando) {
  return h("li", { class: classe }, h("span", { class: "dot" }), h("div", {}, h("b", {}, titulo), h("small", {}, desc)), h("time", {}, quando));
}

export async function telaMeus(cfg, irPara) {
  const corpo = h("div", { class: "body" }, h("p", { class: "muted" }, "Carregando..."));
  let lista;
  try {
    lista = await api("/contrib/submissions/mine");
  } catch (e) {
    corpo.replaceChildren(h("p", { class: "muted" }, e.message));
    return corpo;
  }
  // Mesma regra do backend (repo.count_since): cancelado não gasta a vaga do dia.
  const hoje = lista.filter((e) => e.status !== "cancelado" && rotuloDia(e.created_at) === "hoje").length;
  const cota = h("div", { class: "quota" }, "hoje ",
    Array.from({ length: cfg.daily_limit }, (_, i) => h("i", { class: i < hoje ? "on" : "" })),
    ` ${Math.min(hoje, cfg.daily_limit)} de ${cfg.daily_limit}`);
  corpo.replaceChildren(
    h("div", { class: "topo" }, h("h2", { class: "title" }, "Meus envios"), cota),
    cartaoPerfil(),
    lista.length ? h("div", { class: "list" }, lista.map(item)) : h("p", { class: "muted" }, "Você ainda não enviou nada. Bora pro primeiro post?"),
  );
  return corpo;
}

function item(e) {
  const [nome, classe] = STATUS[e.status] || [e.status, "p-off"];
  const capa = e.media[0]?.url;
  const ehVideo = /\.(mp4|mov)$/.test(e.media[0]?.key || "");
  return h("div", { class: "card item" },
    capa && !ehVideo
      ? h("img", { class: "thumb", src: capa, alt: "", loading: "lazy", onerror: (ev) => ev.target.replaceWith(h("div", { class: "thumb" })) })
      : h("div", { class: "thumb" + (ehVideo ? " is-video" : "") }),
    h("div", {},
      h("h4", {}, e.title),
      h("div", { class: "meta" }, h("span", { class: "pill " + classe }, nome), `${rotuloDia(e.scheduled_at)} às ${e.scheduled_label}`),
      e.reason ? h("p", { class: "why" + (e.status === "ajustado" ? " adj" : "") }, e.reason) : null));
}
