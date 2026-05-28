// Preenche lacunas de cifras-multi/ usando uma biblioteca canonica
// construida a partir de TODOS os JSONs existentes (acordes basicos
// como E, A, D, C tem a mesma digitacao em qualquer musica).
//
// Pra acordes ausentes em TODA a biblioteca (raros), adiciona digitacao
// padrao do "chord book" embutido abaixo. Cobre acordes basicos do
// catalogo Pearl Jam/EV.
//
// Uso: node scripts/fill-chord-gaps.mjs           (dry-run, mostra diff)
//      node scripts/fill-chord-gaps.mjs --apply   (escreve nos JSONs)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'media/tabs/cifras-multi';
const INSTS = ['violao', 'ukulele', 'piano'];
const APPLY = process.argv.includes('--apply');

// Chord book embutido pra acordes que podem nao existir em NENHUM JSON.
// Digitacao canonica padrao (consultar UltimateGuitar/Songbooks se duvida).
const CHORD_BOOK = {
  violao: {
    'E':   { fingering: '022100', fingers: '023100', fundamental: 'E' },
    'A':   { fingering: 'x02220', fingers: 'x01230', fundamental: 'A' },
    'D':   { fingering: 'xx0232', fingers: 'xx0132', fundamental: 'D' },
    'C':   { fingering: 'x32010', fingers: 'x32010', fundamental: 'C' },
    'Bb':  { fingering: 'x13331', fingers: 'x12341', fundamental: 'Bb' },
    'Am':  { fingering: 'x02210', fingers: 'x02310', fundamental: 'A' },
    'A#':  { fingering: 'x13331', fingers: 'x12341', fundamental: 'A#' },
    'A5':  { fingering: 'x022xx', fingers: 'x012xx', fundamental: 'A' },
    'B5':  { fingering: 'x244xx', fingers: 'x134xx', fundamental: 'B' },
    'D5':  { fingering: 'xx0233', fingers: 'xx0134', fundamental: 'D' },
    'F5':  { fingering: '13311x', fingers: '13411x', fundamental: 'F' },
  },
  ukulele: {
    'E':   { fingering: '4442', fingers: '3331', fundamental: 'E' },
    'A':   { fingering: '2100', fingers: '2100', fundamental: 'A' },
    'D':   { fingering: '2220', fingers: '1110', fundamental: 'D' },
    'C':   { fingering: '0003', fingers: '0003', fundamental: 'C' },
    'Bb':  { fingering: '3211', fingers: '3211', fundamental: 'Bb' },
    'Am':  { fingering: '2000', fingers: '2000', fundamental: 'A' },
    'A#':  { fingering: '3211', fingers: '3211', fundamental: 'A#' },
    'A5':  { fingering: 'xx00', fingers: 'xx00', fundamental: 'A' },
    'B5':  { fingering: 'xx22', fingers: 'xx11', fundamental: 'B' },
    'D5':  { fingering: '0220', fingers: '0110', fundamental: 'D' },
    'F5':  { fingering: '2010', fingers: '2010', fundamental: 'F' },
    // Slash chords (ukulele) — inversoes via baixo no fingering
    'Em/G':{ fingering: '0432', fingers: '0321', fundamental: 'E' },
    'G/D': { fingering: '0232', fingers: '0231', fundamental: 'G' },
    'Dm/G':{ fingering: '0210', fingers: '0210', fundamental: 'D' },
  },
  piano: {
    'E':  { notes: ['E', 'G#', 'B'],  fundamental: 'E',  inversion: null },
    'A':  { notes: ['A', 'C#', 'E'],  fundamental: 'A',  inversion: null },
    'D':  { notes: ['D', 'F#', 'A'],  fundamental: 'D',  inversion: null },
    'C':  { notes: ['C', 'E', 'G'],   fundamental: 'C',  inversion: null },
    'Bb': { notes: ['Bb', 'D', 'F'],  fundamental: 'Bb', inversion: null },
    'Am': { notes: ['A', 'C', 'E'],   fundamental: 'A',  inversion: null },
    'A#': { notes: ['A#', 'D', 'F'],  fundamental: 'A#', inversion: null },
    'A5': { notes: ['A', 'E'],        fundamental: 'A',  inversion: null },
    'B5': { notes: ['B', 'F#'],       fundamental: 'B',  inversion: null },
    'D5': { notes: ['D', 'A'],        fundamental: 'D',  inversion: null },
    'F5': { notes: ['F', 'C'],        fundamental: 'F',  inversion: null },
  },
};

// === Etapa 1: ler todos os JSONs, construir biblioteca canonica ===
const files = readdirSync(DIR).filter(f => f.endsWith('.json'));
const library = { violao: {}, ukulele: {}, piano: {} };
const jsons = {};

for (const file of files) {
  const data = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  jsons[file] = data;
  for (const inst of INSTS) {
    const chords = data.instruments && data.instruments[inst] && data.instruments[inst].chords;
    if (!chords) continue;
    for (const [name, def] of Object.entries(chords)) {
      // Primeira ocorrencia ganha (frequencia maior tende a ser canonica).
      if (!library[inst][name]) library[inst][name] = def;
    }
  }
}

const extractChordsFromContent = (content) => {
  if (!content) return new Set();
  const re = /\[([^\]]+)\]/g;
  const found = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    const raw = String(m[1]).trim();
    if (/^(section|comment|sof|eof|title|artist|key|bpm|c\b):/i.test(raw)) continue;
    if (raw === '' || raw === 'N.C.' || raw === 'NC') continue;
    found.add(raw);
  }
  return found;
};

// === Etapa 2: pra cada musica, preencher acordes faltantes ===
let totalPatched = 0;
const patchLog = [];

for (const [file, data] of Object.entries(jsons)) {
  const used = extractChordsFromContent(data.content || '');
  if (used.size === 0) continue;
  let patched = false;
  const songPatches = { file: file.replace('.json', ''), violao: [], ukulele: [], piano: [] };

  for (const inst of INSTS) {
    if (!data.instruments) data.instruments = {};
    if (!data.instruments[inst]) {
      // Sem instrument definido pra esse — pula (nao quer criar do zero).
      continue;
    }
    if (!data.instruments[inst].chords) data.instruments[inst].chords = {};
    const cad = data.instruments[inst].chords;

    for (const c of used) {
      if (cad[c]) continue; // ja cadastrado
      const fromLib = library[inst][c];
      const fromBook = CHORD_BOOK[inst][c];
      const fill = fromLib || fromBook;
      if (fill) {
        cad[c] = fill;
        songPatches[inst].push({ chord: c, source: fromLib ? 'lib' : 'book', def: fill });
        patched = true;
      } else {
        songPatches[inst].push({ chord: c, source: 'MISSING', def: null });
      }
    }
  }

  if (patched) {
    totalPatched++;
    patchLog.push(songPatches);
    if (APPLY) {
      writeFileSync(join(DIR, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  } else if (songPatches.violao.length || songPatches.ukulele.length || songPatches.piano.length) {
    // Tem lacunas mas nada preenchido (todos source MISSING)
    patchLog.push(songPatches);
  }
}

// === Relatorio ===
console.log('='.repeat(70));
console.log(`PREENCHIMENTO DE LACUNAS — ${APPLY ? 'APLICANDO' : 'DRY-RUN (nenhum arquivo modificado)'}`);
console.log('='.repeat(70));
console.log(`\nLib canonica: violao=${Object.keys(library.violao).length}, ukulele=${Object.keys(library.ukulele).length}, piano=${Object.keys(library.piano).length}`);
console.log(`Musicas patcheadas: ${totalPatched} de ${files.length}\n`);

for (const s of patchLog) {
  const totalChords = s.violao.length + s.ukulele.length + s.piano.length;
  if (!totalChords) continue;
  console.log(`\n${s.file}`);
  for (const inst of INSTS) {
    if (!s[inst].length) continue;
    const filled = s[inst].filter(p => p.source !== 'MISSING');
    const missing = s[inst].filter(p => p.source === 'MISSING');
    if (filled.length) {
      console.log(`  ${inst.padEnd(7)} +${filled.length}: ${filled.map(p => `${p.chord}(${p.source})`).join(', ')}`);
    }
    if (missing.length) {
      console.log(`  ${inst.padEnd(7)} ??? ${missing.length} ainda sem digitacao: ${missing.map(p => p.chord).join(', ')}`);
    }
  }
}

console.log('\n' + (APPLY ? '✓ JSONs atualizados.' : 'Rode com --apply pra escrever nos arquivos.'));
