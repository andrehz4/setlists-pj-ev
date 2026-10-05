// Tira tarja preta de vídeo (letterbox) de imagem de notícia: miniatura 4:3 do YouTube com faixas pretas em cima e
// embaixo vira um card com barra preta no site. Conservador: só corta quando as DUAS faixas existem, são pretas puras
// (nenhum pixel claro na linha), têm tamanho parecido e cada uma passa de 6% da altura. Foto escura de palco não entra.
const PRETO = 24; // linha conta como tarja se nenhum pixel passa disso (0-255)

function faixa(px, w, h, deCima) {
  let n = 0;
  for (let k = 0; k < h; k++) {
    const y = deCima ? k : h - 1 - k;
    let max = 0;
    for (let x = 0; x < w; x++) max = Math.max(max, px[y * w + x]);
    if (max > PRETO) break;
    n++;
  }
  return n;
}

// Devolve { top, altura } do recorte, ou null se não há tarja.
export async function medirTarja(entrada) {
  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(entrada).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const cima = faixa(data, w, h, true), baixo = faixa(data, w, h, false);
  const minimo = h * 0.06;
  if (cima < minimo || baixo < minimo) return null;
  if (Math.abs(cima - baixo) > Math.max(cima, baixo) * 0.4) return null;
  if (h - cima - baixo < h * 0.4) return null; // sobraria pouco: imagem quase toda preta, não mexe
  // o que sobra de uma tarja de vídeo tem formato de tela (16:9 a 2.4:1, cinema). Arte de texto sobre fundo preto
  // costuma sobrar bem mais larga e fica de fora.
  const formato = w / (h - cima - baixo);
  if (formato < 1.6 || formato > 2.45) return null;
  return { top: cima, altura: h - cima - baixo, largura: w };
}

// Buffer sem a tarja (ou o próprio buffer, se não tem).
export async function semTarja(buf) {
  const t = await medirTarja(buf);
  if (!t) return buf;
  const { default: sharp } = await import("sharp");
  return sharp(buf).extract({ left: 0, top: t.top, width: t.largura, height: t.altura }).toBuffer();
}
