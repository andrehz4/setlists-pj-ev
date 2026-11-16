// Story em VÍDEO (8 s, 1080x1920, MP4): o vídeo do Eddie em P&B passando atrás, o título entra, a folha cai, as cartas
// sobem uma por uma com os números contando de 0 e a barra do índice enchendo. Mesmo desenho do story em foto (camadas de story.js), gravado no navegador da
// pessoa com canvas.captureStream + MediaRecorder. Só aparece onde o navegador grava MP4 (Instagram pode recusar WebM).
// No navegador interno do Instagram/Facebook o botão ensina a abrir no Safari/Chrome. Falhou: oferece a imagem na hora. Desligar: LIGADO = false ou ?sem-video na URL.
import { W, H, tela, carregar } from './story-pincel.js';
import { montar, fundo, medidor, numero } from './story.js';
import { entregar, DENTRO_DE_APP } from './salvar.js';

const LIGADO = true;
const DURACAO = 8, FPS = 30;
const TIPOS = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4'];
const $ = (s) => document.querySelector(s);

// 'app' = navegador interno do Instagram/Facebook: o botão aparece, mas ensina a abrir no Safari/Chrome.
export function formato() {
  if (!LIGADO || /[?&]sem-video/.test(location.search)) return null;
  if (DENTRO_DE_APP) return 'app';
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return TIPOS.find((t) => MediaRecorder.isTypeSupported?.(t)) || null;
}

const fase = (t, ini, dur) => Math.min(1, Math.max(0, (t - ini) / dur));
const sai = (p) => 1 - (1 - p) ** 3;
const mola = (p) => { const s = 1.4, q = p - 1; return p >= 1 ? 1 : 1 + (s + 1) * q ** 3 + s * q ** 2; };

// Roteiro no tempo t (s): o título entra, a folha cai, as cartas sobem uma por uma (j = ordem da carta) e cada número
// conta de 0 até o valor logo depois que a carta chega; a barra do índice enche junto.
const chega = (j) => 1.5 + j * 0.3;
function entrada(k, t) {
  if (k.nome === 'titulo') { const p = sai(fase(t, 0.15, 0.7)); return { a: p, dx: (1 - p) * -60 }; }
  if (k.nome === 'folha') { const p = fase(t, 0.5, 0.85); return { a: p > 0 ? 1 : 0, dy: (1 - mola(p)) * -1300, rot: (1 - sai(p)) * 0.18 }; }
  if (k.nome === 'cta') return { a: sai(fase(t, chega(6) + 0.3, 0.5)) };
  const p = mola(fase(t, chega(k.j), 0.5));
  return { a: Math.min(1, fase(t, chega(k.j), 0.25)), dy: (1 - p) * 160, conta: sai(fase(t, chega(k.j) + 0.2, 1.1)) };
}

function quadro(c, camadas, fonteFundo, t) {
  fundo(c, fonteFundo);
  for (const k of camadas) {
    const e = entrada(k, t);
    if (e.a <= 0) continue;
    const cx = k.x + k.w / 2, cy = k.y + k.h / 2;
    c.save(); c.globalAlpha = e.a;
    c.translate(cx + (e.dx || 0), cy + (e.dy || 0)); c.rotate(e.rot || 0); c.translate(-cx, -cy);
    c.drawImage(k.cv, k.x, k.y);
    if (k.medidor) medidor(c, k.medidor, e.conta);
    if (k.numero) numero(c, k.numero, e.conta);
    c.restore();
  }
}

function painel(cv) {
  $('#salvar-tela')?.remove();
  const p = document.createElement('div');
  p.id = 'salvar-tela';
  p.innerHTML = '<p class="estado" role="status" style="margin:0;font-weight:600">Gravando o seu story…</p><div class="botoes" hidden>' +
    '<button type="button" class="btn cheio">Postar no story</button><button type="button" class="btn">Fechar</button></div>';
  p.querySelector('.estado').style.cssText += ';max-width:420px;text-align:center;line-height:1.45';
  if (cv) { cv.style.cssText = 'max-width:100%;max-height:64vh;border-radius:6px;background:#000'; p.insertBefore(cv, p.querySelector('.botoes')); }
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
  camadas.filter((k) => k.nome === 'carta').forEach((k, j) => { k.j = j; });
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

// Tela de recado com uma saída (ex.: baixar a imagem) e Fechar.
function recado(txt, rotuloAcao, acao) {
  const p = painel(null);
  p.querySelector('.estado').textContent = txt;
  p.querySelector('.botoes').hidden = false;
  const [sim, fechar] = p.querySelectorAll('.botoes button');
  sim.textContent = rotuloAcao;
  sim.onclick = () => { p.remove(); acao(); };
  fechar.onclick = () => p.remove();
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
    $('#aviso').textContent = 'O vídeo não saiu neste celular. A imagem sai na hora.';
    recado('O vídeo não saiu neste celular. Quer a imagem pro story? Sai na hora.', 'Baixar a imagem', () => $('#story').click());
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
  b.addEventListener('click', () => (tipo === 'app'
    ? recado('O Instagram não deixa baixar vídeo por aqui. Toque no menu ••• lá em cima, escolha "Abrir no navegador" '
      + '(Safari ou Chrome) e toque de novo em "Baixar o vídeo pro story". A imagem funciona aqui mesmo.', 'Baixar a imagem', () => $('#story').click())
    : storyVideo(b, tipo)));
}
