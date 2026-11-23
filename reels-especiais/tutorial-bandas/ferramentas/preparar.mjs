// Junta os assets próprios da banda em assets/<slug>/: fundo e logo da página dela, QR da página,
// story e recorte dos botões de show tirados da gravação do sorteio. Uso: BANDA=<slug> node ferramentas/preparar.mjs
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { B, RAIZ } from './banda.mjs';
if (B.base) { console.log('Blaymorphed usa os assets de sempre'); process.exit(0); }
const PAG = `${RAIZ}../../setlist/${B.slug}/`, S = `${B.G}sorteio/`;
mkdirSync(B.ASS, { recursive: true });
for (const f of ['fundo-banda.mp4', 'logo-redondo.jpg']) copyFileSync(PAG + f, B.ASS + f);
const story = ['story.jpg', 'story.png'].find((f) => existsSync(S + f));
if (!story) throw new Error('sem story na gravação do sorteio');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', S + story, '-q:v', '2', B.ASS + 'story.jpg']);
copyFileSync(S + 'shows.png', B.ASS + 'shows.png');
// QR da página da banda, 700x700 como o da Blaymorphed.
execFileSync('qrencode', ['-s', '20', '-m', '2', '-l', 'M', '-o', B.ASS + 'qr-cru.png', B.URL]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', B.ASS + 'qr-cru.png', '-vf', 'scale=700:700:flags=neighbor', B.ASS + 'qr.png']);
console.log('assets prontos em', B.ASS, 'QR:', B.URL);
