// Corta as gravações em um clipe por cena (assets/clipes/cN.mp4), no tempo exato da cena.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { linha } from './tempos.mjs';
const R = new URL('..', import.meta.url).pathname, G = R + 'gravacoes/', O = R + 'assets/clipes/';
mkdirSync(O, { recursive: true });
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
// Nome barrado borrado (campo em 21,548 390x52 css = x2 na gravação) enquanto é digitado.
if (!existsSync(G + 'nome/video-borrado.mp4'))
  ff(['-i', G + 'nome/video.mp4', '-filter_complex', "[0:v]split[a][b];[b]crop=696:104:42:1096,boxblur=22:3[c];[a][c]overlay=42:1096:enable='between(t,3.0,4.42)'", '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', G + 'nome/video-borrado.mp4']);
const S = 'sorteio/video.mp4';
const PLANO = {
  1: [[S, 10.2, 19.2]],
  2: [['chegada/video.mp4', 0.6, 7.2], ['ibira/video.mp4', 1.2, 4.8]],
  3: [[S, 2.4, 17.6]],
  4: [['montar/video.mp4', 1.4, 16.6]],
  5: [[S, 17.6, 28.4]],
  6: [[S, 28.6, 41.2]],
  7: [[S, 54.4, 58.2], [S, 73.6, 77.6], [S, 42.8, 49.4], [S, 50.2, 53.4]],
  8: [['nome/video-borrado.mp4', 7.0, 15.6], ['nome/video-borrado.mp4', 0.9, 7.0]],
  10: [['stones/video.mp4', 0.4, 15.6]],
  12: [['montar/video.mp4', 9.6, 17.4]],
};
const { cenas } = linha();
for (const [n, partes] of Object.entries(PLANO)) {
  const c = cenas.find((x) => x.n === +n);
  const tam = partes.reduce((s, [, a, b]) => s + b - a, 0);
  // Cena 12 usa só um trecho curto (8,2 s) dentro do painel de ideias.
  const alvo = +n === 12 ? 8.2 : c.dur;
  let f = alvo / tam; const pad = f > 1.3 ? alvo - tam : 0; if (pad) f = 1;
  const ins = partes.flatMap(([src]) => ['-i', G + src]);
  let fc = partes.map(([, a, b], i) => `[${i}:v]trim=${a}:${b},setpts=PTS-STARTPTS,fps=30,scale=780:1688,setsar=1[p${i}]`).join(';');
  fc += ';' + partes.map((_, i) => `[p${i}]`).join('') + `concat=n=${partes.length}:v=1:a=0[cc];[cc]setpts=PTS*${f.toFixed(4)}${pad ? `,tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : ''},fps=30,trim=0:${alvo}[v]`;
  ff([...ins, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', `${O}c${n}.mp4`]);
  console.log(`c${n}`, 'trechos', tam.toFixed(1), 'alvo', alvo.toFixed(1), 'fator', f.toFixed(2), pad ? 'pad ' + pad.toFixed(1) : '');
}
