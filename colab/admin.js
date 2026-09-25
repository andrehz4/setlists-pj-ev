// Só o Andre: convidar Gmail, aprovar ou bloquear quem pediu, ver envios.

import { api, aviso, h, rotuloDia } from "./api.js";

const STATUS = { pendente: ["Aguardando", "p-wait"], aprovado: ["Aprovado", "p-ok"], bloqueado: ["Bloqueado", "p-no"] };
const ENVIO = { enviado: ["Na curadoria", "p-wait"], aprovado: ["Aprovado", "p-ok"], ajustado: ["Ajustado", "p-adj"], recusado: ["Recusado", "p-no"], publicado: ["No ar", "p-ok"], cancelado: ["Cancelado", "p-off"] };

export async function telaAdmin() {
  const corpo = h("div", { class: "body" });
  const caixaMembros = h("div", { class: "card" }, h("p", { class: "muted" }, "Carregando..."));
  const caixaEnvios = h("div", { class: "list" });
  const email = h("input", { id: "a-email", type: "email", placeholder: "nome@gmail.com", autocomplete: "off" });

  async function definir(mail, status) {
    try {
      await api("/contrib/admin/membros", { method: "POST", json: { email: mail, status } });
      aviso(status === "aprovado" ? `${mail} liberado.` : `${mail} ${status}.`);
      await carregar();
    } catch (e) { aviso(e.message, "erro"); }
  }

  async function carregar() {
    try {
      const [membros, envios] = await Promise.all([api("/contrib/admin/membros"), api("/contrib/admin/submissions")]);
      const pend = membros.filter((m) => m.status === "pendente");
      caixaMembros.replaceChildren(...(membros.length ? [...pend, ...membros.filter((m) => m.status !== "pendente")].map(linha) : [h("p", { class: "muted" }, "Ninguém ainda. Convide o primeiro Gmail acima.")]));
      caixaEnvios.replaceChildren(...(envios.length ? envios.slice(0, 30).map(envio) : [h("p", { class: "muted" }, "Nenhum envio ainda.")]));
    } catch (e) { caixaMembros.replaceChildren(h("p", { class: "muted" }, e.message)); }
  }

  function linha(m) {
    const [nome, classe] = STATUS[m.status];
    const sub = m.entrou ? `${m.email} · desde ${rotuloDia(m.pedido_em)}` : `${m.email} · convidado, ainda não entrou`;
    const acoes = m.status === "pendente"
      ? h("div", { class: "acts" },
        h("button", { type: "button", class: "btn small", onclick: () => definir(m.email, "aprovado") }, "Aprovar"),
        h("button", { type: "button", class: "btn small ghost", onclick: () => definir(m.email, "bloqueado") }, "Bloquear"))
      : h("div", { class: "acts" }, h("span", { class: "pill " + classe }, nome),
        h("button", { type: "button", class: "link", onclick: () => definir(m.email, m.status === "aprovado" ? "bloqueado" : "aprovado") },
          m.status === "aprovado" ? "bloquear" : "liberar"));
    return h("div", { class: "mem" }, h("div", {}, h("b", {}, m.nome || "Sem nome ainda"), h("small", {}, sub)), acoes);
  }

  function envio(e) {
    const [nome, classe] = ENVIO[e.status] || [e.status, "p-off"];
    return h("div", { class: "card item" }, h("div", { class: "thumb" }),
      h("div", {}, h("h4", {}, e.title),
        h("div", { class: "meta" }, h("span", { class: "pill " + classe }, nome), `${e.nome || e.email} · ${rotuloDia(e.scheduled_at)} ${e.scheduled_label}`)));
  }

  const convidar = h("button", { type: "button", class: "btn small" }, "Convidar");
  convidar.onclick = () => {
    const v = email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { aviso("Confira o e-mail.", "erro"); email.focus(); return; }
    email.value = "";
    definir(v, "aprovado");
  };

  corpo.append(
    h("div", { class: "kicker" }, "Só você vê"),
    h("h2", { class: "title" }, "Quem pode ", h("em", {}, "postar")),
    h("div", { class: "field" }, h("label", { for: "a-email" }, "Convidar um Gmail"),
      h("div", { class: "row" }, email, convidar),
      h("div", { class: "count esq" }, "Convidado entra aprovado no primeiro acesso.")),
    caixaMembros,
    h("h3", { class: "sub-title" }, "Últimos envios"),
    caixaEnvios);
  await carregar();
  return corpo;
}
