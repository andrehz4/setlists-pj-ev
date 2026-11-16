// Story em VÍDEO (8 s, 1080x1920, MP4): o vídeo do Eddie em P&B passando atrás, o título entra, a folha cai, o selo
// "MEU PALPITE" bate e as cartas sobem. Mesmo desenho do story em foto (camadas de story.js), gravado no navegador da
// pessoa com canvas.captureStream + MediaRecorder. Só aparece onde o navegador grava MP4 (Instagram não aceita WebM)
// e fora do navegador interno de app (lá não dá pra salvar vídeo). Desligar: LIGADO = false ou ?sem-video na URL.
import { W, H, tela, carregar } from './story-pincel.js';
import { montar, fundo, medidor } from './story.js';
import { entregar, DENTRO_DE_APP } from './salvar.js';

const LIGADO = true;
const DURACAO = 8, FPS = 30;
const TIPOS = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4'];
const $ = (s) => document.querySelector(s);

export function formato() {
  if (!LIGADO || DENTRO_DE_APP || /[?&]sem-video/.test(location.search)) return null;
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return TIPOS.find((t) => MediaRecorder.isTypeSupported?.(t)) || null;
}

const fase = (t, ini, dur) => Math.min(1, Math.max(0, (t - ini) / dur));
const sai = (p) => 1 - (1 - p) ** 3;
const mola = (p) => { const s = 1.4, q = p - 1; return p >= 1 ? 1 : 1 + (s + 1) * q ** 3 + s * q ** 2; };

// Roteiro de entrada de cada camada no tempo t (s): opacidade, deslocamento, giro e escala em volta do centro.
function entrada(k, t, i) {
  if (k.nome === 'titulo') { const p = sai(fase(t, 0.15, 0.7)); return { a: p, dx: (1 - p) * -60 }; }
  if (k.nome === 'folha') { const p = fase(t, 0.6, 0.9); return { a: p > 0 ? 1 : 0, dy: (1 - mola(p)) * -1300, rot: (1 - sai(p)) * 0.18 }; }
  if (k.nome === 'selo') { const p = fase(t, 1.65, 0.3); return { a: p > 0 ? 1 : 0, esc: 1 + (1 - sai(p)) * 1.6 }; }
  if (k.nome === 'cta') return { a: sai(fase(t, 3.2, 0.5)) };
  const p = sai(fase(t, 2.1 + Math.max(0, i - 3) * 0.22, 0.55)); // índice, depois as cartas
  return { a: p, dy: (1 - p) * 140 };
}

function quadro(c, camadas, fonteFundo, t) {
  fundo(c, fonteFundo);
  camadas.forEach((k, i) => {
    const e = entrada(k, t, i);
    if (e.a <= 0) return;
    const cx = k.x + k.w / 2, cy = k.y + k.h / 2;
    c.save(); c.globalAlpha = e.a;
    c.translate(cx + (e.dx || 0), cy + (e.dy || 0)); c.rotate(e.rot || 0); c.scale(e.esc || 1, e.esc || 1); c.translate(-cx, -cy);
    c.drawImage(k.cv, k.x, k.y);
    if (k.extra) medidor(c, k.extra, sai(fase(t, 2.6, 1)));
    c.restore();
  });
}

function painel(cv) {
  $('#salvar-tela')?.remove();
  const p = document.createElement('div');
  p.id = 'salvar-tela';
  p.innerHTML = '<p class="estado" role="status" style="margin:0;font-weight:600">Gravando o seu story…</p><div class="botoes" hidden>' +
    '<button type="button" class="btn cheio">Postar no story</button><button type="button" class="btn">Fechar</button></div>';
  cv.style.cssText = 'max-width:100%;max-height:64vh;border-radius:6px;background:#000';
  p.insertBefore(cv, p.querySelector('.botoes'));
  document.body.append(p);
  return p;
}

// O fundo: um <video> próprio (o da página pode estar pausado). Se não tocar, fica a foto parada.
function fundoVivo() {
  const v = Object.assign(document.createElement('video'), { src: 'fundo-eddie.mp4', muted: true, loop: true, playsInline: true });
  v.setAttribute('playsinline', '');
  const tocando = v.play().then(() => v, () => null);
  return { v, tocando };
}

async function gravar(tipo) {
  const { v, tocando } = fundoVivo(); // play() ainda dentro do toque, senão o iOS bloqueia
  const [camadas, vivo, foto] = await Promise.all([montar($('#folha')), tocando, carregar('fundo-eddie-quadro.jpg')]);
  const cv = tela(W, H), c = cv.getContext('2d');
  const p = painel(cv), estado = p.querySelector('.estado');
  const rec = new MediaRecorder(cv.captureStream(FPS), { mimeType: tipo, videoBitsPerSecond: 6e6 });
  const partes = [];
  rec.ondataavailable = (e) => { if (e.data.size) partes.push(e.data); };
  const fim = new Promise((ok, erro) => { rec.onstop = ok; rec.onerror = (e) => erro(e.error || e); });
  quadro(c, camadas, vivo || foto, 0);
  rec.start(1000);
  const t0 = performance.now();
  await new Promise((ok) => {
    const passo = () => {
      const t = (performance.now() - t0) / 1000;
      quadro(c, camadas, vivo && v.readyState >= 2 ? v : foto, Math.min(t, DURACAO));
      estado.textContent = `Gravando o seu story… ${Math.min(DURACAO, Math.ceil(t))}/${DURACAO} s`;
      if (t >= DURACAO + 0.2) ok(); else requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  rec.stop(); v.pause();
  await fim;
  if (!partes.length) throw new Error('gravação vazia');
  return { blob: new Blob(partes, { type: tipo.split(';')[0] }), p };
}

async function storyVideo(b, tipo) {
  if (b.disabled || b.classList.contains('gerando')) return;
  b.classList.add('gerando');
  const nome = `setlist-eddie-ibirapuera-${/22\/11/.test($('#r-show')?.textContent) ? '22' : '20'}-11-story.mp4`;
  try {
    const { blob, p } = await gravar(tipo);
    const url = URL.createObjectURL(blob);
    const vid = Object.assign(document.createElement('video'), { src: url, muted: true, loop: true, autoplay: true, playsInline: true });
    vid.setAttribute('playsinline', ''); vid.style.cssText = p.querySelector('canvas').style.cssText;
    p.querySelector('canvas').replaceWith(vid);
    p.querySelector('.estado').textContent = 'Pronto! Posta e marca @smufdpj';
    p.querySelector('.botoes').hidden = false;
    const [postar, fechar] = p.querySelectorAll('.botoes button');
    // Novo toque da pessoa: o compartilhar do celular exige um gesto recente, e a gravação levou 8 s.
    postar.onclick = () => entregar(blob, nome, { compartilhar: matchMedia('(pointer: coarse)').matches });
    fechar.onclick = () => { p.remove(); URL.revokeObjectURL(url); };
  } catch (e) {
    $('#salvar-tela')?.remove();
    $('#aviso').textContent = 'O vídeo não saiu neste celular. Baixe a imagem pro story.';
  }
  b.classList.remove('gerando');
}

const tipo = formato();
const b = $('#story-video');
if (tipo && b) {
  b.hidden = false;
  const ref = $('#story'), espelhar = () => { b.disabled = ref.disabled; };
  new MutationObserver(espelhar).observe(ref, { attributes: true, attributeFilter: ['disabled'] });
  espelhar();
  b.addEventListener('click', () => storyVideo(b, tipo));
}
