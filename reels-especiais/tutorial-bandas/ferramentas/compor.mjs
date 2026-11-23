// Gera o HTML (HyperFrames) a partir da linha do tempo, do roteiro e dos clipes.
// Blaymorphed: index.html. Outra banda (BANDA=<slug>): tutorial-<slug>.html, com textos de bandas/<slug>.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { linha } from './tempos.mjs';
import { B, RAIZ as R, falas as lerFalas } from './banda.mjs';
const { cenas, cartelas, total } = linha();
const falas = lerFalas(), T = B.tela, A = B.A;
const C = (n) => cenas.find((c) => c.n === n);
const f2 = (x) => (+x).toFixed(3);
// Legendas: frases quebradas em pedaços de até ~64 letras, tempo proporcional ao tamanho.
function pedacos(t) {
  const frases = t.trim().match(/[^.?!:]+[.?!:]?/g).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const fr of frases) {
    if (fr.length <= 64) { out.push(fr); continue; }
    let atual = '';
    for (const p of fr.split(/(?<=,)\s/)) { if ((atual + ' ' + p).trim().length > 64 && atual) { out.push(atual.trim()); atual = p; } else atual = (atual + ' ' + p).trim(); }
    if (atual) out.push(atual);
  }
  // ainda grande: corta por palavras
  return out.flatMap((s) => { if (s.length <= 74) return [s]; const w = s.split(' '), m = Math.ceil(w.length / 2); return [w.slice(0, m).join(' '), w.slice(m).join(' ')]; });
}
let legs = '', li = 0;
for (const c of cenas) {
  const ps = pedacos(falas[c.n]); const soma = ps.reduce((s, p) => s + p.length, 0); let t = c.voz;
  for (const p of ps) { const d = c.fala * p.length / soma; legs += `<div id="lg${li++}" class="leg clip" data-start="${f2(t)}" data-duration="${f2(d)}" data-track-index="20"><span>${p}</span></div>\n`; t += d; }
}
// Textos de apoio (em cima)
const AP = [
  [1, 0.2, 'isso é de vocês', B.nome.toUpperCase()],
  [2, 0, '@smufdpj', `somaisumfadepearljam.com.br<br><b>/setlist/${B.slug}</b>`, 'url'],
  [3, 0, 'lidos da agenda do site', 'O fã escolhe <b>o show</b>'],
  [4, 0, 'busca, ordem e bis', 'Até <b>24 músicas</b>'],
  [5, 0, 'na folha', 'Logo, <b>casa e data</b>'],
  [6, 0, 'gravação de show no Brasil sempre que tem', 'Ouça <b>antes do show</b>'],
  [7, 0, 'vídeo, Instagram e WhatsApp', 'Três botões pra <b>espalhar</b>'],
  [8, 0, 'pode divulgar sem medo', 'Nome com palavrão <b>não passa</b>'],
  [9, 0, 'antes da agenda de segunda', 'A gente olha <b>o post de vocês</b>'],
  [10, 0, ...(T.apoio10 || [])],
  [11, 0, 'na legenda, não só na arte', 'Data, hora, <b>@ da casa</b>, cidade'],
  [13, 0, 'qualquer coisa, é só responder aqui', 'A página é <b>de vocês</b>'],
].filter(([n]) => !B.sem.includes(n)).map((a) => (T.apoio?.[a[0]] ? [a[0], a[1], ...T.apoio[a[0]]] : a));
const apoio = AP.map(([n, off, k, t, cls = ''], i) => { const c = C(n); return `<section id="ap${i}" class="apoio clip ${cls}" data-start="${f2(c.ini + off)}" data-duration="${f2(c.dur - off)}" data-track-index="10"><div class="k">${k}</div><div class="t">${t}</div></section>`; }).join('\n');
const clips = [1, 2, 3, 4, 5, 6, 7, 8, 10].filter((n) => C(n)).map((n) => { const c = C(n); return `<video id="cv${n}" class="tela-v" src="${A}clipes/c${n}.mp4" data-start="${f2(c.ini)}" data-duration="${f2(c.dur)}" data-track-index="2" muted playsinline></video>`; }).join('\n');
const cart = cartelas.map((k, i) => `<section id="ct${i}" class="cartela clip" data-start="${f2(k.ini)}" data-duration="${f2(k.dur)}" data-track-index="15"><div class="num">${i + 1}/4</div><div class="tt">${k.titulo}</div></section>`).join('\n');
const FD = B.base ? 21 : Math.floor(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', B.ASS + 'fundo-banda.mp4']).toString() * 10) / 10;
const fundo = Array.from({ length: Math.ceil(total / FD) }, (_, i) => `<video id="bg${i}" class="bg" src="${A}fundo-banda.mp4" data-start="${+(i * FD).toFixed(3)}" data-duration="${Math.min(FD, total - i * FD).toFixed(3)}" data-track-index="0" muted playsinline></video>`).join('\n');
const c7 = C(7), c9 = C(9), c10 = C(10) || { ini: 0, dur: 8.2 }, c11 = C(11), c12 = C(12), c13 = C(13);
// Balão da cena 10: na Blaymorphed entra aos 8,2 s; nas outras, cena mais curta, aos 40% dela.
const W10 = B.base ? 8.2 : +Math.min(8.2, c10.dur * 0.4).toFixed(2);
// Painéis da cena 12 casados com a fala (proporção de letras até cada gancho)
const f12 = falas[12].trim(), em = (g) => c12.voz + c12.fala * f12.indexOf(g) / f12.length;
const q = [c12.ini, em('Dá pra repostar'), em('Dá pra imprimir'), em('E dá pra montar'), c12.ini + c12.dur];
const p12 = q[1] - q[0];
const sfx = [...cartelas.map((k) => [k.ini, 'swoosh', 0.4, 0.7]), [C(1).ini + 0.3, 'caneta-curta', 0.25, 2.9], [c11.ini + 2.2, 'plim', 0.3, 1.0], [c11.ini + 12.5, 'pop', 0.4, 0.3]]
  .map(([t, s, v, d], i) => `<audio id="fx${i}" src="assets/sfx/${s}.wav" data-start="${f2(t)}" data-duration="${d}" data-track-index="${30 + (i % 2)}" data-volume="${v}"></audio>`).join('\n');
let html = readFileSync(R + 'ferramentas/molde.html', 'utf8');
const W = T.wa10, WA10 = !W || B.sem.includes(10) ? '' : `<section id="wa10" class="zap clip" data-start="{{C10W}}" data-duration="{{C10WD}}" data-track-index="12">
        <div class="h">${W.h}</div>
        ${W.t}
        <div>${W.faltas.map((f) => `<span class="falta">${f}</span>`).join('')}</div>
      </section>`;
const MODELO = T.modelo.map(([v, k]) => `<div class="it"><i>✓</i>${v}<small>${k}</small></div>`).join('\n          ');
html = html.replace('{{WA10}}', WA10);
const V = { TITULO: `Tutorial ${B.nome}`, A, SLUG: B.slug, ARROBA: B.arroba, ARROBA_M: B.arroba.toUpperCase(), QR: B.base ? 'qr-blaymorphed.png' : 'qr.png',
  CONVITE: T.convite, POST_IMG: T.postImg, POST_LEG: T.postLeg, MODELO, CHAMADA: T.chamada, TOTAL: total.toFixed(3), FUNDO: fundo, CLIPS: clips, APOIO: apoio, LEGS: legs, CART: cart, SFX: sfx,
  C7W: f2(c7.ini + 13.6), C7WD: f2(c7.dur - 13.6), C9: f2(c9.ini), C9D: f2(c9.dur), C10W: f2(c10.ini + W10), C10WD: f2(c10.dur - W10),
  C11: f2(c11.ini), C11D: f2(c11.dur), C11B: f2(c11.ini + 12.0), C11BD: f2(c11.dur - 12.0),
  P1: f2(q[0]), P2: f2(q[1]), P3: f2(q[2]), P4: f2(q[3]), PD1: f2(q[1] - q[0]), PD2: f2(q[2] - q[1]), PD3: f2(q[3] - q[2]), PD4: f2(q[4] - q[3]),
  C13: f2(c13.ini), C13D: f2(c13.dur), CV12: f2(q[3]),
  TIMES: JSON.stringify({ cenas, cartelas, c7w: c7.ini + 13.6, c10w: c10.ini + W10, c11b: c11.ini + 12, p12 }) };
html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => V[k] ?? `{{${k}}}`);
writeFileSync(R + B.HTML, html); console.log(B.HTML, total);
