import fs from 'node:fs';

const orig = JSON.parse(fs.readFileSync('media/interpretations.json', 'utf8'));
const next = JSON.parse(fs.readFileSync('media/interpretations.pass2b.json', 'utf8'));

const samples = [];

function pickField(songKey, lhs, rhs, label) {
  if (lhs && rhs && lhs !== rhs) {
    samples.push({ song: songKey, where: label, before: lhs, after: rhs });
  }
}

for (const songKey of Object.keys(orig)) {
  if (songKey === '_meta') continue;
  const a = orig[songKey];
  const b = next[songKey];
  if (!a || !b) continue;
  pickField(songKey, a.text_pt, b.text_pt, 'text_pt');
  if (a.byShow_pt && b.byShow_pt) {
    for (const show of Object.keys(a.byShow_pt)) {
      pickField(songKey, a.byShow_pt[show], b.byShow_pt[show], `byShow_pt/${show}`);
    }
  }
}

// Filtrar: mostrar pares com diff curto (uma frase mudou) pra fácil leitura.
const tight = samples
  .map((s) => {
    const before = s.before;
    const after = s.after;
    const idx = firstDiff(before, after);
    const start = Math.max(0, idx - 60);
    const endLen = 140;
    return {
      song: s.song,
      where: s.where,
      beforeFrag: before.slice(start, start + endLen).replace(/\n/g, ' '),
      afterFrag: after.slice(start, start + endLen + 10).replace(/\n/g, ' '),
    };
  });

function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return n;
}

// Sortear distribuição: pegar 1 a cada N
const sampled = [];
const stride = Math.max(1, Math.floor(tight.length / 18));
for (let i = 0; i < tight.length && sampled.length < 18; i += stride) sampled.push(tight[i]);

console.log(`total de campos alterados: ${samples.length}\n`);
for (const s of sampled) {
  console.log(`--- ${s.song} :: ${s.where}`);
  console.log(`  antes : ...${s.beforeFrag}...`);
  console.log(`  depois: ...${s.afterFrag}...`);
  console.log();
}
