import fs from 'node:fs';

const a = fs.readFileSync('media/interpretations.json', 'utf8');
const b = fs.readFileSync('media/interpretations.pass2b.json', 'utf8');

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const labels = [
  'o tipo de',
  'estruturada em torno de',
  'a estrutura da canção convida',
  'estrutura da canção convida',
  'que o verso da canção exige',
  'da canção convida',
  'da canção exige',
  'como o tipo de',
  'no tipo de',
  'do tipo de',
  'ao tipo de',
  'da canção',
];

console.log('padrão                                          antes  depois');
for (const p of labels) {
  const re = new RegExp(escapeRe(p), 'g');
  const before = (a.match(re) || []).length;
  const after = (b.match(re) || []).length;
  console.log(`  ${p.padEnd(48)}${String(before).padStart(5)}${String(after).padStart(7)}`);
}
