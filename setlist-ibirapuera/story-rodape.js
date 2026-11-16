// Rodapé do story (imagem e vídeo): chamada pra seguir a página. Logo redondo com anel dourado, "SEGUE A GENTE",
// "@smufdpj" e o que tem lá; embaixo o link do gerador e o aviso de bula. Fica colado na base, com respiro das cartas
// (story-layout.js diz o y); sublinha, link e aviso têm o mesmo passo (44 px). Sem sticker de menção.
import { W, M, COR, DISP, CORPO, linha, tamanho } from './story-pincel.js';

const LOGO = 96, TX = M + LOGO + 22;

function logo(c, im, y) {
  const r = LOGO / 2, cx = M + r, cy = y + r;
  c.save(); c.beginPath(); c.arc(cx, cy, r - 2, 0, Math.PI * 2); c.clip();
  if (im) c.drawImage(im, cx - r + 2, cy - r + 2, LOGO - 4, LOGO - 4); else { c.fillStyle = '#f1e7d0'; c.fill(); }
  c.restore();
  c.beginPath(); c.arc(cx, cy, r - 1.5, 0, Math.PI * 2); c.strokeStyle = COR.ouro; c.lineWidth = 3; c.stroke();
}

function segue(c, y) {
  linha(c, TX, y + 46, [{ fonte: tamanho(56, DISP, 900), cor: COR.ouro, t: 'SEGUE A GENTE' }], W - M - TX);
}

// Devolve onde fica o sublinhado dourado do @ (o vídeo risca ele aos poucos; a imagem pinta inteiro).
function arroba(c, y) {
  linha(c, TX, y + 86, [{ fonte: tamanho(40, CORPO, 700), cor: COR.texto, t: '@smufdpj' }], W - M - TX);
  c.font = tamanho(40, CORPO, 700)(1);
  const w = c.measureText('@smufdpj').width;
  linha(c, TX, y + 130, [{ fonte: tamanho(22, CORPO, 500), cor: COR.fraco, t: 'setlists, notícias e tudo de Pearl Jam e Eddie' }], W - M - TX);
  return { sublinhado: { x: TX, y: y + 96, w } };
}

export function sublinhar(c, s, f = 1) {
  if (f <= 0) return;
  c.fillStyle = COR.ouro; c.fillRect(s.x, s.y, s.w * f, 4);
}

function link(c, y) {
  const f = (peso) => tamanho(26, CORPO, peso);
  linha(c, W / 2, y + 174, [{ fonte: f(700), cor: COR.ouro, t: 'Sorteie o seu: ' },
    { fonte: f(500), cor: 'rgba(243,238,226,.8)', t: 'somaisumfadepearljam.com.br/setlist-ibirapuera' }], W - 2 * M, 'center');
}

// Letra de bula, pra ninguém postar como setlist vazado. No vídeo fica parada desde o começo.
function aviso(c, y) {
  linha(c, W / 2, y + 218, [{ fonte: tamanho(18, CORPO, 500), cor: 'rgba(165,157,140,.55)', t: 'Palpite de fã, não é o setlist oficial' }], W - 2 * M, 'center');
}

// camada(nome, x, y, w, h, pintar) é a de story.js; im = logo já carregado (ou null); y = topo do rodapé (story-layout.js).
export function rodape(camada, im, y) {
  return [camada('logo', M - 4, y - 4, LOGO + 8, LOGO + 8, (c) => logo(c, im, y)),
    camada('segue', TX, y, W - M - TX, 54, (c) => segue(c, y)),
    camada('arroba', TX, y + 54, W - M - TX, 90, (c) => arroba(c, y)),
    camada('link', 0, y + 146, W, 40, (c) => link(c, y)),
    camada('aviso', 0, y + 198, W, 28, (c) => aviso(c, y))];
}
