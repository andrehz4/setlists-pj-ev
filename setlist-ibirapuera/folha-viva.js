// Folha escrita ao vivo na tela de resultado: depois do sorteio (ou ao trocar a noite pela primeira vez), a folha é
// escrita música por música no canvas da página, com a mesma caneta do story em vídeo (tinta() de story-escrita.js):
// o traço do bis na vez dele e a ponta tremendo. Leva de 4 a 6 s; tocar na folha pula pro fim. No fim fica a folha
// pronta, a mesma que vai pro download (os botões só ligam depois). Sem animação com prefers-reduced-motion.
// Desligar: LIGADO = false (ou ?sem-escrita na URL) e a folha volta a aparecer pronta, como antes.
import { carregar, PAPEL } from './folha.js';
import { trechos, tinta } from './story-escrita.js';

const LIGADO = true;
const ALVO = 5; // segundos, mais ou menos (4 a 6)
const calmo = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const vistas = new Set();
let pedida = false, rodando = null;

export const ligada = () => LIGADO && !calmo.matches && !/[?&]sem-escrita/.test(location.search);
export const pedirEscrita = () => { pedida = true; }; // sortear e trocar de noite pedem; montar à mão não
export const jaVista = (chave) => vistas.has(chave);

// Vai escrever a próxima folha? (consome o pedido). Se não, a página desenha a folha direto, como sempre.
export function vaiEscrever() {
  const sim = pedida && ligada();
  pedida = false;
  return sim;
}

// Papel em branco no canvas da página: a primeira pintura sai na hora, antes das letras chegarem.
export async function papelEmBranco(canvas) {
  const c = canvas.getContext('2d'), papel = await carregar(PAPEL).catch(() => null);
  c.fillStyle = papel ? '#fff' : '#f4f1e8'; c.fillRect(0, 0, canvas.width, canvas.height);
  if (papel) c.drawImage(papel, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Segundos de caneta por música pra caber em ~5 s (entre 0,15 e 1,2).
export const porMusica = (n) => Math.min(1.2, Math.max(0.15, (ALVO - 0.5) / Math.max(1, n)));

// Escreve no canvas da página copiando da folha pronta (pronta = canvas 1100x1400 já desenhado). vigente() falso
// para no meio (pedido novo). Devolve quando acabou; a folha pronta fica no canvas.
export async function escreverAoVivo(canvas, pronta, musicas, chave, vigente = () => true) {
  rodando?.parar();
  const branco = await papelEmBranco(Object.assign(document.createElement('canvas'), { width: pronta.width, height: pronta.height }));
  const { lista, total } = trechos(musicas, porMusica(musicas.length));
  const c = canvas.getContext('2d');
  let pular = false, parar = false;
  const tocar = () => { pular = true; };
  canvas.addEventListener('pointerdown', tocar);
  rodando = { parar: () => { parar = true; } };
  canvas.style.cursor = 'pointer';
  await new Promise((fim) => {
    const t0 = performance.now();
    const quadro = () => {
      if (parar || !vigente()) return fim();
      const t = pular ? total : (performance.now() - t0) / 1000;
      c.drawImage(branco, 0, 0);
      tinta(c, pronta, lista, t);
      if (t >= total) return fim();
      requestAnimationFrame(quadro);
    };
    requestAnimationFrame(quadro);
  });
  canvas.removeEventListener('pointerdown', tocar);
  canvas.style.cursor = '';
  rodando = null;
  if (parar || !vigente()) return false;
  c.drawImage(pronta, 0, 0); // a arte pronta, sem ponta de caneta
  vistas.add(chave);
  return true;
}

// Imagem de letra que chegou atrasada (depois do prazo): repinta a folha pronta no canvas da página, a não ser que a
// caneta ainda esteja escrevendo (aí ela já copia da pronta atualizada).
export function atualizarDepois(canvas, pronta) {
  requestAnimationFrame(() => requestAnimationFrame(() => { if (!rodando) canvas.getContext('2d').drawImage(pronta, 0, 0); }));
}
