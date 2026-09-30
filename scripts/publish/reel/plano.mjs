import { FPS, COLD_DUR, BLOCK_DUR, OUTRO_DUR } from "./base.mjs";

// ============ plano de cenas ============

// items: saida do reel-select (com .format). Devolve a lista de cenas com
// inicio/duracao, pro render e pro thumb_offset. sceneDurs (opcional, um por
// cena) vem da narracao (scripts/publish/narracao/): cada cena dura o tempo da
// fala. Sem ele, duracoes fixas de sempre.
export function buildScenePlan(items, sceneDurs = null) {
  const dur = (i, padrao) => (sceneDurs && Number.isFinite(sceneDurs[i]) ? sceneDurs[i] : padrao);
  const scenes = [{ kind: "coldopen", start: 0, dur: dur(0, COLD_DUR) }];
  let cursor = scenes[0].dur;
  items.forEach((item, i) => {
    const d = dur(i + 1, BLOCK_DUR);
    scenes.push({ kind: item.format, item, n: i + 1, start: cursor, dur: d });
    cursor += d;
  });
  const dOutro = dur(items.length + 1, OUTRO_DUR);
  scenes.push({ kind: "outro", start: cursor, dur: dOutro });
  return { scenes, totalS: cursor + dOutro, totalFrames: Math.round((cursor + dOutro) * FPS) };
}

// Momento da capa (thumb_offset): 1o bloco com a manchete ja montada.
export function thumbOffsetMsFor() {
  return Math.round((COLD_DUR + 2.5) * 1000);
}
