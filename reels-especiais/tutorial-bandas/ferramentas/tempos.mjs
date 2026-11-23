// Linha do tempo única: duração de cada cena = fala (Siri) + respiro; cartelas antes das cenas 3, 7, 9 e 12.
import { execFileSync } from 'node:child_process';
const RAIZ = new URL('..', import.meta.url).pathname;
import { existsSync } from 'node:fs';
import { B, falaPropria } from './banda.mjs';
// Voz da cena: a do ElevenLabs (voz-eleven/) quando já foi gravada, senão o rascunho da Siri.
// Outra banda: fala própria em voz-eleven/<slug>/, fala igual herdada da Blaymorphed.
export const vozDaCena = (n) => { const k = String(n).padStart(2, '0'), e = `${RAIZ}voz-eleven/cena-${k}.mp3`;
  if (!B.base) return falaPropria(n) ? `${B.V}cena-${k}.mp3` : e;
  return existsSync(e) ? e : `${RAIZ}rascunho-siri/cena-${k}.aiff`; };
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
export const CARTELAS = { 3: 'A página', 7: 'Espalhar', 9: 'O post completo', 12: 'Sugestões' };
export const RESPIRO = 0.55, CARTELA = 1.4, ATRASO_VOZ = 0.12;
export function linha() {
  let t = 0; const cenas = [], cartelas = [];
  for (let n = 1; n <= 13; n++) {
    if (B.sem.includes(n)) continue;
    if (CARTELAS[n]) { cartelas.push({ n, titulo: CARTELAS[n], ini: t, dur: CARTELA }); t += CARTELA; }
    const fala = dur(vozDaCena(n));
    const d = +(fala + RESPIRO).toFixed(3);
    cenas.push({ n, ini: +t.toFixed(3), dur: d, fala, voz: +(t + ATRASO_VOZ).toFixed(3) }); t += d;
  }
  return { cenas, cartelas, total: +t.toFixed(3) };
}
