// Voz do STORY diário (aprovada em 2026-09-30): fala só na abertura (com a
// data) e no final (chamada pro site). Vozes próprias, diferentes do reel:
// Bella nos dias pares, Chris nos ímpares. Tudo fica GRAVADO no repo e é
// reaproveitado: a data leva só dia e mês, então em 2027 o "30 de setembro"
// já está pronto. Desligada sem STORY_NARRACAO=1 e ELEVENLABS_API_KEY.

import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { sintetizar, saldo } from "./elevenlabs.mjs";
import { duracaoAudio, mixarNarracao } from "./narracao.mjs";
import { naRaiz } from "../../config.mjs";

export const VOZES_STORY = [
  { nome: "Bella", id: "hpp4J3VqNfWAUOO0d1Us" }, // dia par
  { nome: "Chris", id: "iP95p4xoKVk53GoZ742B" }, // dia ímpar
];
export const FINAIS_STORY = [
  "Notícia completa no maior acervo de Pearl Jam do Brasil. Link na bio!",
  "Quer saber mais? Tá tudo no site. Link na bio!",
  "Amanhã tem mais. Segue o Só Mais um Fã de Pearl Jam!",
];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const DIR_STORY = naRaiz("media/news/instagram-stories/narracao");
const INICIO_FALA = 0.25;

// date = Date já em BRT (como o run-publish-story usa). Tudo pelo UTC dela.
export function vozDoDia(date) { return VOZES_STORY[date.getUTCDate() % 2 === 0 ? 0 : 1]; }

export function aberturaDoDia(date) {
  const d = date.getUTCDate();
  return `Hoje é ${d === 1 ? "primeiro" : d} de ${MESES[date.getUTCMonth()]}, e tem novidade do Pearl Jam.`;
}

export function finalDoDia(date) {
  const inicioAno = Date.UTC(date.getUTCFullYear(), 0, 1);
  const diaDoAno = Math.floor((date.getTime() - inicioAno) / 86400e3);
  return FINAIS_STORY[diaDoAno % FINAIS_STORY.length];
}

// Arquivo guardado: datas/<voz>-<MM-DD>-<hash>.mp3 ou finais/<voz>-<hash>.mp3.
export function arquivoStory(texto, voz, { mmdd = null, dir = DIR_STORY } = {}) {
  const h = createHash("sha1").update(`${voz.id}|${texto}`).digest("hex").slice(0, 8);
  const nome = voz.nome.toLowerCase();
  return mmdd ? path.join(dir, "datas", `${nome}-${mmdd}-${h}.mp3`) : path.join(dir, "finais", `${nome}-${h}.mp3`);
}

const mmddDe = (date) => date.toISOString().slice(5, 10);
const existe = (f) => fs.stat(f).then(() => true, () => false);

// Garante o MP3 gravado (grava só se faltar). Devolve o caminho.
async function garantir(texto, voz, arquivo, { apiKey, sintetizarImpl }) {
  if (await existe(arquivo)) return { arquivo, gastou: 0 };
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  await sintetizarImpl(texto, { vozId: voz.id, apiKey, destino: arquivo });
  return { arquivo, gastou: texto.length };
}

// Falas do story do dia. null (desligada), { aviso } (saiu sem voz) ou
// { falas, introDur, outroDur, aviso }. Intro/outro duram o tempo da fala.
export async function prepararNarracaoStory(date, { env = process.env, dir = DIR_STORY, sintetizarImpl = sintetizar,
  duracaoImpl = duracaoAudio, saldoImpl = saldo, introMin = 3.0, outroMin = 1.5 } = {}) {
  if (!(env.STORY_NARRACAO === "1" && env.ELEVENLABS_API_KEY)) return null;
  const apiKey = env.ELEVENLABS_API_KEY;
  const voz = vozDoDia(date);
  const abertura = aberturaDoDia(date), final = finalDoDia(date);
  const arqA = arquivoStory(abertura, voz, { mmdd: mmddDe(date), dir });
  const arqF = arquivoStory(final, voz, { dir });
  try {
    const falta = (await existe(arqA) ? 0 : abertura.length) + (await existe(arqF) ? 0 : final.length);
    const conta = falta ? await saldoImpl({ apiKey }) : null;
    if (conta && conta.restante < falta) return { aviso: `story saiu SEM voz: faltou crédito (precisa ${falta}, restam ${conta.restante})` };
    await garantir(abertura, voz, arqA, { apiKey, sintetizarImpl });
    await garantir(final, voz, arqF, { apiKey, sintetizarImpl });
    const dA = duracaoImpl(arqA), dF = duracaoImpl(arqF);
    return {
      falas: [{ sceneIndex: 0, texto: abertura, arquivo: arqA, dur: dA }, { sceneIndex: 1, texto: final, arquivo: arqF, dur: dF }],
      introDur: Math.max(introMin, INICIO_FALA + dA + 0.4), outroDur: Math.max(outroMin, INICIO_FALA + dF + 0.5),
      aviso: `voz do story: ${voz.nome}${falta ? ` · gravou ${falta} caracteres` : " · áudio já gravado"}`,
    };
  } catch (e) {
    return { aviso: `story saiu SEM voz: ${e.message.slice(0, 120)}` };
  }
}

// Mistura as 2 falas no MP4 do story (abertura em 0 s, final em outroInicio).
export function mixarStory(videoIn, videoOut, { falas, outroInicio }) {
  return mixarNarracao(videoIn, videoOut, { falas, scenes: [{ start: 0 }, { start: outroInicio }] });
}

// Grava as aberturas de N dias a partir de `desde` (e os finais que faltarem).
// Usado agora (outubro e novembro) e todo dia 1 pelo run-publish-story.
export async function gravarDias(desde, dias, { apiKey, dir = DIR_STORY, sintetizarImpl = sintetizar, log = console.log } = {}) {
  let gastou = 0;
  for (const voz of VOZES_STORY) for (const f of FINAIS_STORY) gastou += (await garantir(f, voz, arquivoStory(f, voz, { dir }), { apiKey, sintetizarImpl })).gastou;
  for (let i = 0; i < dias; i++) {
    const d = new Date(desde.getTime() + i * 86400e3);
    const voz = vozDoDia(d), texto = aberturaDoDia(d);
    const r = await garantir(texto, voz, arquivoStory(texto, voz, { mmdd: mmddDe(d), dir }), { apiKey, sintetizarImpl });
    if (r.gastou) log(`[story-voz] ${mmddDe(d)} ${voz.nome}: ${texto}`);
    gastou += r.gastou;
  }
  return gastou;
}
