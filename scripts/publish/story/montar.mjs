// Monta o MP4 do story do dia: voz opcional (STORY_NARRACAO=1), render, padrão do reel opcional
// (STORY_TRANSICOES=1: abertura com clipe + transições) e mixagem da voz. Falha da voz não derruba:
// o story sai só com música e o aviso vai pro Telegram.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildStoryVideo } from "../story-video.mjs";
import { prepararNarracaoStory, mixarStory, gravarDias } from "../narracao/story.mjs";
import { saldo } from "../narracao/elevenlabs.mjs";
import { aplicarPadraoReel } from "./padrao-reel.mjs";
import { T_INTRO_END, T_CARD_DUR, T_OUTRO_DUR } from "./base.mjs";
import { trilhaPropria } from "../trilha/ligar.mjs";
import { planoStory } from "../trilha/plano.mjs";

// Dia 1 do mês grava adiantado as aberturas do mês seguinte, se sobrar folga pro reel (~3 mil créditos).
async function gravarMesAdiantado(brt) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (process.env.STORY_NARRACAO !== "1" || !apiKey || brt.getUTCDate() !== 1) return;
  try {
    const conta = await saldo({ apiKey });
    if (!conta || conta.restante > 5000) console.log(`[story] gravou ${await gravarDias(brt, 31, { apiKey })} caracteres adiantados`);
    else console.log(`[story] gravação adiantada pulada: restam ${conta.restante} créditos`);
  } catch (e) {
    console.warn(`[story] gravação adiantada falhou (segue): ${e.message}`);
  }
}

export async function montarStory({ items, track, tarjaColor, brt, outPath }) {
  await gravarMesAdiantado(brt);
  const narr = await prepararNarracaoStory(brt);
  if (narr?.aviso) console.log(`[story] ${narr.aviso}`);
  // Trilha própria (TRILHA_PROPRIA=1): golpe em cada troca de manchete; sem ela segue o rodízio antigo.
  const introDur = narr?.introDur ?? T_INTRO_END, n = Math.min(items.length, 5);
  const trocas = Array.from({ length: n }, (_, i) => introDur + i * T_CARD_DUR);
  const duracao = introDur + n * T_CARD_DUR + (narr?.outroDur ?? T_OUTRO_DUR);
  const propria = trilhaPropria({ uso: "story", semente: brt.toISOString().slice(0, 10), plano: planoStory(trocas, duracao),
    duracao, saida: path.join(os.tmpdir(), `smufdpj-trilha-${path.basename(outPath)}.m4a`) });
  if (propria) Object.assign(track, propria); // o nome vai pro log e pro aviso no Telegram
  const video = await buildStoryVideo({
    items, trackPath: track.path, tarjaColor, date: brt, outPath,
    introDur: narr?.introDur, outroDur: narr?.outroDur, audioPronto: !!track.propria,
  });
  if (process.env.STORY_TRANSICOES === "1") {
    const introDur = narr?.introDur ?? 3.0, cards = Math.min(items.length, 5);
    const r = await aplicarPadraoReel(outPath, { introDur, cards, cardDur: (video.outroInicio - introDur) / cards,
      outroInicio: video.outroInicio, date: brt, accent: tarjaColor, tmpDir: video.tmpDir });
    console.log(`[story] padrão do reel: abertura com clipe ${r.abertura ? "sim" : "não"}, ${r.transicoes} transições`);
  }
  let avisoVoz = narr?.aviso || "";
  if (narr?.falas) {
    const semVoz = path.join(video.tmpDir, "sem-voz.mp4");
    try {
      await fs.rename(outPath, semVoz);
      await mixarStory(semVoz, outPath, { falas: narr.falas, outroInicio: video.outroInicio, musicaPronta: !!track.propria });
    } catch (e) {
      console.warn(`[story] mixagem da voz falhou, segue só com música: ${e.message}`);
      await fs.rename(semVoz, outPath).catch((err) => console.warn(`[story] não restaurou o vídeo sem voz: ${err.message}`));
      avisoVoz = `story saiu SEM voz: a mixagem falhou`;
    }
  }
  if (propria) await fs.rm(propria.path, { force: true });
  console.log(`[story] MP4 gerado: ${outPath} (${video.duration.toFixed(2)}s)`);
  return { duration: video.duration, avisoVoz };
}
