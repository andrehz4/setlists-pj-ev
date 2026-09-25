// Conversa com o backend (/contrib) e utilitários de tela do painel de colaboradores.
// Módulo apartado (regra 0): nada aqui é usado pelo site principal.

const LOCAL = ["localhost", "127.0.0.1"].includes(globalThis.location?.hostname);
// Em localhost fala com a API falsa de colab/dev/mock-api.mjs.
export const API = LOCAL ? "http://127.0.0.1:8799" : "https://perpetual-energy-production-1a69.up.railway.app";
const CHAVE = "contrib_sessao";

export const sessao = {
  ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (_) { return null; }
  },
  gravar(s) {
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (_) { /* sem storage: vale só nesta aba */ }
  },
  sair() {
    try { localStorage.removeItem(CHAVE); } catch (_) { /* nada a limpar */ }
  },
};

export async function api(path, { method = "GET", json, body, headers = {} } = {}) {
  const s = sessao.ler();
  const h = { ...headers };
  if (s?.token) h.Authorization = "Bearer " + s.token;
  if (json !== undefined) {
    h["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  let resp;
  try {
    resp = await fetch(API + path, { method, headers: h, body });
  } catch (_) {
    throw new Error("Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
  let data = null;
  try { data = await resp.json(); } catch (_) { /* resposta sem corpo */ }
  if (resp.status === 401 && s?.token) sessao.sair();
  if (!resp.ok) {
    const msg = typeof data?.detail === "string" ? data.detail : "Algo deu errado. Tente de novo.";
    throw Object.assign(new Error(msg), { status: resp.status });
  }
  return data;
}

// h("div", { class: "x", onclick: fn }, "texto", filho) -> elemento. Texto sempre via textContent.
export function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k in el && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

let timerAviso;
export function aviso(msg, tipo = "ok") {
  let box = document.getElementById("aviso");
  if (!box) {
    box = h("div", { id: "aviso", role: "status", "aria-live": "polite" });
    document.body.append(box);
  }
  box.className = "aviso " + tipo;
  box.textContent = msg;
  box.hidden = false;
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => { box.hidden = true; }, 5000);
}

// Próximo :30 em horário de Brasília (só pra mostrar; quem decide é o servidor).
export function proximoHorario(agora = new Date()) {
  const d = new Date(agora);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(d.getUTCHours() + 1, 30);
  return rotuloHora(d);
}

export function rotuloHora(data) {
  const brt = new Date(new Date(data).getTime() - 3 * 3600 * 1000);
  return `${brt.getUTCHours()}h${String(brt.getUTCMinutes()).padStart(2, "0")}`;
}

export function rotuloDia(data) {
  const d = new Date(data);
  const hoje = new Date();
  const ontem = new Date(hoje.getTime() - 86400000);
  const mesmo = (a, b) => a.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    === b.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  if (mesmo(d, hoje)) return "hoje";
  if (mesmo(d, ontem)) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}
