// Voz do story por banda: frases FIXAS, gravadas uma vez e guardadas em media/agenda/voz/ (o dia a dia não gasta
// crédito do ElevenLabs). Abertura = frase inteira com o nome da banda (sem emenda, que soa recortado), 5 variações
// por banda; final = 5 chamadas pra compartilhar. Banda nova: o gravador grava só o que falta. Rodízio pelo dia.
import crypto from "node:crypto";
import path from "node:path";
import { naRaiz } from "../../config.mjs";

export const DIR_VOZ = naRaiz("media/agenda/voz");
export const VOZ = { nome: "Jessica", id: "cgSgspJ2msm6clMCkdW9" }; // aprovada pelo Andre no reel (2026-09-30)
export const IDIOMA = null; // sem forçar: soou brasileiro; com "pt" soou português de Portugal

// Como a voz deve falar o nome (sigla e número soletrados do jeito certo)
// Só pra voz (na tela fica o nome oficial). Decisões do Andre após ouvir os testes de 2026-10-06.
const FALADO = { "PJ 90": "Pearl Jam noventa", Blaymorphed: "Blaymorfedi" };
export const nomeFalado = (nome) => FALADO[nome] || nome;

export const ABERTURAS = [
  (b) => `Alô, fã de Pearl Jam! Hoje, a banda ${b} ao vivo!`,
  (b) => `Atenção, fã de Pearl Jam: hoje é dia de ${b}!`,
  (b) => `Anota aí: hoje tem ${b} no palco!`,
  (b) => `Hoje o dia é de Pearl Jam, com ${b}!`,
  (b) => `Separa a camisa de flanela: hoje tem ${b}!`,
];
export const FINAIS = [
  "Compartilha com quem vai com você, e bora pro show!",
  "Marca aquele amigo fã de Pearl Jam e cola no show hoje!",
  "Manda pra quem vai com você! A agenda completa tá no site.",
  "Chama a turma, e a gente se vê no show!",
  "Repassa pra quem também canta Black a plenos pulmões!",
];

// Nome do arquivo pelo texto: frase mudou, grava de novo; frase igual, reaproveita.
export function arquivoDaFala(texto, dir = DIR_VOZ) {
  const h = crypto.createHash("sha1").update(`${VOZ.id}|${texto}`).digest("hex").slice(0, 10);
  return path.join(dir, `${h}.mp3`);
}

// Todas as falas que precisam existir pras bandas da lista.
export const falasNecessarias = (nomes) => [...nomes.flatMap((n) => ABERTURAS.map((f) => f(nomeFalado(n)))), ...FINAIS];

// Falas do story de uma banda num dia: variação escolhida pelo dia (rodízio), abertura e final diferentes entre si.
export function falasDoStory(nomeBanda, dia) {
  const n = Number(String(dia).replaceAll("-", "")) || 0;
  const abertura = ABERTURAS[n % ABERTURAS.length](nomeFalado(nomeBanda));
  const final = FINAIS[(n + 1) % FINAIS.length];
  return { abertura: arquivoDaFala(abertura), final: arquivoDaFala(final), textos: { abertura, final } };
}
