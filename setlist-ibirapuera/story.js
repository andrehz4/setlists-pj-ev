// Story 1080x1920 pra postar: título do resultado no topo ("ANDRÉ, O SEU / SETLIST NO IBIRAPUERA"), a folha no meio com o
// selo "MEU PALPITE", o veredito do índice de sorte em letra grande e 2 cartas embaixo. Lê o que a tela de resultado já
// mostra (#r-show, #r-nome, #sorte), então fica igual ao site. Texto fora das faixas que o Instagram cobre (topo ~160 px,
// rodapé ~260 px). O desenho sai em camadas (montar) pra o story em vídeo (story-video.js) animar a entrada de cada uma.
import { W, H, M, COR, DISP, CORPO, carregar, fontes, tela, caixa, linha, quebrar, pedacos, tamanho, VAL, TXT, rotulo } from './story-pincel.js';

const $ = (s) => document.querySelector(s);
const D = 30; // desce tudo um pouco: o topo e o rodapé ficam com folga parecida pras faixas do Instagram
const FOLHA = { y: 458 + D, larg: 520 }, INDICE = { y: 1146 + D, h: 210 }, CARTAS = { y: 1372 + D, h: 176 }, CTA = { y: 1574 + D, h: 64 };
const PREFERIDAS = ['Sua raridade', 'Chance de ouvir todas', 'Sua aposta certa', 'Tocadas em 2026', 'Num show típico'];

// Fundo: quadro do vídeo do Eddie (foto ou o próprio <video>) no alto, sumindo no escuro.
export function fundo(c, quadro) {
  c.fillStyle = COR.noite; c.fillRect(0, 0, W, H);
  if (!quadro) return;
  c.globalAlpha = 0.42; c.drawImage(quadro, -260, 0, 1600, 900); c.globalAlpha = 1;
  const g = c.createLinearGradient(0, 200, 0, 900); g.addColorStop(0, 'rgba(15,14,12,.25)'); g.addColorStop(1, COR.noite);
  c.fillStyle = g; c.fillRect(0, 0, W, 900);
}

function titulo(c) {
  rotulo(c, M, 196 + D, $('#r-show')?.textContent || 'Ibirapuera', COR.ouro, 22);
  const base = { fonte: tamanho(112, DISP, 900), cor: COR.texto };
  const linhas = [[]]; // o <br> do #r-nome separa as duas linhas
  for (const n of $('#r-nome')?.childNodes || []) {
    if (n.nodeName === 'BR') linhas.push([]);
    else linhas.at(-1).push({ ...base, cor: n.nodeName === 'EM' ? COR.ouro : COR.texto, t: n.textContent.toUpperCase() });
  }
  if (!linhas[0].length) linhas[0] = [{ ...base, t: 'O SEU SETLIST' }];
  linhas.filter((l) => l.length).slice(0, 2).forEach((ped, i) => { ped[0].t = ped[0].t.trimStart(); linha(c, M - 4, 312 + D + i * 104, ped, W - 2 * M); });
}

// Selo vermelho colado no canto da folha: deixa claro que é palpite (não o setlist de verdade) e dá cara de coisa sua.
export const SELO = { x: (W + FOLHA.larg) / 2 + 6, y: FOLHA.y + 52, r: 86 };
function selo(c) {
  const data = ($('#r-show')?.textContent.match(/\d\d\/\d\d/) || ['20/11'])[0].replace('/', '.');
  c.save(); c.translate(SELO.x, SELO.y); c.rotate(0.2);
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
  c.beginPath(); c.arc(0, 0, SELO.r, 0, Math.PI * 2); c.fillStyle = COR.tinta; c.fill(); c.shadowColor = 'transparent';
  c.setLineDash([7, 6]); c.strokeStyle = 'rgba(255,240,220,.7)'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, SELO.r - 10, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#fff4e6'; c.textAlign = 'center';
  c.font = `900 34px ${DISP}`; c.fillText('MEU', 0, -18);
  c.font = `900 46px ${DISP}`; c.fillText('PALPITE', 0, 24);
  c.font = `700 17px ${CORPO}`; c.letterSpacing = '3px'; c.fillText(data, 0, 52); c.letterSpacing = '0px';
  c.restore();
}

function folhaNoMeio(c, folha) {
  const larg = FOLHA.larg, y = FOLHA.y, x = (W - larg) / 2, alt = folha.height * (larg / folha.width), cx = x + larg / 2;
  c.save(); c.translate(cx, y + alt / 2); c.rotate(-0.012); c.translate(-cx, -(y + alt / 2));
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
  c.drawImage(folha, x, y, larg, alt); c.restore();
  c.fillStyle = 'rgba(222,205,160,.85)';
  for (const [fx, ang] of [[x + 46, -0.2], [x + larg - 230, 0.1]]) {
    c.save(); c.translate(fx + 50, y + 2); c.rotate(ang); c.fillRect(-55, -16, 110, 32); c.restore();
  }
}

// Carta dourada: veredito grande ("PÉ QUENTE"), a explicação embaixo e o índice à direita. Devolve o medidor
// (o vídeo enche a barra aos poucos; a foto pinta cheia).
function cartaIndice(c, el) {
  const { y, h } = INDICE;
  caixa(c, M, y, W - 2 * M, h, 26, COR.ouro);
  rotulo(c, M + 30, y + 44, el.querySelector('.rot').textContent, 'rgba(26,19,5,.7)');
  const ver = (el.querySelector('.txt b')?.textContent || '').replace(/[.!]\s*$/, '').toUpperCase();
  linha(c, M + 28, y + 136, [{ fonte: tamanho(80, DISP, 900), cor: COR.esc, t: ver }], 620);
  linha(c, M + 30, y + 174, pedacos(el.querySelector('.txt'), TXT('rgba(26,19,5,.78)', COR.esc, 23), 'B'), 640);
  linha(c, W - M - 30, y + 140, pedacos(el.querySelector('.val'), VAL(COR.esc, 'rgba(26,19,5,.55)', 128)), 300, 'right');
  const med = { x: M + 30, y: y + h - 26, w: W - 2 * M - 60, h: 12, pct: parseFloat(el.querySelector('.medidor i')?.style.width) || 0 };
  caixa(c, med.x, med.y, med.w, med.h, 6, 'rgba(26,19,5,.18)');
  return med;
}

export function medidor(c, med, fracao = 1) {
  caixa(c, med.x, med.y, Math.max(12, med.w * (med.pct / 100) * fracao), med.h, 6, COR.esc);
}

function carta(c, el, x, w) {
  const { y, h } = CARTAS;
  caixa(c, x, y, w, h, 22, COR.carta, COR.linha);
  rotulo(c, x + 26, y + 42, el.querySelector('.rot').textContent, COR.fraco);
  linha(c, x + 26, y + 104, pedacos(el.querySelector('.val'), VAL(COR.texto, COR.fraco, 62)), w - 52);
  quebrar(c, x + 26, y + 136, pedacos(el.querySelector('.txt'), TXT(COR.fraco, COR.texto, 21)), w - 52, 26);
}

function cta(c) {
  const { y, h } = CTA, txt = [{ fonte: tamanho(24, CORPO, 700), cor: COR.ouro, t: 'Sorteie o seu: ' },
    { fonte: tamanho(24, CORPO, 500), cor: COR.texto, t: 'somaisumfadepearljam.com.br/setlist-ibirapuera' }];
  c.font = txt[1].fonte(1);
  const w = Math.min(W - 2 * M, c.measureText(txt[0].t + txt[1].t).width + 70);
  caixa(c, (W - w) / 2, y, w, h, h / 2, 'rgba(15,14,12,.7)', 'rgba(232,176,74,.55)');
  linha(c, W / 2, y + h / 2 + 9, txt, w - 50, 'center');
}

// Cada camada vira um canvas recortado (barato de desenhar 30 vezes por segundo no vídeo).
function camada(nome, x, y, w, h, pintar) {
  const cv = tela(w, h), c = cv.getContext('2d');
  c.translate(-x, -y);
  const extra = pintar(c);
  return { nome, x, y, w, h, cv, extra };
}

export async function montar(folha) {
  await fontes();
  const cartas = [...document.querySelectorAll('#sorte .carta:not(.esqueleto)')];
  const ind = cartas.find((el) => el.classList.contains('indice'));
  const resto = cartas.filter((el) => el !== ind).sort((a, b) => {
    const p = (el) => { const i = PREFERIDAS.indexOf(el.querySelector('.rot')?.textContent.trim()); return i < 0 ? 99 : i; };
    return p(a) - p(b);
  }).slice(0, 2);
  const altFolha = folha.height * (FOLHA.larg / folha.width), wc = resto.length > 1 ? (W - 2 * M - 16) / 2 : W - 2 * M;
  const camadas = [camada('titulo', 0, 120 + D, W, 330, titulo),
    camada('folha', 0, FOLHA.y - 90, W, altFolha + 190, (c) => folhaNoMeio(c, folha)),
    camada('selo', SELO.x - SELO.r - 30, SELO.y - SELO.r - 30, 2 * SELO.r + 60, 2 * SELO.r + 60, selo)];
  if (ind) camadas.push(camada('indice', 0, INDICE.y, W, INDICE.h, (c) => cartaIndice(c, ind)));
  resto.forEach((el, i) => camadas.push(camada('carta', M + i * (wc + 16), CARTAS.y, wc, CARTAS.h, (c) => carta(c, el, M + i * (wc + 16), wc))));
  camadas.push(camada('cta', 0, CTA.y, W, CTA.h, cta));
  return camadas;
}

export async function story(folha) {
  const [camadas, quadro] = await Promise.all([montar(folha), carregar('fundo-eddie-quadro.jpg')]);
  const s = tela(W, H), c = s.getContext('2d');
  fundo(c, quadro);
  for (const k of camadas) { c.drawImage(k.cv, k.x, k.y); if (k.extra) medidor(c, k.extra); }
  return s;
}
