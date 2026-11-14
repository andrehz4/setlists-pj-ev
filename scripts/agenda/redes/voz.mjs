// Voz do story por banda: frases FIXAS, gravadas uma vez e guardadas em media/agenda/voz/ (o dia a dia não gasta
// crédito do ElevenLabs). Abertura = frase inteira com o nome da banda (sem emenda, que soa recortado), 24 variações
// por banda; final = 39 chamadas pra compartilhar. Banda nova: o gravador grava só o que falta. Rodízio pelo dia.
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
  // 7 novas (14/11/2026): mais variação pra banda que toca toda semana. Fã nunca no começo (a voz lê Fá).
  (b) => `Hoje tem Pearl Jam ao vivo na voz da banda ${b}!`,
  (b) => `Prepara a garganta, que hoje tem show da banda ${b}!`,
  (b) => `Liga o radar, fã de Pearl Jam: hoje tem a banda ${b} no palco!`,
  (b) => `Procurando programa pra hoje? Tem show da banda ${b}!`,
  (b) => `Hoje é dia de cantar Alive junto com a banda ${b}!`,
  (b) => `Aumenta o som, que a banda ${b} sobe no palco hoje!`,
  (b) => `Chama a galera: hoje tem Pearl Jam com a banda ${b}!`,
  // mais 6 (14/11/2026, chave reserva2): 18 por banda
  (b) => `Hoje a noite é de Pearl Jam com a banda ${b}!`,
  (b) => `Garante seu lugar: hoje tem show da banda ${b}!`,
  (b) => `Quem é fã de Pearl Jam já sabe: hoje tem a banda ${b}!`,
  (b) => `Hoje o palco é da banda ${b}, tocando Pearl Jam!`,
  (b) => `Afina a voz para o refrão: hoje tem a banda ${b} ao vivo!`,
  (b) => `Já pode ir aquecendo, que hoje tem a banda ${b} no palco!`,
  // mais 6 (14/11/2026, 2a leva da reserva2): 24 por banda
  (b) => `Programa garantido: hoje tem a banda ${b} tocando Pearl Jam!`,
  (b) => `Vai ter Pearl Jam no volume máximo com a banda ${b} hoje!`,
  (b) => `Olha só quem toca hoje: a banda ${b}!`,
  (b) => `Atenção, galera: hoje é dia de show da banda ${b}!`,
  (b) => `Hoje a trilha sonora é Pearl Jam, com a banda ${b} ao vivo!`,
  (b) => `Bora para o show? Hoje tem a banda ${b} tocando Pearl Jam!`,
];
export const FINAIS = [
  "Compartilha com quem vai com você! E segue o Só Mais um Fã de Pearl Jam, o maior acervo da banda no Brasil.",
  "Marca aquele amigo que vai com você! A agenda completa tá no maior acervo de Pearl Jam do Brasil.",
  "Manda pra quem vai com você! Setlists, letras e a agenda inteira no Só Mais um Fã de Pearl Jam.",
  "Chama a turma para o show! E entra no maior acervo da banda no Brasil, link no perfil.",
  "Repassa pra quem canta Black a plenos pulmões! Mais shows na nossa agenda, link no perfil.",
  // 10 novas (14/11/2026); até ~105 caracteres, senão passa da janela do final (6,5 s)
  "Compartilha com a turma do show! E segue o Só Mais um Fã de Pearl Jam pra não perder a próxima.",
  "Manda esse vídeo pra quem vai com você! A agenda completa tá no link do perfil.",
  "Marca quem vai cantar junto com você! E segue a gente pra saber de todos os shows.",
  "Passa pra frente pra quem curte Pearl Jam! A agenda inteira tá no Só Mais um Fã de Pearl Jam.",
  "Repassa pra quem coleciona os discos! Setlists, letras e shows no maior acervo de Pearl Jam do Brasil.",
  "Chama quem vai de carona com você! Mais shows na nossa agenda, link no perfil.",
  "Compartilha e apoia as bandas cover! A agenda completa tá no Só Mais um Fã de Pearl Jam.", // "cena cover" saía "Sela Cover" (whisper, 14/11)
  "Manda pra quem nunca perde um show! E segue o maior acervo de Pearl Jam do Brasil.",
  "Marca o amigo que sabe todas as letras! Mais datas na agenda, link no perfil.",
  "Divulga pra galera e apoia quem toca Pearl Jam por aqui! Segue a gente pra ver a agenda inteira.",
  // mais 10 (14/11/2026, chave reserva2): 25 finais
  "Compartilha com quem vai dividir a grade com você! E segue o Só Mais um Fã de Pearl Jam.",
  "Marca quem tá sempre na primeira fila! A agenda completa tá no link do perfil.",
  "Avisa a turma do grupo! Mais shows de Pearl Jam pelo Brasil na nossa agenda.",
  "Repassa pra quem ama Pearl Jam! E segue a gente pra receber a agenda toda semana.",
  "Chama quem canta Alive mais alto que todo mundo! Mais datas no link do perfil.",
  "Compartilha esse story e ajuda a lotar o show! A agenda inteira tá no link do perfil.",
  "Marca quem vai com você e não esquece de seguir o Só Mais um Fã de Pearl Jam!",
  "Manda pra quem tá precisando de um show! Setlists, letras e agenda no link do perfil.",
  "Divide com quem vai de primeira viagem! O maior acervo de Pearl Jam do Brasil tá no link do perfil.",
  "Chama quem não perde um show de Pearl Jam! Segue o Só Mais um Fã de Pearl Jam pra saber de tudo.",
  // mais 14 (14/11/2026, 2a leva da reserva2): 39 finais
  "Marca quem divide o fone com você! Mais shows na agenda, link no perfil.",
  "Compartilha com quem te apresentou o Pearl Jam! A agenda completa tá no link do perfil.",
  "Manda pra turma do rock! E segue o Só Mais um Fã de Pearl Jam pra saber de todos os shows.",
  "Repassa esse vídeo e chama a galera! Toda semana tem show novo na nossa agenda.",
  "Marca quem vai gritar o refrão com você! A agenda inteira tá no link do perfil.",
  "Compartilha e chama a turma! Setlists, letras e agenda no maior acervo de Pearl Jam do Brasil.",
  "Manda pra quem tá com saudade de um show de Pearl Jam! A agenda completa tá no link do perfil.",
  "Marca quem vai cantar até ficar sem voz! E segue a gente pra não perder a próxima data.",
  "Passa adiante e fortalece quem toca Pearl Jam por aqui! Agenda no link do perfil.",
  "Chama o amigo que conhece todos os discos! Mais shows na nossa agenda, link no perfil.",
  "Compartilha com quem vai ficar na grade com você! E segue o Só Mais um Fã de Pearl Jam.",
  "Manda pra galera do grupo! A agenda de shows de Pearl Jam pelo Brasil tá no link do perfil.",
  "Repassa pra quem vive de Pearl Jam! Segue a gente pra receber a agenda toda semana.",
  "Marca a pessoa que vai de camisa de flanela! Mais shows no link do perfil.",
];

// Estado do show (sem forçar o idioma, frase curta demais saía em inglês; "O show é em" resolveu).
const UF_NOME = { AC: "no Acre", AL: "em Alagoas", AP: "no Amapá", AM: "no Amazonas", BA: "na Bahia", CE: "no Ceará",
  DF: "no Distrito Federal", ES: "no Espírito Santo", GO: "em Goiás", MA: "no Maranhão", MT: "no Mato Grosso",
  MS: "no Mato Grosso do Sul", MG: "em Minas Gerais", PA: "no Pará", PB: "na Paraíba", PR: "no Paraná", PE: "em Pernambuco",
  PI: "no Piauí", RJ: "no Rio de Janeiro", RN: "no Rio Grande do Norte", RS: "no Rio Grande do Sul", RO: "em Rondônia",
  RR: "em Roraima", SC: "em Santa Catarina", SP: "em São Paulo", SE: "em Sergipe", TO: "no Tocantins" };
// nome do estado sem a preposição ("SP" -> "São Paulo"), pros layouts que escrevem o estado na tela
export const ufComPreposicao = (uf) => UF_NOME[uf] || `em ${uf}`;
export const nomeUf = (uf) => (UF_NOME[uf] ? UF_NOME[uf].replace(/^(no|na|em) /, "") : uf);
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

// Falas do story de uma banda num dia: variação escolhida pelo dia (rodízio) mais k (ordem da banda no dia), pra
// bandas do mesmo dia não abrirem nem fecharem com a mesma frase.
export function falasDoStory(nomeBanda, dia, k = 0) {
  const n = (Number(String(dia).replaceAll("-", "")) || 0) + k;
  const voz = vozDoDia(dia);
  const abertura = ABERTURAS[n % ABERTURAS.length](nomeFalado(nomeBanda));
  const final = FINAIS[(n + 1) % FINAIS.length];
  return { voz, abertura: arquivoDaFala(abertura, voz), final: arquivoDaFala(final, voz), textos: { abertura, final } };
}
