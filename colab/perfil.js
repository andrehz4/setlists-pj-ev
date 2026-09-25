// Cartão "Crédito dos seus posts": @ do Instagram opcional. Com @, o post sai
// "Enviado por @fulano" e o Instagram marca a pessoa; sem @, sai o nome curto.

import { api, aviso, h, sessao } from "./api.js";

function nomeCurto(nome) {
  const p = String(nome || "").trim().split(/\s+/).filter(Boolean);
  return p.length > 1 ? `${p[0]} ${p.at(-1)[0].toUpperCase()}.` : p[0] || "você";
}

export function cartaoPerfil() {
  const s = sessao.ler() || {};
  const input = h("input", { id: "p-instagram", value: s.instagram ? `@${s.instagram}` : "", placeholder: "@seu.perfil", autocomplete: "off", maxlength: "40" });
  const previa = h("p", { class: "nota" });
  const salvar = h("button", { type: "button", class: "btn small" }, "Salvar");

  const mostrar = (handle) => {
    previa.replaceChildren("Seus posts saem como: ", h("b", {}, `Enviado por ${handle ? "@" + handle : nomeCurto(s.nome)}`),
      handle ? " (o Instagram marca você)" : "");
  };

  salvar.onclick = async () => {
    salvar.disabled = true;
    try {
      const r = await api("/contrib/perfil", { method: "POST", json: { instagram: input.value } });
      sessao.gravar({ ...(sessao.ler() || {}), instagram: r.instagram });
      input.value = r.instagram ? `@${r.instagram}` : "";
      mostrar(r.instagram);
      aviso(r.instagram ? "Pronto, seus próximos posts vão marcar você." : "Crédito volta a ser o seu nome.");
    } catch (e) { aviso(e.message, "erro"); }
    salvar.disabled = false;
  };

  mostrar(s.instagram);
  return h("div", { class: "card perfil-card" },
    h("div", { class: "field" }, h("label", { for: "p-instagram" }, "Seu @ no Instagram (opcional)"),
      h("div", { class: "row" }, input, salvar)),
    previa);
}
