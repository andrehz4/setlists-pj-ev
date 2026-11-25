// Ficha de um post do Show da Semana: rascunho a partir do acervo + validação das regras do README.
import fs from "node:fs";
import path from "node:path";
import { checarPtBr } from "../../news/qualidade-ptbr.mjs";
import { lerChave, setlistFm, showsDoSite, midiaLocal } from "./acervo.mjs";

export const PASTA_FICHAS = "media/show-da-semana/fichas";
export const LIMITE_HISTORIA = 900; // cabe num slide 1080x1350 com fonte legível
export const STATUS = ["rascunho", "aprovado", "publicado"];

// Monta o rascunho: setlist e pôster do acervo; história, crédito e legenda ficam pra preencher.
export function rascunho(raiz, chave, numero) {
  const { prefixo, artista, data } = lerChave(chave);
  const id = `${prefixo}-${data}`;
  const doSite = showsDoSite(raiz).find((s) => s.id === id);
  const fm = setlistFm(raiz, artista, data);
  if (!doSite && !fm) throw new Error(`sem setlist pra ${artista} em ${data} (nem no site nem no setlist.fm)`);
  const midia = midiaLocal(raiz, id);
  const setlist = fm && fm.show.length
    ? { show: fm.show, bis: fm.bis, fonte: fm.url }
    : { show: doSite.songs, bis: [], fonte: doSite.source };
  return {
    id, numero, status: "rascunho", artista, data,
    cidade: doSite?.city || fm.cidade,
    local: doSite?.venue || fm.local,
    turne: doSite?.tour || fm?.turne || null,
    poster: { arquivo: midia.poster, credito: "", fonte: "" },
    historia: { titulo: "", texto: "", fontes: [] },
    setlist,
    destaques: [],
    legenda: "",
  };
}

const TRAVESSAO = /[—–‒―]/;

// Erros que barram (lista vazia = pode ir pro design). `paraPublicar` exige status aprovado.
export function validar(f, { paraPublicar = false } = {}) {
  const e = [];
  if (!Number.isInteger(f.numero) || f.numero < 1) e.push("numero: inteiro a partir de 1");
  if (!STATUS.includes(f.status)) e.push(`status: um de ${STATUS.join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data || "")) e.push("data: AAAA-MM-DD");
  if (!f.cidade || !f.local) e.push("cidade e local obrigatórios");
  if (!f.poster?.arquivo) e.push("poster.arquivo: sem pôster não tem capa (ingresso ou foto da noite servem)");
  if (!f.poster?.credito) e.push("poster.credito: nome do artista do pôster ou \"pôster oficial\"");
  const h = f.historia || {};
  if (!h.titulo) e.push("historia.titulo vazio");
  if (!h.texto) e.push("historia.texto vazio");
  if ((h.texto || "").length > LIMITE_HISTORIA) e.push(`historia.texto passa de ${LIMITE_HISTORIA} caracteres`);
  const fontes = h.fontes || [];
  if (!fontes.length) e.push("historia.fontes: toda afirmação precisa de fonte (url + trecho)");
  fontes.forEach((x, i) => {
    if (!/^https?:\/\//.test(x.url || "")) e.push(`historia.fontes[${i}].url inválida`);
    if (!x.trecho) e.push(`historia.fontes[${i}].trecho vazio (copie o trecho que comprova)`);
  });
  if (!f.setlist?.show?.length) e.push("setlist.show vazio");
  if (!f.setlist?.fonte) e.push("setlist.fonte vazia");
  if (!f.legenda) e.push("legenda vazia");
  const textos = [h.titulo, h.texto, f.legenda, f.poster?.credito, ...(f.destaques || [])].join("\n");
  if (TRAVESSAO.test(textos)) e.push("travessão no texto (troque por vírgula, ponto ou frase nova)");
  const pt = checarPtBr({ titulo_pt: h.titulo, corpo_pt: [h.texto, f.legenda].join("\n") });
  e.push(...pt.bloqueios.filter((b) => b !== "travessão").map((b) => `PT-BR: ${b}`));
  if (paraPublicar && f.status !== "aprovado") e.push("só publica ficha com status aprovado (aprovação do dono da página)");
  return e;
}

export function caminhoFicha(raiz, id) {
  return path.join(raiz, PASTA_FICHAS, `${id}.json`);
}

export function lerFichas(raiz) {
  const pasta = path.join(raiz, PASTA_FICHAS);
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta).filter((n) => n.endsWith(".json")).sort()
    .map((n) => ({ arquivo: n, ficha: JSON.parse(fs.readFileSync(path.join(pasta, n), "utf8")) }));
}

// Próximo número da série (o maior usado + 1).
export function proximoNumero(raiz) {
  return lerFichas(raiz).reduce((m, { ficha }) => Math.max(m, ficha.numero || 0), 0) + 1;
}
