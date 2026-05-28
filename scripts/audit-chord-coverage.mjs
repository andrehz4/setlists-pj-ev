// Auditoria de cobertura de acordes em media/tabs/cifras-multi/.
// Compara acordes usados no content (ChordPro) vs acordes cadastrados em
// instruments.{violao,ukulele,piano}.chords. Lista faltantes consolidados.
//
// Uso: node scripts/audit-chord-coverage.mjs
//      node scripts/audit-chord-coverage.mjs --csv > faltantes.csv

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'media/tabs/cifras-multi';
const INSTS = ['violao', 'ukulele', 'piano'];
const asCsv = process.argv.includes('--csv');
const showPerSong = process.argv.includes('--per-song');

const files = readdirSync(DIR).filter(f => f.endsWith('.json'));

// Conta quantas vezes cada acorde aparece faltante em cada instrumento
// (chave: "acorde|instrumento" -> count). E em quais musicas.
const missingCounts = {};
const missingSongs = {};
let totalSongs = 0;
let songsWithIssues = 0;
const perSongDetail = [];

const stripChord = (raw) => {
  // Remove markers tipo {section: X}, comentarios, etc. Mantem so o acorde puro.
  // ChordPro inline tem [Chord] ou [N.C.] etc.
  return String(raw).trim();
};

const extractChordsFromContent = (content) => {
  if (!content) return new Set();
  const re = /\[([^\]]+)\]/g;
  const found = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    const raw = stripChord(m[1]);
    // Pula tokens que nao sao acordes (section: X, comment, etc).
    if (/^(section|comment|sof|eof|title|artist|key|bpm|c\b):/i.test(raw)) continue;
    if (raw === '' || raw === 'N.C.' || raw === 'NC') continue;
    found.add(raw);
  }
  return found;
};

for (const file of files) {
  totalSongs++;
  let data;
  try {
    data = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch (err) {
    console.error(`[ERR] ${file}: ${err.message}`);
    continue;
  }
  const content = data.content || '';
  const usedChords = extractChordsFromContent(content);
  if (usedChords.size === 0) continue;

  const perInstMissing = { violao: [], ukulele: [], piano: [] };
  let anyMissing = false;

  for (const inst of INSTS) {
    const cadastrados = (data.instruments && data.instruments[inst] && data.instruments[inst].chords) || {};
    const cadKeys = new Set(Object.keys(cadastrados));
    for (const c of usedChords) {
      if (!cadKeys.has(c)) {
        perInstMissing[inst].push(c);
        const k = `${c}|${inst}`;
        missingCounts[k] = (missingCounts[k] || 0) + 1;
        if (!missingSongs[k]) missingSongs[k] = [];
        missingSongs[k].push(file.replace('.json', ''));
        anyMissing = true;
      }
    }
  }

  if (anyMissing) songsWithIssues++;
  if (showPerSong && anyMissing) {
    perSongDetail.push({ file: file.replace('.json', ''), perInstMissing, usedTotal: usedChords.size });
  }

  // Tambem checa alt_versions
  if (Array.isArray(data.alt_versions)) {
    for (const alt of data.alt_versions) {
      const altUsed = extractChordsFromContent(alt.content || '');
      for (const inst of INSTS) {
        const cadAlt = (alt.instruments && alt.instruments[inst] && alt.instruments[inst].chords) || {};
        const fallback = (data.instruments && data.instruments[inst] && data.instruments[inst].chords) || {};
        const allCad = new Set([...Object.keys(cadAlt), ...Object.keys(fallback)]);
        for (const c of altUsed) {
          if (!allCad.has(c)) {
            const k = `${c}|${inst}`;
            missingCounts[k] = (missingCounts[k] || 0) + 1;
            if (!missingSongs[k]) missingSongs[k] = [];
            missingSongs[k].push(`${file.replace('.json', '')} (alt:${alt.id})`);
          }
        }
      }
    }
  }
}

// === RELATORIO ===

if (asCsv) {
  console.log('acorde,instrumento,vezes_faltante,musicas');
  const sorted = Object.entries(missingCounts).sort((a, b) => b[1] - a[1]);
  for (const [k, count] of sorted) {
    const [chord, inst] = k.split('|');
    const songs = (missingSongs[k] || []).slice(0, 5).join(';');
    console.log(`${chord},${inst},${count},${songs}`);
  }
  process.exit(0);
}

console.log('='.repeat(70));
console.log(`AUDITORIA DE ACORDES — ${totalSongs} musicas, ${songsWithIssues} com lacunas`);
console.log('='.repeat(70));

// Agrupa faltantes por instrumento
for (const inst of INSTS) {
  const entries = Object.entries(missingCounts)
    .filter(([k]) => k.endsWith('|' + inst))
    .map(([k, count]) => ({ chord: k.split('|')[0], count, songs: missingSongs[k] || [] }))
    .sort((a, b) => b.count - a.count);

  console.log(`\n--- ${inst.toUpperCase()} (${entries.length} acordes distintos faltantes) ---`);
  if (entries.length === 0) {
    console.log('  100% coberto.');
    continue;
  }
  const topN = entries.slice(0, 30);
  for (const e of topN) {
    console.log(`  ${e.chord.padEnd(12)} faltando em ${String(e.count).padStart(3)} musica(s)  ex: ${e.songs.slice(0, 3).join(', ')}`);
  }
  if (entries.length > 30) {
    console.log(`  ... +${entries.length - 30} outros acordes`);
  }
}

// Resumo: acordes ÚNICOS faltantes (deduplicado entre instrumentos)
const uniqueChords = new Set();
for (const k of Object.keys(missingCounts)) uniqueChords.add(k.split('|')[0]);
console.log(`\n=== TOTAL DE ACORDES UNICOS FALTANTES (somando 3 instrumentos): ${uniqueChords.size} ===`);

if (showPerSong) {
  console.log('\n='.repeat(70));
  console.log('DETALHE POR MUSICA (top 20 com mais lacunas)');
  console.log('='.repeat(70));
  perSongDetail
    .map(s => ({
      ...s,
      total: s.perInstMissing.violao.length + s.perInstMissing.ukulele.length + s.perInstMissing.piano.length
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .forEach(s => {
      console.log(`\n${s.file} (${s.usedTotal} acordes usados, ${s.total} faltantes total)`);
      for (const inst of INSTS) {
        const m = s.perInstMissing[inst];
        if (m.length) console.log(`  ${inst.padEnd(7)}: ${[...new Set(m)].join(', ')}`);
      }
    });
}
