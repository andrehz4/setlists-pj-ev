// Corta as gravações em um clipe por cena (<assets da banda>/clipes/cN.mp4), no tempo exato da cena.
// Os trechos saem das marcas gravadas em toques.json (grava.mjs), então servem pra qualquer banda.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { linha } from './tempos.mjs';
import { B, RAIZ } from './banda.mjs';
const G = B.G, O = B.ASS + 'clipes/';
mkdirSync(O, { recursive: true });
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const M = (bl) => JSON.parse(readFileSync(`${G}${bl}/toques.json`)).marcas;
const ex = (bl) => JSON.parse(readFileSync(`${G}${bl}/extra.json`));
const s = M('sorteio'), mo = M('montar'), no = M('nome'), fa = B.sem.includes(10) ? null : M(B.falta || 'stones');
// Nome barrado borrado (campo do nome, x2 na gravação) enquanto é digitado.
if (!B.base || !existsSync(G + 'nome/video-borrado.mp4')) { // banda: sempre refaz (a gravação pode ter mudado)
  const c = ex('nome').campo, [x, y, w, h] = [c.x, c.y, c.w, c.h].map((v) => Math.round(v * 2));
  ff(['-i', G + 'nome/video.mp4', '-filter_complex', `[0:v]split[a][b];[b]crop=${w}:${h}:${x}:${y},boxblur=22:3[c];[a][c]overlay=${x}:${y}:enable='between(t,${(no.barrado - 0.209).toFixed(2)},${(no.barradoFim + 0.101).toFixed(2)})'`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', G + 'nome/video-borrado.mp4']);
}
const S = 'sorteio/video.mp4', NB = 'nome/video-borrado.mp4', MV = 'montar/video.mp4';
const IBIRA = `${RAIZ}gravacoes/ibira/video.mp4`; // página do Ibirapuera: igual pra todas as bandas
const PLANO = {
  1: [[S, s.sorteou + 0.812, s.sorteou + 9.812]],
  2: [['chegada/video.mp4', 0.6, 7.2], [IBIRA, 1.2, 4.8]],
  3: [[S, s.chegada - 0.101, s.sorteou + 8.212]],
  4: [[MV, mo.montar - 0.467, mo.lista + 2.026]],
  5: [[S, s.sorteou + 8.212, s.lidas - 1.482]],
  6: [[S, s.lidas - 1.282, s.acoes - 0.243]],
  7: [[S, s.video - 0.252, s.video + 3.548], [S, s.videoPronto - 0.597, s.videoPronto + 3.403], [S, s.instagram - 0.802, s.instagram + 5.798], [S, s.whats - 0.578, s.whats + 2.622]],
  8: [[NB, no.ana - 0.319, no.titulo + 0.232], [NB, 0.9, no.ana - 0.319]],
  12: [[MV, mo.montar + 7.733, mo.gerar - 0.389]],
};
if (fa) PLANO[10] = [[`${B.falta || 'stones'}/video.mp4`, 0.4, fa.whats + 1.719]];
const { cenas } = linha();
for (const [n, partes] of Object.entries(PLANO)) {
  const c = cenas.find((x) => x.n === +n);
  const tam = partes.reduce((t, [, a, b]) => t + b - a, 0);
  // Cena 12 usa só um trecho curto (8,2 s) dentro do painel de ideias.
  const alvo = +n === 12 ? 8.2 : c.dur;
  let f = alvo / tam; const pad = f > 1.3 ? alvo - tam : 0; if (pad) f = 1;
  const ins = partes.flatMap(([src]) => ['-i', src.startsWith('/') ? src : G + src]);
  let fc = partes.map(([, a, b], i) => `[${i}:v]trim=${a.toFixed(3)}:${b.toFixed(3)},setpts=PTS-STARTPTS,fps=30,scale=780:1688,setsar=1[p${i}]`).join(';');
  fc += ';' + partes.map((_, i) => `[p${i}]`).join('') + `concat=n=${partes.length}:v=1:a=0[cc];[cc]setpts=PTS*${f.toFixed(4)}${pad ? `,tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : ''},fps=30,trim=0:${alvo}[v]`;
  ff([...ins, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', `${O}c${n}.mp4`]);
  console.log(`c${n}`, 'trechos', tam.toFixed(1), 'alvo', alvo.toFixed(1), 'fator', f.toFixed(2), pad ? 'pad ' + pad.toFixed(1) : '');
}
