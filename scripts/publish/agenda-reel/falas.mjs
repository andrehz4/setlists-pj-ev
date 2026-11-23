// Textos da narração do reel da agenda, com a pronúncia aprovada pelo Andre de ouvido (audição de 22/11/2026).
// O Whisper não serve de juiz de pronúncia: ouviu "o Zasko" na versão que o Andre achou perfeita.
// Origem: reels-especiais/agenda-semana/falas.mjs (prévia aprovada); regra de nome falado em scripts/agenda/redes/voz.mjs.
import { nomeFalado } from "../../agenda/redes/voz.mjs";
import { nomeDia } from "./tempos.mjs";

// Como a voz fala a cidade (na tela fica o nome oficial). Aprovado 22/11: "Ozasco".
export const CIDADE_FALADA = { Osasco: "Ozasco" };
export const cidadeFalada = (c) => CIDADE_FALADA[c] || c;

// "Na quinta" soa certo; "Quinta." solto soava estranho e "Sexta." virava "Sesta".
const DIA = { SEGUNDA: "Na segunda", "TERÇA": "Na terça", QUARTA: "Na quarta", QUINTA: "Na quinta", SEXTA: "Na sexta", "SÁBADO": "No sábado", DOMINGO: "No domingo" };
const NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze"];
const num = (x) => NUM[x] || String(x);
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0]);

export const ABERTURA = "Onde tem Pearl Jam ao vivo essa semana?";
// Pedido do Andre em 23/11: o fecho fala do acervo (a frase curta "Toda terça tem. Segue pra não perder." saiu na W48).
export const FECHO = "Toda terça tem agenda no maior acervo de Pearl Jam do Brasil. Segue para não perder.";
// "Nove shows" virava "Novos shows"; com "São" na frente saiu limpo.
export const textoMapa = (nShows, nCidades) => (nShows === 1 ? "Um show essa semana."
  : `São ${num(nShows)} shows em ${num(nCidades)} ${nCidades === 1 ? "cidade" : "cidades"}.`);

// Um dia: cidades na ordem da tela, bandas da mesma cidade juntas ("Ozasco, Lost Dogs e Pearl Jam noventa"). A casa nunca é falada.
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

// Todas as falas do reel: [{ chave, texto }] (chave = nome da cena ou a data do dia).
export function falasDoReel(shows) {
  const dias = [...new Set(shows.map((s) => s.data))];
  const nCidades = new Set(shows.map((s) => `${s.cidade}|${s.uf}`)).size;
  return [
    { chave: "Abertura", texto: ABERTURA },
    { chave: "Mapa", texto: textoMapa(shows.length, nCidades) },
    ...dias.map((d) => ({ chave: d, texto: textoDia(d, shows.filter((s) => s.data === d)) })),
    { chave: "Fecho", texto: FECHO },
  ];
}
