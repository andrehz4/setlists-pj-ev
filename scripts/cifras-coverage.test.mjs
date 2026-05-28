// Testes pros scripts de auditoria/preenchimento de cifras-multi/.
// Rodar: node --test scripts/cifras-coverage.test.mjs
//
// Inspirado em band-fallback.test.mjs (padrao do projeto).
// Foca em invariantes que NAO devem regredir:
//   1. 100% de cobertura de acordes (toda nota usada no content tem
//      cadastro nos 3 instrumentos)
//   2. fingerings sao strings validas (so digitos 0-9 e x)
//   3. piano notes sao arrays nao-vazios
//   4. labels dos instrumentos sao consistentes
//   5. estrutura minima do JSON (key, bpm, content, instruments)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'media/tabs/cifras-multi';
const INSTS = ['violao', 'ukulele', 'piano'];

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));

const loadJson = (file) => {
  try {
    return JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch (err) {
    throw new Error(`${file}: ${err.message}`);
  }
};

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

describe('cifras-multi JSON catalog', () => {
  test('catalogo tem pelo menos 100 musicas', () => {
    assert.ok(files.length >= 100, `apenas ${files.length} JSONs em ${DIR}`);
  });

  test('cada JSON parsea sem erro', () => {
    for (const file of files) {
      assert.doesNotThrow(() => loadJson(file), `parse falhou: ${file}`);
    }
  });

  test('cada JSON tem campos minimos (title, content, instruments)', () => {
    for (const file of files) {
      const d = loadJson(file);
      assert.ok(d.title, `${file}: sem title`);
      assert.ok(d.content, `${file}: sem content`);
      assert.ok(d.instruments, `${file}: sem instruments`);
    }
  });

  test('100% de cobertura de acordes em violao/ukulele/piano', () => {
    const lacunas = [];
    for (const file of files) {
      const d = loadJson(file);
      const usedChords = extractChordsFromContent(d.content);
      for (const inst of INSTS) {
        const cad = (d.instruments[inst] && d.instruments[inst].chords) || {};
        const cadKeys = new Set(Object.keys(cad));
        for (const c of usedChords) {
          if (!cadKeys.has(c)) {
            lacunas.push(`${file.replace('.json', '')} ${inst} faltando ${c}`);
          }
        }
      }
    }
    assert.equal(
      lacunas.length, 0,
      `${lacunas.length} lacunas (top 5: ${lacunas.slice(0, 5).join(', ')})`
    );
  });

  test('fingerings sao strings validas (digitos 0-9, X ou -)', () => {
    const invalidos = [];
    for (const file of files) {
      const d = loadJson(file);
      for (const inst of ['violao', 'ukulele']) {
        const chords = (d.instruments[inst] && d.instruments[inst].chords) || {};
        for (const [name, df] of Object.entries(chords)) {
          const fing = df.fingering;
          if (!fing) continue;
          if (!/^[0-9xX\-]+$/.test(String(fing))) {
            invalidos.push(`${file} ${inst} ${name}: ${fing}`);
          }
        }
      }
    }
    assert.equal(
      invalidos.length, 0,
      `${invalidos.length} fingerings invalidos: ${invalidos.slice(0, 5).join(', ')}`
    );
  });

  test('piano notes sao arrays nao-vazios de strings', () => {
    const problemas = [];
    for (const file of files) {
      const d = loadJson(file);
      const chords = (d.instruments.piano && d.instruments.piano.chords) || {};
      for (const [name, df] of Object.entries(chords)) {
        if (!Array.isArray(df.notes) || df.notes.length === 0) {
          problemas.push(`${file} piano ${name}`);
        } else {
          for (const n of df.notes) {
            if (typeof n !== 'string' || !/^[A-G][#b]?$/.test(n)) {
              problemas.push(`${file} piano ${name} nota invalida: ${n}`);
            }
          }
        }
      }
    }
    assert.equal(
      problemas.length, 0,
      `${problemas.length} problemas em notes do piano: ${problemas.slice(0, 5).join(', ')}`
    );
  });

  test('strumming.beats (quando presente) tem count e stroke validos', () => {
    const invalidos = [];
    for (const file of files) {
      const d = loadJson(file);
      for (const inst of INSTS) {
        const idata = d.instruments[inst];
        if (!idata || !idata.strumming || !Array.isArray(idata.strumming.beats)) continue;
        for (let i = 0; i < idata.strumming.beats.length; i++) {
          const b = idata.strumming.beats[i];
          if (b.count == null) invalidos.push(`${file} ${inst} beat[${i}] sem count`);
          const validStrokes = new Set(['down', 'up', 'rest', 'miss']);
          if (!validStrokes.has(b.stroke)) {
            invalidos.push(`${file} ${inst} beat[${i}] stroke invalido: ${b.stroke}`);
          }
        }
      }
    }
    assert.equal(
      invalidos.length, 0,
      `${invalidos.length} beats invalidos: ${invalidos.slice(0, 5).join(', ')}`
    );
  });

  test('alt_versions (quando presente) tem id e content', () => {
    const problemas = [];
    for (const file of files) {
      const d = loadJson(file);
      if (!Array.isArray(d.alt_versions)) continue;
      for (let i = 0; i < d.alt_versions.length; i++) {
        const alt = d.alt_versions[i];
        if (!alt.id) problemas.push(`${file} alt_versions[${i}] sem id`);
        if (!alt.content) problemas.push(`${file} alt_versions[${i}] sem content`);
      }
    }
    assert.equal(
      problemas.length, 0,
      `${problemas.length} alt_versions com problema: ${problemas.slice(0, 5).join(', ')}`
    );
  });
});
