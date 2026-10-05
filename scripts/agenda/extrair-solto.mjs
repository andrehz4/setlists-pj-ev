// Aviso SOLTO: post que anuncia um show só, em texto corrido (Lost Dogs, The Homer). Função pura, testada:
//   "ALÔ SUZANO E REGIÃO / Neste sábado dia 10/10 estaremos ... no botecohelena em Suzano. O show começa às 22h"
//   "Alô galera de contagem e região, dia 17/08 ... no ironrockpub_oficial"
// Só vale data de hoje em diante em relação ao post (relato de show passado não vira show). Cidade: "Alô X",
// "X e região" ou "em X"; UF: "Cidade/UF" ou "-UF" no texto, senão a da banda (quase sempre toca perto de casa).
import { casaNaLegenda, horaNaLegenda } from "./extrair.mjs";
import { tituloCidade } from "./extrair-blocos.mjs";

const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const ESTADOS = new Set(["Minas Gerais", "Santa Catarina", "Rio Grande do Sul", "Rio Grande do Norte", "Mato Grosso",
  "Mato Grosso do Sul", "Espírito Santo", "Bahia", "Pernambuco", "Ceará", "Paraíba", "Alagoas", "Sergipe"]);
const NAO_CIDADE = /^(galera|pessoal|povo|zona|atencao|atenção|gente|turma|amigos|todos|voces|vocês)\b/i;

function cidadeDoTexto(t) {
  const alo = t.match(/al[ôo]\s+(?:galera|pessoal|povo)?\s*(?:de|do|da)?\s*([A-Za-zÀ-ú][A-Za-zÀ-ú ]{2,30}?)(?:\s+e\s+regi[ãa]o|\s*[,!.\n]|$)/i);
  if (alo && !NAO_CIDADE.test(alo[1].trim())) return tituloCidade(alo[1].trim());
  const em = t.match(/\bem\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+){0,3})/);
  return em && !ESTADOS.has(em[1]) ? em[1] : null;
}

function horaDoTexto(t) {
  // (?:^|\s) e não \b: o \b do JS não enxerga o "à" acentuado como letra
  const h = t.match(/(?:^|\s)(?:[àa]s|a partir das|in[íi]cio:?|show:?)\s*(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
  return h && +h[1] <= 23 ? `${h[1].padStart(2, "0")}:${h[2] || "00"}` : null;
}

// legenda + data do post + banda ({conta, uf}) -> show ou null
export function showDoAvisoSolto(legenda, dataPost, banda) {
  const texto = String(legenda);
  const dm = texto.match(/\b(\d{1,2})\/(\d{1,2})(?!\/\d)/);
  if (!dm) return null;
  const post = new Date(dataPost);
  const mes = +dm[2], dia = +dm[1];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const ano = mes < post.getUTCMonth() + 1 - 1 ? post.getUTCFullYear() + 1 : post.getUTCFullYear();
  const data = iso(ano, mes, dia);
  if (data < dataPost.slice(0, 10)) return null; // falando de show que já passou
  const ufTexto = texto.match(/[A-Za-zÀ-ú]\s*[/-]\s*([A-Z]{2})\b/);
  return {
    data, casa: casaNaLegenda(texto, [banda.conta]), casaNome: null, cidade: cidadeDoTexto(texto),
    uf: ufTexto ? ufTexto[1] : banda.uf || null, fechado: /evento fechado/i.test(texto), observacao: null,
    hora: horaDoTexto(texto) || horaNaLegenda(texto),
  };
}
