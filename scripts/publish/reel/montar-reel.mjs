// Monta o MP4 do reel da semana: clipe do acervo por cena, voz opcional (REEL_NARRACAO=1), abertura e
// transições com clipes (REEL_TRANSICOES=1), render e mixagem. Falha de voz ou transição não derruba.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadClips, pickClipFor, weekSeed } from "../reel-clips.mjs";
import { buildReelVideo, buildScenePlan } from "../reel-video.mjs";
import { prepararNarracao, mixarNarracao } from "../narracao/narracao.mjs";
import { aplicarTransicoes, montarAbertura, capaNaAbertura } from "./transicoes.mjs";

// Trecho de clipe do acervo pras cenas de abertura e cinéticas (rotação determinística por semana).
async function clipesPorCena(items, scenes, weekKey) {
  const clips = await loadClips();
  const clipForScene = new Map();
  const used = new Set();
  const seed = weekSeed(weekKey);
  scenes.forEach((scene, si) => {
    if (scene.kind !== "coldopen" && scene.kind !== "kinetic") return;
    const clip = pickClipFor(scene.item || items[0], clips, { used, seed, slot: si });
    if (clip) clipForScene.set(si, clip.path);
  });
  console.log(`[reel] acervo: ${clips.length} clipes, ${clipForScene.size} cenas com clipe real`);
  return clipForScene;
}

export async function montarReel({ items, track, accent, rangeLabel, weekKey, outPath }) {
  const { scenes } = buildScenePlan(items);
  const clipForScene = await clipesPorCena(items, scenes, weekKey);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-reel-"));
  const narr = await prepararNarracao(scenes, { weekKey, tmpDir }); // cada cena dura o tempo da fala
  let aberturaClipe = false;
  if (process.env.REEL_TRANSICOES === "1" && !clipForScene.has(0)) {
    const abertura = montarAbertura(tmpDir, { semente: weekKey, dur: narr?.sceneDurs?.[0] ?? scenes[0].dur });
    if (abertura) {
      clipForScene.set(0, abertura);
      aberturaClipe = true;
      console.log("[reel] abertura com clipe (sequência de trechos)");
    }
  }
  const r = await buildReelVideo({ items, trackPath: track.path, accent, rangeLabel, outPath, clipForScene, tmpDir, sceneDurs: narr?.sceneDurs });
  let avisoVoz = narr?.aviso || "";
  if (narr?.falas) {
    const semVoz = path.join(tmpDir, "sem-voz.mp4");
    try {
      await fs.rename(outPath, semVoz);
      await mixarNarracao(semVoz, outPath, { falas: narr.falas, scenes: r.sceneList });
      console.log(`[reel] narração mixada (voz ${narr.voz.nome})`);
    } catch (e) {
      console.warn(`[reel] mixagem da narração falhou, segue só com música: ${e.message}`);
      avisoVoz = `reel saiu SEM voz: a mixagem falhou (${e.message.slice(0, 120)})`;
      await fs.rename(semVoz, outPath).catch((err) => console.warn(`[reel] não restaurou o vídeo sem voz: ${err.message}`));
    }
  }
  const capaMs = aberturaClipe ? capaNaAbertura(r.sceneList[0].dur) : null;
  if (process.env.REEL_TRANSICOES === "1") {
    try {
      console.log(`[reel] transições: ${aplicarTransicoes(outPath, { scenes: r.sceneList, semente: weekKey, capaInicioS: capaMs != null ? capaMs / 1000 : null })}`);
    } catch (e) {
      console.warn(`[reel] transições falharam, segue sem: ${e.message.slice(0, 200)}`);
    }
  }
  await fs.rm(r.tmpDir, { recursive: true, force: true });
  console.log(`[reel] MP4 gerado: ${outPath} (${r.duration.toFixed(1)}s, ${r.scenes} cenas)`);
  return { clipForScene, capaMs, avisoVoz };
}
