// QA "só a banda certa": quadros a 2 por segundo, OCR (tesseract) de cada um procurando nome, @ e casas de OUTRAS
// bandas, folhas de contato (mosaico) pra conferir no olho e volume do áudio.
// Uso: BANDA=<slug> node ferramentas/qa-banda.mjs <mp4> <pasta>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { B, RAIZ } from './banda.mjs';
const [mp4, S] = process.argv.slice(2);
mkdirSync(S + '/q', { recursive: true });
const run = (c, a) => execFileSync(c, a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=2,scale=540:-1', `${S}/q/%04d.jpg`]);
const quadros = readdirSync(S + '/q').filter((f) => f.endsWith('.jpg')).sort();

// Termos proibidos: nome, @ e casas das outras bandas (agenda) + o que é só da Blaymorphed.
const agenda = JSON.parse(readFileSync(`${RAIZ}../../media/agenda/shows.json`, 'utf8')).shows;
const outras = readdirSync(RAIZ + 'bandas').map((f) => JSON.parse(readFileSync(RAIZ + 'bandas/' + f, 'utf8'))).filter((x) => x.slug !== B.slug);
const minhas = new Set(agenda.filter((s) => s.banda === B.arroba).flatMap((s) => [s.casa, s.casaNome].filter(Boolean).map((t) => t.toLowerCase())));
const termos = new Set();
for (const o of outras) {
  termos.add(o.arroba.toLowerCase());
  // nome de uma palavra só (Alive, Jeremy, Singles) também é música: só conta com "do"/"da" na frente
  termos.add(o.nome.includes(' ') || o.nome === 'Blaymorphed' ? o.nome.toLowerCase() : `do ${o.nome.toLowerCase()}`);
  for (const s of agenda.filter((x) => x.banda === o.arroba)) for (const c of [s.casa, s.casaNome]) if (c && c.length > 4 && !minhas.has(c.toLowerCase())) termos.add(c.toLowerCase());
}
for (const t of ['santo rock', 'stones bar', 'santorock']) termos.add(t);
const norm = (t) => t.toLowerCase().replace(/\s+/g, ' ');
const achados = [];
for (const q of quadros) {
  const txt = norm(run('tesseract', [`${S}/q/${q}`, '-', '-l', 'eng', '--psm', '11']));
  for (const t of termos) if (txt.includes(t)) achados.push(`${q} (${((parseInt(q) - 1) / 2).toFixed(1)} s): "${t}"`);
  if (q === quadros[Math.floor(quadros.length / 2)]) writeFileSync(S + '/ocr-amostra.txt', txt);
}
// Folhas de contato: 60 quadros (30 s) por folha, 10 x 6.
const porFolha = 60;
for (let i = 0; i * porFolha < quadros.length; i++)
  run('ffmpeg', ['-y', '-loglevel', 'error', '-start_number', String(i * porFolha + 1), '-i', `${S}/q/%04d.jpg`, '-frames:v', '1',
    '-vf', `scale=135:-1,tile=10x6:padding=2`, `${S}/folha-${i + 1}.jpg`]);
// Áudio: volume médio e pico (precisa ter som).
const vd = execFileSync('sh', ['-c', `ffmpeg -i "${mp4}" -af volumedetect -vn -f null - 2>&1 | grep -E "mean_volume|max_volume"`]).toString().trim();
console.log(B.slug, 'quadros', quadros.length, 'termos', termos.size);
console.log(vd.replace(/\[Parsed[^\]]*\]\s*/g, ''));
console.log(achados.length ? 'ACHADOS:\n' + achados.join('\n') : 'OCR: nenhum termo de outra banda');
