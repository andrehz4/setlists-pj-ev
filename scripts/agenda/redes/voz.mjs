// Voz do story por banda: frases FIXAS, gravadas uma vez e guardadas em media/agenda/voz/ (o dia a dia não gasta
// crédito do ElevenLabs). Abertura = frase inteira com o nome da banda (sem emenda, que soa recortado), 5 variações
// por banda; final = 5 chamadas pra compartilhar. Banda nova: o gravador grava só o que falta. Rodízio pelo dia.
import crypto from "node:crypto";
import path from "node:path";
import { naRaiz } from "../../config.mjs";

export const DIR_VOZ = naRaiz("media/agenda/voz");
// Mesmas vozes do story diário (Bella dia par, Chris dia ímpar): as datas já gravadas por elas entram no meio.
export const VOZES = [{ nome: "Bella", id: "hpp4J3VqNfWAUOO0d1Us" }, { nome: "Chris", id: "iP95p4xoKVk53GoZ742B" }];
export const vozDoDia = (dia) => VOZES[Number(String(dia).slice(8, 10)) % 2 === 0 ? 0 : 1];
export const VOZ = VOZES[0];
export const IDIOMA = null; // sem forçar: soou brasileiro; com "pt" soou português de Portugal

// Como a voz deve falar o nome (sigla e número soletrados do jeito certo)
// Só pra voz (na tela fica o nome oficial). Decisões do Andre após ouvir os testes de 2026-10-06.
const FALADO = { "PJ 90": "Pearl Jam noventa", Blaymorphed: "Blaymorfédi" };
export const nomeFalado = (nome) => FALADO[nome] || nome;

export const ABERTURAS = [
  (b) => `Alô, fã de Pearl Jam! Vem aí a banda ${b} ao vivo!`,
  (b) => `Atenção, fã de Pearl Jam: é dia da banda ${b}!`,
  (b) => `Anota aí: tem show da banda ${b}!`,
  (b) => `Bora ouvir Pearl Jam ao vivo com a banda ${b}!`,
  (b) => `Separa a camisa de flanela, porque tem show da banda ${b}!`,
];
export const FINAIS = [
  "Compartilha com quem vai com você! E segue o Só Mais um Fã de Pearl Jam, o maior acervo da banda no Brasil.",
  "Marca aquele amigo que vai com você! A agenda completa tá no maior acervo de Pearl Jam do Brasil.",
  "Manda pra quem vai com você! Setlists, letras e a agenda inteira no Só Mais um Fã de Pearl Jam.",
  "Chama a turma pro show! E entra no maior acervo da banda no Brasil, link no perfil.",
  "Repassa pra quem canta Black a plenos pulmões! Mais shows na nossa agenda, link no perfil.",
];

// Estado do show (sem forçar o idioma, frase curta demais saía em inglês; "O show é em" resolveu).
const UF_NOME = { AC: "no Acre", AL: "em Alagoas", AP: "no Amapá", AM: "no Amazonas", BA: "na Bahia", CE: "no Ceará",
  DF: "no Distrito Federal", ES: "no Espírito Santo", GO: "em Goiás", MA: "no Maranhão", MT: "no Mato Grosso",
  MS: "no Mato Grosso do Sul", MG: "em Minas Gerais", PA: "no Pará", PB: "na Paraíba", PR: "no Paraná", PE: "em Pernambuco",
  PI: "no Piauí", RJ: "no Rio de Janeiro", RN: "no Rio Grande do Norte", RS: "no Rio Grande do Sul", RO: "em Rondônia",
  RR: "em Roraima", SC: "em Santa Catarina", SP: "em São Paulo", SE: "em Sergipe", TO: "no Tocantins" };
export const fraseEstado = (uf) => (UF_NOME[uf] ? `O show é ${UF_NOME[uf]}!` : null);
// Horário: hora cheia de baixo (20h30 vira "a partir das vinte horas"), das 16h às 23h.
const HORAS = { 16: "dezesseis", 17: "dezessete", 18: "dezoito", 19: "dezenove", 20: "vinte", 21: "vinte e uma", 22: "vinte e duas", 23: "vinte e três" };
// Sem horário no post da banda (ou fora das 16h às 23h): frase padrão, que manda a pessoa pro perfil da banda.
export const FRASE_SEM_HORA = "Confere o horário no perfil da banda!";
export const fraseHora = (hhmm) => { const h = hhmm ? +hhmm.slice(0, 2) : null; return HORAS[h] ? `E começa a partir das ${HORAS[h]} horas!` : FRASE_SEM_HORA; };

// Nome do arquivo pelo texto: frase mudou, grava de novo; frase igual, reaproveita.
export function arquivoDaFala(texto, voz = VOZ, dir = DIR_VOZ) {
  const h = crypto.createHash("sha1").update(`${voz.id}|${texto}`).digest("hex").slice(0, 10);
  return path.join(dir, `${voz.nome.toLowerCase()}-${h}.mp3`);
}

// Todas as falas que precisam existir pras bandas da lista.
export const falasNecessarias = (nomes, ufs = []) => [...nomes.flatMap((n) => ABERTURAS.map((f) => f(nomeFalado(n)))), ...FINAIS,
  ...ufs.map(fraseEstado).filter(Boolean), ...Object.keys(HORAS).map((h) => fraseHora(`${h}:00`)), FRASE_SEM_HORA];

// Falas do story de uma banda num dia: variação escolhida pelo dia (rodízio), abertura e final diferentes entre si.
export function falasDoStory(nomeBanda, dia) {
  const n = Number(String(dia).replaceAll("-", "")) || 0;
  const voz = vozDoDia(dia);
  const abertura = ABERTURAS[n % ABERTURAS.length](nomeFalado(nomeBanda));
  const final = FINAIS[(n + 1) % FINAIS.length];
  return { voz, abertura: arquivoDaFala(abertura, voz), final: arquivoDaFala(final, voz), textos: { abertura, final } };
}
