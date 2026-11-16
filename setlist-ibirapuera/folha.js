// Desenha a folha da setlist no canvas, no mesmo layout do gerador oficial: papel 1100x1400, cabeçalho no topo,
// 2 colunas de 12 músicas (x 100 e 660), passo de 90 px a partir de y 255. Traço de bis desenhado depois da música marcada.
const PAPEL = 'https://assets.glitch.ge/pearljam/setlistgenerator/papers/pearl-jam-set-list-paper-without-lines.jpg';
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

export async function desenharFolha(canvas, { show, musicas }) {
  canvas.width = 1100; canvas.height = 1400;
  const c = canvas.getContext('2d');
  const [papel, cab, ibira, traco, ...imgs] = await Promise.all([
    carregar(PAPEL), carregar(`img/${show === 2 ? 'cab-sp2' : 'cab-sp1'}.png`), carregar('img/cab-ibira.png'),
    carregar('img/traco-bis.png'), ...musicas.map((m) => carregar(m.png)),
  ]);
  c.fillStyle = '#fff'; c.fillRect(0, 0, 1100, 1400);
  c.drawImage(papel, 0, 0, 1100, 1400);
  c.drawImage(cab, 550 - cab.width / 2, 40);
  c.drawImage(ibira, 550 - ibira.width * 0.4, 125, ibira.width * 0.8, ibira.height * 0.8);
  imgs.forEach((im, i) => {
    const x = i < 12 ? 100 : 660;
    const y = 255 + 90 * (i % 12);
    const larg = Math.min(im.width, 440);
    c.drawImage(im, x, y, larg, im.height * (larg / im.width));
    if (musicas[i].bis) c.drawImage(traco, x - 30, y + 84, 420, traco.height * (420 / traco.width));
  });
  return canvas;
}

// Versão story (1080x1920): folha inteira no meio, fundo escuro, assinatura do site embaixo.
export function story(folha) {
  const s = document.createElement('canvas');
  s.width = 1080; s.height = 1920;
  const c = s.getContext('2d');
  c.fillStyle = '#121212'; c.fillRect(0, 0, 1080, 1920);
  const larg = 1000, alt = 1400 * (larg / 1100);
  c.drawImage(folha, 40, (1920 - alt) / 2 - 40, larg, alt);
  c.fillStyle = '#f2efe6'; c.textAlign = 'center';
  c.font = '600 40px system-ui, sans-serif';
  c.fillText('Minha setlist do Eddie no Ibirapuera', 540, 150);
  c.font = '400 32px system-ui, sans-serif';
  c.fillText('somaisumfadepearljam.com.br/setlist-ibirapuera', 540, 1830);
  return s;
}

export const paraBlob = (canvas, q = 0.9) => new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', q));
