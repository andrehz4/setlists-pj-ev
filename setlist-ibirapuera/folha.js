// Desenha a folha do setlist no canvas, no mesmo layout do gerador oficial: papel 1100x1400, cabeçalho no topo,
// 2 colunas de 12 músicas (x 100 e 660), passo de 90 px a partir de y 255. Traço de bis empurra o resto da coluna.
// A folha é pintada aos poucos (cada imagem que chega repinta) e nunca trava: imagem que falha ou passa do prazo
// vira texto (música) ou fundo liso (papel). Se a atrasada chegar depois, entra no lugar do texto.
export const PAPEL = 'https://assets.glitch.ge/pearljam/setlistgenerator/papers/pearl-jam-set-list-paper-without-lines.jpg';
const PRAZO = 9000;
const cache = new Map();

export function carregar(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((ok, erro) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => ok(im);
      im.onerror = () => { cache.delete(src); erro(new Error(`imagem não carregou: ${src}`)); };
      im.src = src;
    }));
  }
  return cache.get(src);
}

// prontas[i]: Image (chegou), false (falhou) ou null (ainda vindo). Ordem: papel, cabeçalho, ibirapuera, traço, músicas.
function pintar(canvas, [papel, cab, ibira, traco, ...imgs], musicas) {
  const c = canvas.getContext('2d');
  c.fillStyle = papel ? '#fff' : '#f4f1e8'; c.fillRect(0, 0, 1100, 1400);
  if (papel) c.drawImage(papel, 0, 0, 1100, 1400);
  if (cab) c.drawImage(cab, 550 - cab.width / 2, 40);
  if (ibira) c.drawImage(ibira, 550 - ibira.width * 0.4, 125, ibira.width * 0.8, ibira.height * 0.8);
  c.fillStyle = '#16130f'; c.textBaseline = 'middle'; c.font = '700 44px "Marker Felt", "Bradley Hand", "Comic Sans MS", cursive';
  posicoes(musicas).forEach(({ x, y, traco: tr }, i) => {
    const im = imgs[i];
    if (im) {
      const larg = Math.min(im.width, 440);
      c.drawImage(im, x, y, larg, im.height * (larg / im.width));
    } else if (im === false) c.fillText(musicas[i].nome.toUpperCase(), x, y + 45, 420);
    if (!tr) return;
    if (traco) c.drawImage(traco, x - 30, y + 107, 420, traco.height * (420 / traco.width));
    else if (traco === false) c.fillRect(x - 30, y + 114, 420, 5);
  });
}

// Onde cada música fica no papel (1100x1400). traco: tem traço de bis logo abaixo. A tinta da música vai até ~y+100
// e a próxima começa em ~y+114: o traço (20 px) só cabe empurrando o resto da coluna. Teto de 40 px pra última música
// não sair do papel; bis na última não tem o que separar. O story em vídeo usa isto pra "escrever" a folha.
export function posicoes(musicas) {
  const desloc = [0, 0];
  return musicas.map((m, i) => {
    const col = i < 12 ? 0 : 1, x = col ? 660 : 100, y = 255 + 90 * (i % 12) + desloc[col];
    const traco = !!m.bis && i < musicas.length - 1;
    if (traco) desloc[col] = Math.min(desloc[col] + 20, 40);
    return { x, y, traco };
  });
}

// vigente(): false quando um pedido mais novo já começou (não pinta por cima). progresso(chegaram, total) a cada imagem.
// Devolve quantas imagens faltaram (0 = folha perfeita). atrasada(faltam) avisa quando uma que faltou chega depois.
export async function desenharFolha(canvas, { show, musicas }, { vigente = () => true, progresso = () => {}, atrasada = () => {} } = {}) {
  const fontes = [PAPEL, `img/${show === 2 ? 'cab-sp2' : 'cab-sp1'}.png`, 'img/cab-ibira.png', 'img/traco-bis.png',
    ...musicas.map((m) => m.png)];
  const prontas = fontes.map(() => null);
  let feitas = 0, agendado = false;
  const repintar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; if (vigente()) pintar(canvas, prontas, musicas); });
  };
  if (vigente()) pintar(canvas, prontas, musicas);
  const faltam = () => prontas.filter((p) => p === false).length;
  await Promise.all(fontes.map((src, i) => new Promise((fim) => {
    const marca = (im) => {
      const tardia = prontas[i] === false;
      prontas[i] = im;
      if (vigente()) { if (tardia) atrasada(faltam()); else progresso(++feitas, fontes.length); repintar(); }
      fim();
    };
    const t = setTimeout(() => marca(false), PRAZO);
    carregar(src).then((im) => { clearTimeout(t); marca(im); }, () => { clearTimeout(t); if (prontas[i] === null) marca(false); });
  })));
  if (vigente()) pintar(canvas, prontas, musicas);
  return faltam();
}

export const paraBlob = (canvas, q = 0.9) => new Promise((ok, erro) => {
  try { canvas.toBlob((b) => (b ? ok(b) : erro(new Error('sem imagem'))), 'image/jpeg', q); } catch (e) { erro(e); }
});
