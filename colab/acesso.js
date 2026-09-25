// Entrar com o Google (botão oficial) e tela de "aguardando aprovação".

import { api, aviso, h, sessao } from "./api.js";

let gisCarregado;
function carregarGoogle() {
  gisCarregado ||= new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = ok;
    s.onerror = () => falha(new Error("Não carregou o botão do Google. Recarregue a página."));
    document.head.append(s);
  });
  return gisCarregado;
}

export function telaEntrar(cfg, aoEntrar) {
  const alvo = h("div", { class: "gbtn-alvo" });
  const erro = h("p", { class: "muted erro", hidden: true });
  carregarGoogle().then(() => {
    window.google.accounts.id.initialize({
      client_id: cfg.google_client_id,
      callback: async ({ credential }) => {
        try {
          const r = await api("/contrib/entrar", { method: "POST", json: { credential } });
          sessao.gravar(r);
          aoEntrar();
        } catch (e) {
          erro.textContent = e.message;
          erro.hidden = false;
        }
      },
    });
    window.google.accounts.id.renderButton(alvo, { theme: "filled_black", size: "large", shape: "pill", text: "continue_with", locale: "pt-BR", width: 300 });
  }).catch((e) => { erro.textContent = e.message; erro.hidden = false; });

  return h("div", { class: "body" },
    h("div", { class: "kicker" }, "Acesso por convite"),
    h("h2", { class: "title" }, "Poste com a ", h("em", {}, "gente")),
    h("p", { class: "muted" }, "O painel é fechado. Entre com o seu Gmail e o Andre libera o acesso. Se você já foi convidado, entra direto."),
    alvo,
    erro,
    h("p", { class: "muted pe" }, "O Gmail serve só pra liberar o acesso. Ele não aparece em nenhum post."));
}

export function telaPendente(aoAprovar) {
  const s = sessao.ler() || {};
  const bloqueado = s.status === "bloqueado";
  const verificar = h("button", { type: "button", class: "btn ghost" }, "Verificar de novo");
  verificar.onclick = async () => {
    try {
      const r = await api("/contrib/eu");
      sessao.gravar({ ...s, status: r.status, admin: r.admin });
      if (r.status === "aprovado") aoAprovar();
      else aviso(r.status === "bloqueado" ? "Acesso bloqueado." : "Ainda aguardando aprovação.");
    } catch (e) { aviso(e.message, "erro"); }
  };
  const sair = h("button", { type: "button", class: "link", onclick: () => { sessao.sair(); location.reload(); } }, "Entrar com outra conta");
  return h("div", { class: "body" },
    h("div", { class: "card" },
      h("div", { class: "perfil" }, avatar(s, 40), h("div", {}, h("b", {}, s.nome || "Você"))),
      h("span", { class: "pill " + (bloqueado ? "p-no" : "p-wait") }, bloqueado ? "Acesso bloqueado" : "Aguardando aprovação"),
      h("p", { class: "muted" }, bloqueado
        ? "Esse acesso foi bloqueado. Se acha que foi engano, fale com o Andre no Instagram @smufdpj."
        : "Pedido recebido. Quando o Andre aprovar, você entra direto na tela de postar. Pode fechar e voltar depois.")),
    bloqueado ? null : verificar,
    sair);
}

export function avatar(s, tam = 26) {
  const iniciais = (s?.nome || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return s?.avatar
    ? h("img", { class: "avatar", src: s.avatar, alt: "", width: tam, height: tam, referrerpolicy: "no-referrer" })
    : h("span", { class: "avatar", style: `width:${tam}px;height:${tam}px` }, iniciais);
}
