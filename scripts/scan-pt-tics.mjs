import fs from 'node:fs';

const raw = fs.readFileSync('media/interpretations.json', 'utf8');

const patterns = [
  /deram ao slot o tipo de [a-zçãáéíóúâêô]+/g,
  /imprimiram ao slot o tipo de [a-zçãáéíóúâêô]+/g,
  /sustentou o tipo de [a-zçãáéíóúâêô]+/g,
  /chegou no slot \w+ do show como o tipo de [a-zçãáéíóúâêô]+/g,
];

for (const re of patterns) {
  console.log(`\n--- /${re.source}/  ---`);
  let m;
  re.lastIndex = 0;
  let n = 0;
  while ((m = re.exec(raw)) !== null) {
    const ctx = raw.slice(Math.max(0, m.index - 0), m.index + m[0].length + 40).replace(/\n/g, ' ');
    console.log(`  ${++n}. ${ctx}`);
  }
}
