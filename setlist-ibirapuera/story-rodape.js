// Rodapé do story (imagem e vídeo): chamada pra seguir a página. Logo redondo com anel dourado, "SEGUE A GENTE",
// "@smufdpj" e o que tem lá; embaixo o link do gerador (discreto) e o aviso de bula. Termina antes dos ~250 px de baixo
// que o Instagram cobre com o campo de mensagem. Sem sticker de menção: aqui é só arte.
import { W, M, COR, DISP, CORPO, linha, tamanho } from './story-pincel.js';

export const RODAPE = { y: 1476 };
const LOGO = 124, TX = M + LOGO + 24;

function logo(c, im) {
  const r = LOGO / 2, cx = M + r, cy = RODAPE.y + r;
  c.save(); c.beginPath(); c.arc(cx, cy, r - 2, 0, Math.PI * 2); c.clip();
  if (im) c.drawImage(im, cx - r + 2, cy - r + 2, LOGO - 4, LOGO - 4); else { c.fillStyle = '#f1e7d0'; c.fill(); }
  c.restore();
  c.beginPath(); c.arc(cx, cy, r - 1.5, 0, Math.PI * 2); c.strokeStyle = COR.ouro; c.lineWidth = 3; c.stroke();
}

function segue(c) {
  linha(c, TX, RODAPE.y + 54, [{ fonte: tamanho(60, DISP, 900), cor: COR.ouro, t: 'SEGUE A GENTE' }], W - M - TX);
}

// Devolve onde fica o sublinhado dourado do @ (o vídeo risca ele aos poucos; a imagem pinta inteiro).
function arroba(c) {
  const y = RODAPE.y;
  linha(c, TX, y + 98, [{ fonte: tamanho(42, CORPO, 700), cor: COR.texto, t: '@smufdpj' }], W - M - TX);
  c.font = tamanho(42, CORPO, 700)(1);
  const w = c.measureText('@smufdpj').width;
  linha(c, TX, y + 134, [{ fonte: tamanho(21, CORPO, 500), cor: COR.fraco, t: 'setlists, notícias e tudo de Pearl Jam e Eddie' }], W - M - TX);
  return { sublinhado: { x: TX, y: y + 111, w } };
}

export function sublinhar(c, s, f = 1) {
  if (f <= 0) return;
  c.fillStyle = COR.ouro; c.fillRect(s.x, s.y, s.w * f, 4);
}

function link(c) {
  const f = (peso) => tamanho(20, CORPO, peso);
  linha(c, W / 2, RODAPE.y + 168, [{ fonte: f(700), cor: COR.ouro, t: 'Sorteie o seu: ' },
    { fonte: f(500), cor: 'rgba(243,238,226,.8)', t: 'somaisumfadepearljam.com.br/setlist-ibirapuera' }], W - 2 * M, 'center');
}

// Letra de bula, pra ninguém postar como setlist vazado. No vídeo fica parada desde o começo.
function aviso(c) {
  linha(c, W / 2, RODAPE.y + 194, [{ fonte: tamanho(16, CORPO, 500), cor: 'rgba(165,157,140,.55)', t: 'Palpite de fã, não é o setlist oficial' }], W - 2 * M, 'center');
}

// camada(nome, x, y, w, h, pintar) é a de story.js; im = logo já carregado (ou null).
export function rodape(camada, im) {
  const y = RODAPE.y;
  return [camada('logo', M - 4, y - 4, LOGO + 8, LOGO + 8, (c) => logo(c, im)),
    camada('segue', TX, y, W - M - TX, 64, segue),
    camada('arroba', TX, y + 62, W - M - TX, 82, arroba),
    camada('link', 0, y + 144, W, 34, link),
    camada('aviso', 0, y + 178, W, 24, aviso)];
}
