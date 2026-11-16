// Story 1080x1920 pra postar: título do resultado no topo ("ANDRÉ, O SEU / SETLIST NO IBIRAPUERA"), a folha no meio e as 6
// cartas de sorte embaixo (o veredito do índice em letra grande). Lê o que a tela de resultado já mostra (#r-show, #r-nome,
// #sorte), então fica igual ao site. A posição de tudo vem de story-layout.js (a folha fica com o espaço que sobra).
// O desenho sai em camadas (montar) pra o story em vídeo (story-video.js) animar cada uma; o número de cada carta é
// desenhado à parte (numero), pra o vídeo contar de 0 até o valor.
import { W, H, M, COR, DISP, carregar, fontes, tela, caixa, linha, quebrar, pedacos, tamanho, VAL, TXT, rotulo } from './story-pincel.js';
import { rodape, sublinhar } from './story-rodape.js';
import { layout } from './story-layout.js';

const $ = (s) => document.querySelector(s);
const REF = 400; // largura em que fitas e sombra têm o tamanho 1 (crescem junto com a folha)
const ORDEM = ['Sua raridade', 'Sua aposta certa', 'Tocadas em 2026', 'Num show típico'];

// Fundo: quadro do vídeo do Eddie (foto ou o próprio <video>) no alto, sumindo no escuro.
export function fundo(c, quadro) {
  c.fillStyle = COR.noite; c.fillRect(0, 0, W, H);
  if (!quadro) return;
  c.globalAlpha = 0.42; c.drawImage(quadro, -260, 0, 1600, 900); c.globalAlpha = 1;
  const g = c.createLinearGradient(0, 200, 0, 900); g.addColorStop(0, 'rgba(15,14,12,.25)'); g.addColorStop(1, COR.noite);
  c.fillStyle = g; c.fillRect(0, 0, W, 900);
}

function titulo(c) {
  rotulo(c, M, 186, $('#r-show')?.textContent || 'Ibirapuera', COR.ouro, 22);
  const base = { fonte: tamanho(108, DISP, 900), cor: COR.texto };
  const linhas = [[]]; // o <br> do #r-nome separa as duas linhas
  const longo = $('#r-nome .nome-longo'); // nome comprido: no site ganha linha própria; no story volta pro "NOME, O SEU / SETLIST NO IBIRAPUERA:"
  if (longo) linhas.splice(0, 1, [{ ...base, cor: COR.ouro, t: longo.textContent.toUpperCase() }, { ...base, t: ' O SEU' }], [{ ...base, t: 'SETLIST NO IBIRAPUERA:' }]);
  else for (const n of $('#r-nome')?.childNodes || []) {
    if (n.nodeName === 'BR') linhas.push([]);
    else linhas.at(-1).push({ ...base, cor: n.nodeName === 'EM' ? COR.ouro : COR.texto, t: n.textContent.toUpperCase() });
  }
  if (!linhas[0].length) linhas[0] = [{ ...base, t: 'O SEU SETLIST' }];
  linhas.filter((l) => l.length).slice(0, 2).forEach((ped, i) => { ped[0].t = ped[0].t.trimStart(); linha(c, M - 4, 296 + i * 100, ped, W - 2 * M); });
}

// Posição da folha no story e o giro leve. O vídeo escreve a folha grande (larg e y próprios) e depois encolhe pra
// a da imagem (a camada 'folha' leva essa geo).
export function geoFolha(folha, larg, y) {
  const x = (W - larg) / 2, alt = folha.height * (larg / folha.width);
  return { x, y, larg, alt, cx: x + larg / 2, cy: y + alt / 2, giro: -0.012 };
}

export function folhaNoMeio(c, folha, geo) {
  const { x, y, larg, alt, cx, cy, giro } = geo;
  c.save(); c.translate(cx, cy); c.rotate(giro); c.translate(-cx, -cy);
  const k = larg / REF;
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40 * k; c.shadowOffsetY = 14 * k;
  c.drawImage(folha, x, y, larg, alt); c.restore();
  fitas(c, x, y, larg);
}

// Fitas crepe no topo; crescem junto com a folha (k = 1 no tamanho da imagem).
export function fitas(c, x, y, larg) {
  const k = larg / REF;
  c.fillStyle = 'rgba(222,205,160,.85)';
  for (const [fx, ang] of [[x + 36 * k, -0.2], [x + larg - 136 * k, 0.16]]) {
    c.save(); c.translate(fx + 50 * k, y + 2 * k); c.rotate(ang); c.fillRect(-50 * k, -15 * k, 100 * k, 30 * k); c.restore();
  }
}

// Carta dourada: veredito grande ("PÉ QUENTE"), a explicação embaixo, o índice à direita e o medidor.
function cartaIndice(c, el, { y, h }) {
  caixa(c, M, y, W - 2 * M, h, 22, COR.ouro);
  rotulo(c, M + 28, y + 30, el.querySelector('.rot').textContent, 'rgba(26,19,5,.7)', 18);
  const ver = (el.querySelector('.txt b')?.textContent || '').replace(/[.!]\s*$/, '').toUpperCase();
  linha(c, M + 26, y + 84, [{ fonte: tamanho(54, DISP, 900), cor: COR.esc, t: ver }], 620);
  linha(c, M + 28, y + 107, pedacos(el.querySelector('.txt'), TXT('rgba(26,19,5,.78)', COR.esc, 20), 'B'), 640);
  caixa(c, M + 28, y + h - 12, W - 2 * M - 56, 6, 3, 'rgba(26,19,5,.18)');
  return { medidor: { x: M + 28, y: y + h - 12, w: W - 2 * M - 56, h: 6, pct: parseFloat(el.querySelector('.medidor i')?.style.width) || 0 },
    numero: { ped: pedacos(el.querySelector('.val'), VAL(COR.esc, 'rgba(26,19,5,.55)', 88)), x: W - M - 28, y: y + 92, w: 290, al: 'right' } };
}

// Carta deitada (baixa, pra sobrar altura pra folha): número à esquerda, rótulo e explicação (até 2 linhas) à direita.
function carta(c, el, x, y, w, h) {
  const tx = x + 166;
  caixa(c, x, y, w, h, 18, COR.carta, COR.linha);
  rotulo(c, tx, y + 28, el.querySelector('.rot').textContent, COR.fraco, 15);
  quebrar(c, tx, y + 51, pedacos(el.querySelector('.txt'), TXT(COR.fraco, COR.texto, 18)), x + w - 18 - tx, 21);
  return { numero: { ped: pedacos(el.querySelector('.val'), VAL(COR.texto, COR.fraco, 46)), x: x + 22, y: y + 58, w: 130 } };
}

// "Chance de ouvir todas" ocupa a largura toda: número à esquerda, explicação em 2 linhas à direita.
function cartaChance(c, el, { y, h }) {
  const x = M, w = W - 2 * M;
  caixa(c, x, y, w, h, 18, COR.carta, COR.linha);
  rotulo(c, x + 22, y + 24, el.querySelector('.rot').textContent, COR.fraco, 15);
  quebrar(c, x + 440, y + 31, pedacos(el.querySelector('.txt'), TXT(COR.fraco, COR.texto, 19)), w - 462, 24);
  return { numero: { ped: pedacos(el.querySelector('.val'), VAL(COR.texto, COR.fraco, 40)), x: x + 22, y: y + 62, w: 400 } };
}

// Número da carta; f < 1 conta de 0 até o valor (só os algarismos grandes, "1 em" e expoente ficam).
export function numero(c, n, f = 1) {
  const ped = f >= 1 ? n.ped : n.ped.map((p) => (p.fixo ? p : { ...p, t: p.t.replace(/\d+(?:,\d+)?/g, (v) => {
    const casas = (v.split(',')[1] || '').length, num = parseFloat(v.replace(',', '.')) * f;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }) }));
  linha(c, n.x, n.y, ped, n.w, n.al);
}

export function medidor(c, med, f = 1) {
  caixa(c, med.x, med.y, Math.max(10, med.w * (med.pct / 100) * f), med.h, 5, COR.esc);
}

// Cada camada vira um canvas recortado (barato de desenhar 30 vezes por segundo no vídeo).
function camada(nome, x, y, w, h, pintar) {
  const cv = tela(w, h), c = cv.getContext('2d');
  c.translate(-x, -y);
  return { nome, x, y, w, h, cv, ...(pintar(c) || {}) };
}

export async function montar(folha) {
  await fontes();
  const cartas = [...document.querySelectorAll('#sorte .carta:not(.esqueleto)')];
  const ind = cartas.find((el) => el.classList.contains('indice'));
  const chance = cartas.find((el) => el.classList.contains('larga') && el !== ind);
  const rot = (el) => el.querySelector('.rot')?.textContent.trim();
  const grade = cartas.filter((el) => el !== ind && el !== chance).sort((a, b) => ORDEM.indexOf(rot(a)) - ORDEM.indexOf(rot(b))).slice(0, 4);
  const g = layout({ indice: !!ind, linhas: Math.ceil(grade.length / 2), chance: !!chance, prop: folha.height / folha.width });
  const geo = geoFolha(folha, g.folha.larg, g.folha.y), wc = (W - 2 * M - (g.grade?.gap || 0)) / 2;
  const camadas = [camada('titulo', 0, 110, W, 320, titulo),
    camada('folha', 0, geo.y - 80, W, geo.alt + 190, (c) => { folhaNoMeio(c, folha, geo); return { geo }; })];
  if (ind) camadas.push(camada('carta', 0, g.indice.y, W, g.indice.h, (c) => cartaIndice(c, ind, g.indice)));
  grade.forEach((el, i) => {
    const x = M + (i % 2) * (wc + g.grade.gap), y = g.grade.y + Math.floor(i / 2) * (g.grade.h + g.grade.gap);
    camadas.push(camada('carta', x, y, wc, g.grade.h, (c) => carta(c, el, x, y, wc, g.grade.h)));
  });
  if (chance) camadas.push(camada('carta', 0, g.chance.y, W, g.chance.h, (c) => cartaChance(c, chance, g.chance)));
  camadas.push(...rodape(camada, await carregar('img/logo-smufdpj.png?v=2'), g.rodape.y));
  return camadas;
}

export async function story(folha) {
  const [camadas, quadro] = await Promise.all([montar(folha), carregar('fundo-eddie-quadro.jpg')]);
  const s = tela(W, H), c = s.getContext('2d');
  fundo(c, quadro);
  for (const k of camadas) {
    c.drawImage(k.cv, k.x, k.y);
    if (k.medidor) medidor(c, k.medidor);
    if (k.numero) numero(c, k.numero);
    if (k.sublinhado) sublinhar(c, k.sublinhado);
  }
  return s;
}
