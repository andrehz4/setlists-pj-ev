// Voz (cenas da Siri no lugar certo) + trilha em loop com ducking pela voz.
import { execFileSync } from 'node:child_process';
import { linha, vozDaCena } from './tempos.mjs';
const R = new URL('..', import.meta.url).pathname;
const TRILHA = '/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/publish/assets/story-tracks/09-pixabay-abydos-90s-garage-rock.mp3';
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const { cenas, total } = linha();
const ins = cenas.flatMap((c) => ['-i', vozDaCena(c.n)]);
const fc = cenas.map((c, i) => `[${i}:a]aresample=48000,pan=mono|c0=c0,adelay=${Math.round(c.voz * 1000)}[v${i}]`).join(';') +
  ';' + cenas.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${cenas.length}:normalize=0,apad,atrim=0:${total},loudnorm=I=-16:TP=-1.5[o]`;
ff([...ins, '-filter_complex', fc, '-map', '[o]', '-ar', '48000', R + 'assets/voz.wav']);
ff(['-stream_loop', '-1', '-i', TRILHA, '-i', R + 'assets/voz.wav', '-filter_complex',
  `[0:a]atrim=0:${total},aresample=48000,volume=0.30[m];[1:a]aresample=48000,asplit[sc][x];[x]anullsink;[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=30:release=450[d];[d]afade=t=in:d=1.5,afade=t=out:st=${(total - 3).toFixed(2)}:d=3[o]`,
  '-map', '[o]', '-ar', '48000', R + 'assets/trilha-duck.wav']);
console.log('total', total);
