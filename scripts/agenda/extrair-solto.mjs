// Aviso SOLTO: post que anuncia um show só, em texto corrido (Lost Dogs, The Homer). Função pura, testada:
//   "ALÔ SUZANO E REGIÃO / Neste sábado dia 10/10 estaremos ... no botecohelena em Suzano. O show começa às 22h"
//   "Alô galera de contagem e região, dia 17/08 ... no ironrockpub_oficial"
//   "📍DIA 19 DE NOVEMBRO 21H" (data por extenso, hora logo depois)
// Só vale data de hoje em diante em relação ao post (relato de show passado não vira show). Cidade: "Alô X",
// "Atenção X", "X e região" ou "em X"; UF: "Cidade/UF" ou "-UF" no texto, senão a da banda.
import { casaNaLegenda, horaNaLegenda } from "./extrair.mjs";
import { tituloCidade } from "./extrair-blocos.mjs";

const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "");
const ESTADOS = new Set(["Minas Gerais", "Santa Catarina", "Rio Grande do Sul", "Rio Grande do Norte", "Mato Grosso",
  "Mato Grosso do Sul", "Espírito Santo", "Bahia", "Pernambuco", "Ceará", "Paraíba", "Alagoas", "Sergipe"]);
const NAO_CIDADE = /^(galera|pessoal|povo|zona|atencao|atenção|gente|turma|amigos|todos|voces|vocês|vcs)\b/i;
const fmt = (h, m) => `${String(h).padStart(2, "0")}:${m || "00"}`;

function cidadeDoTexto(t) {
  const alo = t.match(/(?:al[ôo]|aten[çc][ãa]o)[ \t]+(?:galera|pessoal|povo)?\s*(?:de|do|da)?\s*([A-Za-zÀ-ú][A-Za-zÀ-ú ]{2,30}?)(?:\s+e\s+regi[ãa]o|\s*[,!.\n]|$)/i);
  if (alo && !NAO_CIDADE.test(alo[1].trim())) return tituloCidade(alo[1].trim());
  const em = t.match(/\bem\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+){0,3})/);
  return em && !ESTADOS.has(em[1]) ? em[1] : null;
}

// Data: "10/10" ou por extenso ("dia 19 de novembro", "30 de Outubro"). Devolve também onde ela termina no texto.
function dataDoTexto(t) {
  const dm = t.match(/\b(\d{1,2})\/(\d{1,2})(?!\/\d)/);
  if (dm) return { dia: +dm[1], mes: +dm[2], fim: dm.index + dm[0].length };
  const ext = semAcento(t).match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MESES.join("|")})\\b`, "i"));
  return ext ? { dia: +ext[1], mes: MESES.indexOf(ext[2].toLowerCase()) + 1, fim: ext.index + ext[0].length } : null;
}

// Hora. Linha com preço ("após às 22h R$40") é de ingresso, não de show. Ordem: hora colada na data
// ("NOVEMBRO 21H", "Outubro SEX 19h"), linha com o nome da banda ("Lost Dogs Pearl Jam cover 17h"), "às 22h".
function horaDoTexto(t, fimData, nome) {
  const colada = t.slice(fimData).match(/^\s*(?:[A-Za-zÀ-ú]{3}\.?\s+)?(\d{1,2})\s*[hH](\d{2})?\b/);
  if (colada && +colada[1] <= 23) return fmt(colada[1], colada[2]);
  const linhas = t.split("\n").filter((l) => !/R\$|ingresso/i.test(l));
  const daBanda = nome && linhas.find((l) => l.toLowerCase().includes(nome.toLowerCase()));
  const hb = daBanda && daBanda.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*h\b/i);
  if (hb && +hb[1] <= 23) return fmt(hb[1], hb[2]);
  // (?:^|\s) e não \b: o \b do JS não enxerga o "à" acentuado como letra
  const h = linhas.join("\n").match(/(?:^|\s)(?:[àa]s|a partir das|in[íi]cio:?|show:?)\s*(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
  return h && +h[1] <= 23 ? fmt(h[1], h[2]) : null;
}

// legenda + data do post + banda ({conta, nome, uf}) -> show ou null
export function showDoAvisoSolto(legenda, dataPost, banda) {
  const texto = String(legenda);
  const d = dataDoTexto(texto);
  if (!d) return null;
  const post = new Date(dataPost);
  if (d.mes < 1 || d.mes > 12 || d.dia < 1 || d.dia > 31) return null;
  const ano = d.mes < post.getUTCMonth() + 1 - 1 ? post.getUTCFullYear() + 1 : post.getUTCFullYear();
  const data = iso(ano, d.mes, d.dia);
  if (data < dataPost.slice(0, 10)) return null; // falando de show que já passou
  const ufTexto = texto.match(/[A-Za-zÀ-ú]\s*[/-]\s*([A-Z]{2})\b/);
  return {
    data, casa: casaNaLegenda(texto, [banda.conta]), casaNome: null, cidade: cidadeDoTexto(texto),
    uf: ufTexto ? ufTexto[1] : banda.uf || null, fechado: /evento fechado/i.test(texto), observacao: null,
    hora: horaDoTexto(texto, d.fim, banda.nome) || horaNaLegenda(texto),
  };
}
