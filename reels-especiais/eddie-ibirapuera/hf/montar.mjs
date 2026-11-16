// Monta o reel: gera index.html + compositions/c1..c13.html + ../render/tempos.json
// Uso: node montar.mjs   (rodar dentro de hf/)

// ===== CASAMENTO CLIPE x CENA (troque aqui) =====
// Cada cena divide o seu tempo em partes iguais entre os clipes listados (cortes rápidos).
// Arquivos em assets/clips/. Sempre mudos. Clipe novo: copie para assets/clips e cite aqui.
const CLIPES = [
  { cena: 'c1', clipes: ['water-on-the-road-capa20.mp4', 'moline-2014-capa2.mp4', 'roma-2018-capa3.mp4', 'ten-show-2016-capa2.mp4'] },
  { cena: 'c2', clipes: ['oceans-unplugged-capa1.mp4', 'pearl-jam-i-am-mine-capa-21_48.mp4', 'amongst-the-waves-capa3.mp4'] },
  { cena: 'c3', clipes: ['i-am-mine-capa1.mp4', 'moline-2014-capa5.mp4'] },
  { cena: 'c4', clipes: ['roma-2018-capa1.mp4', 'water-on-the-road-capa17.mp4', 'even-flow-3-capa1.mp4'] },
  { cena: 'c5', clipes: ['oceans-unplugged-capa8.mp4', 'amongst-the-waves-capa2.mp4'] },
  { cena: 'c6', clipes: ['ten-show-2016-capa3.mp4', 'water-on-the-road-capa18.mp4', 'bridge-school-2011-capa3.mp4', 'even-flow-capa3.mp4'] },
  { cena: 'c7', clipes: ['moline-2014-capa2.mp4', 'i-am-mine-capa1.mp4', 'ten-show-2016-capa2.mp4'] },
  { cena: 'c8', clipes: ['oceans-unplugged-capa1.mp4', 'amongst-the-waves-capa3.mp4', 'bridge-school-2011-capa12.mp4'] },
  { cena: 'c9', clipes: ['moline-2014-capa5.mp4', 'even-flow-3-capa1.mp4', 'roma-2018-capa3.mp4'] },
  { cena: 'c10', clipes: ['amongst-the-waves-capa2.mp4', 'roma-2018-capa1.mp4', 'i-am-mine-capa1.mp4', 'water-on-the-road-capa4.mp4'] },
  { cena: 'c11', clipes: ['bridge-school-2011-capa14.mp4', 'water-on-the-road-capa2.mp4'] },
  { cena: 'c12', clipes: ['even-flow-capa3.mp4', 'water-on-the-road-capa12.mp4', 'ten-show-2016-capa3.mp4', 'roma-2018-capa3.mp4'] },
  { cena: 'c13', clipes: ['bridge-school-2011-capa13.mp4', 'bridge-school-2011-capa15.mp4', 'moline-2014-capa5.mp4', 'i-am-mine-capa1.mp4'] },
];

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CENAS, COR, arquivoCena } from './cenas.mjs';

const RESPIRO = 0.12, CAUDA = 0.6;
const r3 = (n) => Math.round(n * 1000) / 1000;
const tempos = JSON.parse(readFileSync('../voz/tempos.json', 'utf8'));

// duração real de cada wav (ffprobe), cai no tempos.json se falhar
const durWav = (id, fallback) => {
  try { return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `assets/voz/${id}.wav`]).toString().trim()); }
  catch { return fallback; }
};
const durClip = {};
const dClip = (f) => (durClip[f] ??= Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `assets/clips/${f}`]).toString().trim()));

let t = 0;
const cenas = tempos.map((x, i) => {
  const voz = durWav(x.id, x.dur);
  const ultima = i === tempos.length - 1;
  const D = r3(voz + (ultima ? CAUDA : RESPIRO));
  const c = { id: x.id, inicio: r3(t), D, voz: r3(voz) };
  t += D;
  return c;
});
const TOTAL = r3(t);

// ---- sub-composições ----
mkdirSync('compositions', { recursive: true });
for (const c of cenas) writeFileSync(`compositions/${c.id}.html`, arquivoCena(c.id, c.D));

// ---- fundo de clipes ----
// Posição do rosto de cada trecho (acervo do reel): centraliza o corte vertical no rosto, não no meio do quadro.
const ACERVO = JSON.parse(readFileSync('../../../media/reels-clips/transicoes/transicoes.json', 'utf8')).transicoes;
function focoEm(f, t) {
  const a = ACERVO.find((x) => x.file === f);
  if (!a) return 0.5;
  const tr = a.focoTrilha || [];
  if (!tr.length) return a.foco ?? 0.5;
  return tr.reduce((m, p) => (Math.abs(p.t - t) < Math.abs(m.t - t) ? p : m)).foco;
}

let vi = 0;
const videos = [];
const kb = [];
for (const c of cenas) {
  const lista = CLIPES.find((x) => x.cena === c.id)?.clipes || [];
  const parte = c.D / Math.max(1, lista.length);
  lista.forEach((f, k) => {
    const ini = r3(c.inicio + k * parte), dur = r3(parte);
    const sobra = Math.max(0, dClip(f) - dur - 0.05);
    const mediaStart = r3((vi * 0.9) % (sobra + 0.001));
    const id = `bg${vi}`;
    const fx = (focoEm(f, mediaStart + dur / 2) * 100).toFixed(1);
    videos.push(`<div class="bgw" id="${id}w" style="transform-origin:${fx}% 40%"><video id="${id}" class="clip bgv" src="assets/clips/${f}" muted playsinline style="object-position:${fx}% 50%" data-start="${ini}" data-duration="${dur}" data-media-start="${mediaStart}" data-track-index="1"></video></div>`);
    kb.push(`tl.fromTo('#${id}w',{scale:${vi % 2 ? 1.18 : 1.06},x:${vi % 2 ? 12 : -12}},{scale:${vi % 2 ? 1.06 : 1.18},x:${vi % 2 ? -12 : 12},duration:${dur},ease:'none',immediateRender:false},${ini});`);
    vi++;
  });
}

const audios = cenas.map((c) => `<audio id="v${c.id}" src="assets/voz/${c.id}.wav" data-start="${c.inicio}" data-duration="${c.voz}" data-track-index="20" data-volume="1"></audio>`);
const slots = cenas.map((c) => `<div id="${c.id}" class="clip cena" data-composition-id="${c.id}" data-composition-src="compositions/${c.id}.html" data-start="${c.inicio}" data-duration="${c.D}" data-track-index="10" data-width="1080" data-height="1920"></div>`);
const tints = cenas.map((c) => `tl.set('#tint',{backgroundColor:'${CENAS[c.id].tint}'},${c.inicio});`);
const flashes = cenas.slice(1).map((c) => `tl.fromTo('#flash',{opacity:0.55},{opacity:0,duration:0.16,ease:'power2.out',immediateRender:false},${c.inicio});`);

const grain = readFileSync('compositions/components/grain-overlay.html', 'utf8').replace(/<!--[\s\S]*?-->/, '');

const index = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
@font-face{font-family:InterX;src:url(assets/fonts/Inter-ExtraBold.ttf)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${COR.bg}}
#root{width:100%;height:100%;position:relative;overflow:hidden;background:${COR.bg}}
.bgw{position:absolute;inset:0;overflow:hidden}
.bgv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#tint{position:absolute;inset:0;mix-blend-mode:multiply;opacity:.9}
#dark{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,.38) 35%,rgba(0,0,0,.45) 65%,rgba(0,0,0,.8) 100%)}
.cena{position:absolute;inset:0}
#flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
#selo{position:absolute;left:70px;top:1462px;font-family:InterX,sans-serif;font-size:26px;letter-spacing:.06em;color:${COR.ink};background:rgba(11,11,12,.78);padding:8px 16px;border-left:6px solid ${COR.ouro};white-space:nowrap}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
${videos.join('\n')}
<div id="tint"></div>
<div id="dark"></div>
${slots.join('\n')}
<div id="flash"></div>
<div id="selo">ESTUDO SMUFDPJ</div>
${grain}
${audios.join('\n')}
</div>
<script>
const tl=gsap.timeline({paused:true});
${kb.join('\n')}
${tints.join('\n')}
${flashes.join('\n')}
tl.set({}, {}, ${TOTAL});
window.__timelines['main']=tl;
</script>
</body>
</html>
`;
writeFileSync('index.html', index);

mkdirSync('../render', { recursive: true });
writeFileSync('../render/tempos.json', JSON.stringify(cenas.map((c) => ({ id: c.id, inicio: c.inicio, fim: r3(c.inicio + c.D) })), null, 1) + '\n');
console.log('total', TOTAL, 's,', vi, 'clipes de fundo');
console.log(cenas.map((c) => `${c.id} ${c.inicio}+${c.D}`).join('  '));
