// Arranque do painel de colaboradores (colaborar.html).
// Fluxo: config -> sem sessão: entrar -> pendente/bloqueado: espera -> aprovado: postar.

import { api, h, sessao } from "./api.js";
import { avatar, telaEntrar, telaPendente } from "./acesso.js";
import { telaAdmin } from "./admin.js";
import { telaEditor } from "./editor.js";
import { telaEnviado, telaMeus } from "./envios.js";

const tela = document.getElementById("tela");
const quem = document.getElementById("quem");
const abas = document.getElementById("abas");
let cfg;

function pintarTopo() {
  const s = sessao.ler();
  quem.replaceChildren(...(s?.token ? [avatar(s), h("span", {}, (s.nome || "").split(" ")[0] + (s.admin ? " · admin" : ""))] : [h("span", {}, "colaboradores")]));
}

function pintarAbas(atual) {
  const s = sessao.ler();
  const lista = [["postar", "Postar"], ["meus", "Meus envios"], ...(s?.admin ? [["admin", "Pessoas"]] : [])];
  abas.hidden = false;
  abas.replaceChildren(...lista.map(([id, nome]) =>
    h("button", { type: "button", "aria-current": id === atual ? "page" : false, onclick: () => irPara(id) }, nome)));
}

async function irPara(id, dado) {
  const s = sessao.ler();
  pintarTopo();
  if (!s?.token) {
    abas.hidden = true;
    return tela.replaceChildren(telaEntrar(cfg, () => irPara("postar")));
  }
  if (s.status !== "aprovado") {
    abas.hidden = true;
    return tela.replaceChildren(telaPendente(() => irPara("postar")));
  }
  pintarAbas(id === "enviado" ? "postar" : id);
  scrollTo(0, 0);
  if (id === "enviado") return tela.replaceChildren(telaEnviado(dado, irPara));
  if (id === "meus") return tela.replaceChildren(await telaMeus(cfg, irPara));
  if (id === "admin") return tela.replaceChildren(await telaAdmin());
  tela.replaceChildren(telaEditor(cfg, (envio) => irPara("enviado", envio)));
}

async function iniciar() {
  try {
    cfg = await api("/contrib/config");
  } catch (_) {
    tela.replaceChildren(h("div", { class: "body" },
      h("h2", { class: "title" }, "Painel ", h("em", {}, "em breve")),
      h("p", { class: "muted" }, "O painel de colaboradores ainda não está no ar. Volte daqui a pouco.")));
    return;
  }
  const s = sessao.ler();
  if (s?.token) {
    try {
      const r = await api("/contrib/eu");
      sessao.gravar({ ...s, status: r.status, admin: r.admin });
    } catch (_) { /* 401 já limpou a sessão; sem rede segue com o que tem */ }
  }
  irPara("postar");
}

iniciar();
