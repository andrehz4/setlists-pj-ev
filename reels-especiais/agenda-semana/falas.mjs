// Textos da narração do reel da agenda, com a pronúncia aprovada pelo Andre de ouvido (audição de 22/11).
// O Whisper não serve de juiz de pronúncia: ouviu "o Zasko" na versão que o Andre achou perfeita.
import { nomeFalado } from "../../scripts/agenda/redes/voz.mjs";
import { nomeDia } from "./cenas.mjs";

// Como a voz deve falar a cidade (na tela fica o nome oficial). Aprovado 22/11: "Ozasco" com idioma pt.
export const CIDADE_FALADA = { Osasco: "Ozasco" };
export const cidadeFalada = (c) => CIDADE_FALADA[c] || c;

// "Na quinta" soa certo; "Quinta." solto soava estranho e "Sexta." virava "Sesta".
const DIA = { "SEGUNDA": "Na segunda", "TERÇA": "Na terça", "QUARTA": "Na quarta", "QUINTA": "Na quinta", "SEXTA": "Na sexta", "SÁBADO": "No sábado", "DOMINGO": "No domingo" };
const NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze"];
const num = (x) => NUM[x] || String(x);
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0]);

export const ABERTURA = "Onde tem Pearl Jam ao vivo essa semana?";
export const FECHO = "Toda terça tem. Segue pra não perder.";
// "Nove shows" virava "Novos shows"; com "São" na frente saiu limpo.
export const textoMapa = (nShows, nCidades) => (nShows === 1 ? "Um show essa semana." : `São ${num(nShows)} shows em ${num(nCidades)} ${nCidades === 1 ? "cidade" : "cidades"}.`);

// Um dia: cidades na ordem da tela, bandas da mesma cidade juntas ("Ozasco, Lost Dogs e Pearl Jam noventa").
export function textoDia(data, showsDoDia) {
  const porCidade = new Map();
  for (const s of showsDoDia) {
    if (!porCidade.has(s.cidade)) porCidade.set(s.cidade, []);
    const nome = nomeFalado(s.nome);
    if (!porCidade.get(s.cidade).includes(nome)) porCidade.get(s.cidade).push(nome);
  }
  const partes = [...porCidade].map(([c, bandas]) => `${cidadeFalada(c)}, ${lista(bandas)}.`);
  return `${DIA[nomeDia(data)]}, ${partes.join(" ")}`;
}
