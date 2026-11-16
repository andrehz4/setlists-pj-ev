// Faixa de efeitos do reel (pancadas e coração), no tempo de cada cena (render/tempos.json).
// Só efeitos liberados no ACRCloud pelo trilha-hz (entrega-marca-registrada/entrega.json):
// pancadas golpe-1/5/7/9 (réplicas próprias) e coracao-tg (batida do Terra Gentil refeita por síntese, sem amostra).
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const SSD = "/Volumes/SSD Terra Gentil/trilha-hz";
const ARQ = {
  g1: `${SSD}/pancadas/replica/golpe-1.wav`,
  g5: `${SSD}/pancadas/replica/golpe-5.wav`,
  g7: `${SSD}/pancadas/replica/golpe-7.wav`,
  g9: `${SSD}/pancadas/replica/golpe-9.wav`,
  cora: `${SSD}/efeitos/coracao-tg/coracao-tg.wav`,
};

// [cena, segundos depois do início da cena, efeito, volume em dB, duração máxima]
// Carimbo bate em t+0,18 (stamp do cenas.mjs); card desvira em t+0,34 aprox.
const MARCAS = [
  ["c1", 0.0, "g9", -2, 2.5],      // frame zero, o 5 gigante
  ["c3", 1.0, "g1", -8, 0.8],      // card 5 desvira
  ["c3", 2.48, "g5", -6, 1.2],     // CERTA
  ["c4", 1.26, "g7", -3, 1.6],     // ESQUECE
  ["c5", 0.5, "g1", -8, 0.8],      // card 4
  ["c5", 2.68, "g5", -6, 1.2],     // CERTA
  ["c6", 4.9, "g7", -3, 1.6],      // NÃO VAI
  ["c7", 0.6, "g1", -8, 0.8],      // card 3
  ["c7", 4.3, "g5", -6, 1.2],      // CERTA
  ["c8", 1.29, "g7", -4, 1.4],     // TALVEZ
  ["c9", 0.48, "g1", -8, 0.8],     // card 2
  ["c9", 2.88, "g5", -6, 1.2],     // CERTA
  ["c10", 1.98, "g7", -3, 1.6],    // DIFÍCIL
  ["c12", 1.05, "g9", -1, 2.5],    // PORCH desvira, o maior golpe
  ["c12", 3.08, "g5", -3, 1.6],    // CERTA grande
];
// Coração: da DIFÍCIL até o Porch desvirar (suspense da Black e do mapa).
const CORACAO = { de: ["c10", 2.6], ate: ["c12", 1.0], db: -4 };

export function montarEfeitos(cenas, saida, duracao) {
  for (const f of Object.values(ARQ)) if (!fs.existsSync(f)) throw new Error(`efeito não achado (SSD montado?): ${f}`);
  const ini = (id) => cenas.find((c) => c.id === id).inicio;
  const ent = [], fil = [];
  MARCAS.forEach(([c, dt, ef, db, max], i) => {
    ent.push("-i", ARQ[ef]);
    const ms = Math.round((ini(c) + dt) * 1000);
    fil.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${max},afade=t=out:st=${max - 0.3}:d=0.3,volume=${db}dB,adelay=${ms}|${ms}[e${i}]`);
  });
  const k = MARCAS.length, a = ini(CORACAO.de[0]) + CORACAO.de[1], b = ini(CORACAO.ate[0]) + CORACAO.ate[1];
  ent.push("-stream_loop", "-1", "-i", ARQ.cora);
  const ms = Math.round(a * 1000);
  fil.push(`[${k}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${(b - a).toFixed(3)},afade=t=in:d=0.4,afade=t=out:st=${(b - a - 0.25).toFixed(3)}:d=0.25,volume=${CORACAO.db}dB,adelay=${ms}|${ms}[cora]`);
  const rot = MARCAS.map((_, i) => `[e${i}]`).join("") + "[cora]";
  fil.push(`${rot}amix=inputs=${k + 1}:duration=longest:normalize=0,apad,atrim=0:${duracao}[sfx]`);
  execFileSync("ffmpeg", ["-y", "-v", "error", ...ent, "-filter_complex", fil.join(";"), "-map", "[sfx]", "-ar", "44100", saida]);
  return saida;
}
