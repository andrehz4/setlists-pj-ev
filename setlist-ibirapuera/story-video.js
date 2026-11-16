// Story em VÍDEO (15 a 20 s, 1080x1920, MP4): o vídeo do Eddie em P&B passando atrás, a folha escrita na hora, a lista
// digitada e as cartas com os números contando (roteiro em story-roteiro.js). Gravado no navegador da
// pessoa com canvas.captureStream + MediaRecorder. Só aparece onde o navegador grava MP4 (Instagram pode recusar WebM).
// No navegador interno do Instagram/Facebook o botão abre o Safari/Chrome com a mesma setlist (abrir-fora.js). Falhou: oferece a imagem na hora. Desligar: LIGADO = false ou ?sem-video na URL.
import { W, H, tela, carregar } from './story-pincel.js';
import { prepararRoteiro, quadro } from './story-roteiro.js';
import { entregar, fecharTela, DENTRO_DE_APP } from './salvar.js';
import { abrirFora } from './abrir-fora.js';

const LIGADO = true;
const FPS = 30;
const TIPOS = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4'];
const $ = (s) => document.querySelector(s);

// 'app' = navegador interno do Instagram/Facebook: o botão aparece e abre o Safari/Chrome com a mesma setlist.
export function formato() {
  if (!LIGADO || /[?&]sem-video/.test(location.search)) return null;
  if (DENTRO_DE_APP) return 'app';
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return TIPOS.find((t) => MediaRecorder.isTypeSupported?.(t)) || null;
}

function painel(cv) {
  fecharTela();
  const p = document.createElement('div');
  p.id = 'salvar-tela';
  p.innerHTML = '<p class="estado" role="status" style="margin:0;font-weight:600">Gravando o seu story…</p>' +
    (cv ? '<div class="carga"><b>0%</b><div class="trilho"><i></i></div><small>Preparando a sua folha…</small></div>' : '') + '<div class="botoes" hidden>' +
    '<button type="button" class="btn cheio">Postar no story</button><button type="button" class="btn">Fechar</button></div>';
  p.querySelector('.estado').style.cssText += ';max-width:420px;text-align:center;line-height:1.45';
  if (cv) { cv.style.cssText = 'max-width:100%;max-height:64vh;border-radius:6px;background:#000'; p.insertBefore(cv, p.querySelector('.botoes')); }
  document.body.append(p);
  return p;
}

// Loading de 0 a 100%: a etapa acompanha o roteiro (folha, lista, cartas, chamada final).
const ETAPAS = [[0, 'Escrevendo a sua folha…'], [0.42, 'Passando a limpo a lista…'], [0.62, 'Contando as estatísticas…'], [0.86, 'Chamando o Eddie pro final…']];
function progresso(p, f) {
  const pct = Math.min(100, Math.max(0, Math.round(f * 100)));
  p.querySelector('.carga b').textContent = pct + '%';
  p.querySelector('.carga i').style.width = pct + '%';
  p.querySelector('.carga small').textContent = pct >= 100 ? '' : ETAPAS.filter(([d]) => f >= d).at(-1)[1];
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
  const p = painel(cv);
  progresso(p, 0.03);
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
      progresso(p, 0.03 + 0.95 * Math.min(1, t / DURACAO)); // 3% preparo, 95% gravação, os 2% finais ao fechar o arquivo
      if (t >= DURACAO + 0.2) ok(); else requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  rec.stop(); v.pause();
  await fim;
  if (!partes.length) throw new Error('gravação vazia');
  return { blob: new Blob(partes, { type: tipo.split(';')[0] }), p };
}

// Embrulha o botão principal com as 4 setas douradas nas diagonais (as mesmas do cartão da chegada).
function mirar(btn) {
  if (!btn || btn.parentElement.classList.contains('alvo')) return;
  const w = document.createElement('div'); w.className = 'alvo';
  btn.replaceWith(w); w.append(btn);
  for (const k of ['tl', 'tr', 'bl', 'br']) w.insertAdjacentHTML('beforeend', `<i class="mira ${k}" aria-hidden="true"></i>`);
}

// Tela de recado com uma saída (ex.: baixar a imagem) e Fechar.
function recado(txt, rotuloAcao, acao) {
  const p = painel(null);
  p.querySelector('.estado').textContent = txt;
  p.querySelector('.botoes').hidden = false;
  const [sim, fechar] = p.querySelectorAll('.botoes button');
  sim.textContent = rotuloAcao;
  sim.onclick = () => { fecharTela(); acao(); };
  fechar.onclick = fecharTela;
}

async function storyVideo(b, tipo) {
  if (b.disabled || b.classList.contains('gerando')) return;
  b.classList.add('gerando');
  const nome = `setlist-eddie-ibirapuera-${/22\/11/.test($('#r-show')?.textContent) ? '22' : '20'}-11-story.mp4`;
  try {
    const { blob, p } = await gravar(tipo);
    const url = URL.createObjectURL(blob);
    p.dataset.blob = url;
    const vid = Object.assign(document.createElement('video'), { src: url, muted: true, loop: true, autoplay: true, playsInline: true });
    vid.setAttribute('playsinline', ''); vid.style.cssText = p.querySelector('canvas').style.cssText;
    p.querySelector('canvas').replaceWith(vid);
    progresso(p, 1); p.querySelector('.carga').classList.add('ok');
    p.querySelector('.estado').textContent = 'Pronto! Posta e marca @smufdpj que a gente compartilha o seu';
    p.querySelector('.botoes').hidden = false;
    const [postar, fechar] = p.querySelectorAll('.botoes button');
    mirar(postar);
    // Novo toque da pessoa: o compartilhar do celular exige um gesto recente, e a gravação leva uns 18 s.
    postar.onclick = () => entregar(blob, nome, { compartilhar: matchMedia('(pointer: coarse)').matches });
    fechar.onclick = fecharTela;
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
  // Vídeo como opção principal, também no navegador interno do Instagram (lá o botão abre o navegador de verdade).
  $('#acoes').classList.add('com-video'); b.classList.add('cheio', 'story-btn');
  b.innerHTML = '<span>Baixar vídeo para o seu stories</span>'; $('#story').firstElementChild.textContent = 'Prefere foto? Baixar só a imagem';
  mirar(b);
  const ref = $('#story'), espelhar = () => { b.disabled = ref.disabled; };
  new MutationObserver(espelhar).observe(ref, { attributes: true, attributeFilter: ['disabled'] });
  espelhar();
  b.addEventListener('click', () => (tipo === 'app' ? abrirFora(() => $('#story').click()) : storyVideo(b, tipo)));
}
if (!$('#acoes')?.classList.contains('com-video')) mirar($('#story')); // sem vídeo, a imagem é o botão principal
