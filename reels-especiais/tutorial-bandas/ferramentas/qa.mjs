// QA visual: um quadro por cena (e pelos momentos desenhados) do render, em 3 tiras. Uso: node ferramentas/qa.mjs <mp4> <pasta>
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { linha } from './tempos.mjs';
const [mp4, S] = process.argv.slice(2); mkdirSync(S, { recursive: true });
const l = linha(), c = (n) => l.cenas.find((x) => x.n === n) || { ini: -99, dur: 0 };
const pts = [['0', 0.3], ...l.cenas.map((x) => [String(x.n), x.ini + x.dur * 0.55]), ['c1', l.cartelas[0].ini + 0.8], ['11b', c(11).ini + 15],
  ['12a', c(12).ini + 3], ['12b', c(12).ini + 8], ['12c', c(12).ini + 13], ['12d', c(12).ini + 18.5], ['7w', c(7).ini + 16], ['10w', c(10).ini + 11]].filter(([, t]) => t >= 0);
for (const [n, t] of pts) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', t.toFixed(2), '-i', mp4, '-frames:v', '1', '-vf', 'scale=270:-1', `${S}/f-${n}.jpg`]);
const tem = new Set(pts.map(([n]) => n));
const tiras = [['0', '1', '2', '3', '4', '5', '6'], ['7', '7w', '8', '9', '10', '10w', '11'], ['11b', '12a', '12b', '12c', '12d', '13', 'c1']].map((t) => t.filter((n) => tem.has(n)));
tiras.forEach((t, i) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...t.flatMap((n) => ['-i', `${S}/f-${n}.jpg`]), '-filter_complex', `hstack=${t.length}`, `${S}/tira${i}.jpg`]));
console.log(pts.map(([n, t]) => `${n}@${t.toFixed(1)}`).join(' '));
