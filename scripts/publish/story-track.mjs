// Rotacao da trilha sonora dos stories diarios. Le pasta
// assets/story-tracks/ esperando arquivos 01-*.mp3 ate NN-*.mp3, e
// escolhe a trilha do dia via dayOfYear(now) % tracks.length.
// Roda independente do ciclo de cor da tarja (que e modulo 4), entao
// combinacao cor+track varia ate ~20 dias antes de repetir o mesmo par.

import fs from "node:fs/promises";
import path from "node:path";

const TRACKS_DIR = path.resolve("scripts/publish/assets/story-tracks");

export function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function listTracks(dir = TRACKS_DIR) {
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (e) {
    throw new Error(`story-track: pasta nao encontrada em ${dir} (${e.message})`);
  }
  return files
    .filter((f) => /^\d{2}-.*\.mp3$/i.test(f))
    .sort()
    .map((f) => ({
      index: parseInt(f.slice(0, 2), 10),
      name: f,
      path: path.join(dir, f),
    }));
}

export async function pickTrackForDate(date = new Date(), dir = TRACKS_DIR) {
  const tracks = await listTracks(dir);
  if (tracks.length === 0) {
    throw new Error(`story-track: nenhuma trilha encontrada em ${dir}`);
  }
  const idx = dayOfYear(date) % tracks.length;
  return { ...tracks[idx], cyclePos: idx, cycleLen: tracks.length };
}

// CLI util pra debug rapido: node story-track.mjs [YYYY-MM-DD]
if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}` || process.argv[1]?.endsWith("story-track.mjs")) {
  const arg = process.argv[2];
  const date = arg ? new Date(`${arg}T12:00:00Z`) : new Date();
  pickTrackForDate(date).then((t) => {
    console.log(JSON.stringify({ date: date.toISOString(), ...t }, null, 2));
  }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
