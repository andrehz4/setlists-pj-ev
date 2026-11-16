// Story em VÍDEO (15 a 20 s, 1080x1920, MP4): o vídeo do Eddie em P&B passando atrás, a folha escrita na hora, a lista
// digitada e as cartas com os números contando (roteiro em story-roteiro.js). Gravado no navegador da
// pessoa com canvas.captureStream + MediaRecorder. Só aparece onde o navegador grava MP4 (Instagram pode recusar WebM).
// No navegador interno do Instagram/Facebook o botão ensina a abrir no Safari/Chrome. Falhou: oferece a imagem na hora. Desligar: LIGADO = false ou ?sem-video na URL.
import { W, H, tela, carregar } from './story-pincel.js';
import { prepararRoteiro, quadro } from './story-roteiro.js';
import { entregar, DENTRO_DE_APP } from './salvar.js';

const LIGADO = true;
const FPS = 30;
const TIPOS = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4'];
const $ = (s) => document.querySelector(s);

// 'app' = navegador interno do Instagram/Facebook: o botão aparece, mas ensina a abrir no Safari/Chrome.
export function formato() {
  if (!LIGADO || /[?&]sem-video/.test(location.search)) return null;
  if (DENTRO_DE_APP) return 'app';
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return TIPOS.find((t) => MediaRecorder.isTypeSupported?.(t)) || null;
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
  const [roteiro, vivo, foto] = await Promise.all([prepararRoteiro($('#folha')), tocando, carregar('fundo-eddie-quadro.jpg')]);
  const DURACAO = Math.round(roteiro.duracao);
  const cv = tela(W, H), c = cv.getContext('2d');
  const p = painel(cv), estado = p.querySelector('.estado');
  const rec = new MediaRecorder(cv.captureStream(FPS), { mimeType: tipo, videoBitsPerSecond: 6e6 });
  const partes = [];
  rec.ondataavailable = (e) => { if (e.data.size) partes.push(e.data); };
  const fim = new Promise((ok, erro) => { rec.onstop = ok; rec.onerror = (e) => erro(e.error || e); });
  quadro(c, roteiro, vivo || foto, 0);
  rec.start(1000);
  const t0 = performance.now();
  await new Promise((ok) => {
    const passo = () => {
      const t = (performance.now() - t0) / 1000;
      quadro(c, roteiro, vivo && v.readyState >= 2 ? v : foto, Math.min(t, DURACAO));
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
    // Novo toque da pessoa: o compartilhar do celular exige um gesto recente, e a gravação leva uns 18 s.
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
