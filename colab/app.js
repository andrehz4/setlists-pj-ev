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

// Ordem das telas pra saber o lado da transição (vai = da direita, volta = da esquerda).
const ORDEM = ["entrar", "pendente", "postar", "enviado", "meus", "admin"];
let atual = null;

// Troca a tela com View Transition quando dá; sem suporte ou com menos movimento, troca seco.
function mostrar(id, no) {
  document.documentElement.dataset.dir = ORDEM.indexOf(id) < ORDEM.indexOf(atual) ? "volta" : "vai";
  const primeira = atual === null;
  atual = id;
  const trocar = () => { tela.replaceChildren(no); scrollTo(0, 0); };
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (primeira || calmo || !document.startViewTransition) return trocar();
  document.startViewTransition(trocar);
}

async function irPara(id, dado) {
  const s = sessao.ler();
  pintarTopo();
  if (!s?.token) {
    abas.hidden = true;
    return mostrar("entrar", telaEntrar(cfg, () => irPara("postar")));
  }
  if (s.status !== "aprovado") {
    abas.hidden = true;
    return mostrar("pendente", telaPendente(() => irPara("postar")));
  }
  pintarAbas(id === "enviado" ? "postar" : id);
  if (id === "enviado") return mostrar(id, telaEnviado(dado, irPara));
  if (id === "meus") return mostrar(id, await telaMeus(cfg, irPara));
  if (id === "admin") return mostrar(id, await telaAdmin());
  mostrar("postar", telaEditor(cfg, (envio) => irPara("enviado", envio)));
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
      sessao.gravar({ ...s, status: r.status, admin: r.admin, instagram: r.instagram });
    } catch (_) { /* 401 já limpou a sessão; sem rede segue com o que tem */ }
  }
  irPara("postar");
}

iniciar();
