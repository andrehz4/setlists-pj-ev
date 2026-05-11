// Baixa os 88 samples MP3 do acoustic_guitar_steel do gleitz/MusyngKite
// pra media/lib/smplr-soundfonts/acoustic_guitar_steel-mp3/
// Resolve o bloqueio de CSP (connect-src 'self') pro chord-chip toque.
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const BASE = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_guitar_steel-mp3';
const OUT = 'media/lib/smplr-soundfonts/acoustic_guitar_steel-mp3';

const NOTES_OCT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function buildList() {
  const list = [];
  // Oitava 0: só A0, Bb0, B0
  ['A0', 'Bb0', 'B0'].forEach(n => list.push(n));
  // Oitavas 1-7: todas as 12 notas
  for (let oct = 1; oct <= 7; oct++) {
    for (const n of NOTES_OCT) list.push(n + oct);
  }
  // Oitava 8: só C8
  list.push('C8');
  return list;
}

const notes = buildList();
console.log(`Total: ${notes.length} notas`);

fs.mkdirSync(OUT, { recursive: true });

let ok = 0, fail = 0, totalBytes = 0;
for (const note of notes) {
  const url = `${BASE}/${note}.mp3`;
  const file = path.join(OUT, `${note}.mp3`);
  try {
    const r = await fetch(url);
    if (!r.ok) { console.log(`  FAIL ${note}: HTTP ${r.status}`); fail++; continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(file, buf);
    totalBytes += buf.length;
    ok++;
  } catch (e) {
    console.log(`  ERR  ${note}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${ok} baixados (${(totalBytes/1024/1024).toFixed(2)} MB), ${fail} falhas`);
