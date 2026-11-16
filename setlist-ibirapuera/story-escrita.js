// Story em vídeo, as duas cenas do meio: (1) a folha sendo escrita na hora, cada quadro de música revelado da esquerda
// pra direita como um traço de caneta, na ordem do setlist, com o traço do bis riscado na vez dele; (2) a lista
// digitada ("As músicas, na ordem da folha"), igual à da página, com os itens entrando em sequência.
// A tinta vem da folha pronta (#folha): cada pedaço revelado é copiado dela por cima do papel em branco.
import { W, M, COR, DISP, CORPO, tela, caixa, linha, tamanho, rotulo } from './story-pincel.js';
import { geoFolha, folhaNoMeio, fitas } from './story.js';
import { carregar, PAPEL, posicoes } from './folha.js';

const $ = (s) => document.querySelector(s);
const LISTA = { y: 440, fim: 1670, gap: 20 };
// No vídeo a folha é escrita grande, do fim do título até perto do rodapé (fora das faixas do Instagram).
export const GRANDE = { larg: 940, y: 450 };

// Músicas como a página mostra (#lidas): nome e se o bis vem logo depois.
export function musicasLidas() {
  const lis = [...($('#lidas')?.children || [])];
  return lis.filter((li) => !li.classList.contains('bis')).map((li) => ({
    nome: li.textContent.replace(/^\s*\d+/, '').trim(),
    bis: !!li.nextElementSibling?.classList.contains('bis'),
  }));
}

// Pedaços da folha a escrever, na ordem: cabeçalho, depois cada música e o traço de bis dela (coordenadas do papel).
function trechos(musicas) {
  const out = [{ x: 0, y: 42, w: 1100, h: 210, dur: 0.6 }];
  posicoes(musicas).forEach(({ x, y, traco }) => {
    out.push({ x: x - 12, y: y - 6, w: 460, h: 112, dur: 0.3 });
    if (traco) out.push({ x: x - 34, y: y + 100, w: 430, h: 30, dur: 0.18 });
  });
  let t = 0;
  for (const p of out) { p.ini = t; t += p.dur; }
  return { lista: out, total: t };
}

export async function montarEscrita(folha, musicas) {
  const papel = await carregar(PAPEL).catch(() => null);
  const branca = tela(folha.width, folha.height), c = branca.getContext('2d');
  c.fillStyle = papel ? '#fff' : '#f4f1e8'; c.fillRect(0, 0, branca.width, branca.height);
  if (papel) c.drawImage(papel, 0, 0, branca.width, branca.height);
  const geo = geoFolha(folha, GRANDE.larg, GRANDE.y), base = tela(W, geo.alt + 200), b = base.getContext('2d');
  b.translate(0, -(geo.y - 80)); folhaNoMeio(b, branca, geo); // papel em branco, sombra e fitas, pintados uma vez só
  return { folha, geo, base, buffer: tela(W, base.height), ...trechos(musicas) };
}

// Desenha a folha escrita até o segundo t (0 = papel em branco). Devolve true quando terminou.
export function escrever(c, e, t) {
  const { geo, folha } = e, k = geo.larg / folha.width;
  c.drawImage(e.base, 0, geo.y - 80);
  c.save(); c.translate(geo.cx, geo.cy); c.rotate(geo.giro); c.translate(-geo.cx, -geo.cy);
  c.translate(geo.x, geo.y); c.scale(k, k);
  let caneta = null;
  for (const p of e.lista) {
    const f = Math.min(1, Math.max(0, (t - p.ini) / p.dur));
    if (f <= 0) break;
    const w = Math.min(p.w * f, folha.width - p.x);
    c.drawImage(folha, p.x, p.y, w, p.h, p.x, p.y, w, p.h);
    if (f < 1) caneta = { x: p.x + w, y: p.y + p.h * 0.5, f };
  }
  if (caneta) { // ponta da caneta com um tremor leve, mais forte no fim da linha (o rabisco)
    const treme = Math.sin(t * 55) * (caneta.f > 0.85 ? 16 : 6);
    c.fillStyle = 'rgba(22,19,15,.85)';
    c.beginPath(); c.arc(caneta.x, caneta.y + treme, 9, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  fitas(c, geo.x, geo.y, geo.larg);
  return t >= e.total;
}

// Lista digitada em 1 ou 2 colunas (mais de 11 linhas = 2). Cada item é uma camada pequena pra entrar sozinho.
export function montarLista(musicas) {
  const entradas = [];
  musicas.forEach((m, i) => {
    entradas.push({ n: i + 1, nome: m.nome });
    if (m.bis && i < musicas.length - 1) entradas.push({ bis: true });
  });
  const cols = entradas.length > 11 ? 2 : 1, porCol = Math.ceil(entradas.length / cols);
  const topo = LISTA.y + 76, alt = Math.min(110, (LISTA.fim - topo) / porCol);
  const larg = (W - 2 * M - LISTA.gap * (cols - 1)) / cols, px = Math.min(58, alt * 0.52);
  const titulo = tela(W, 60), ct = titulo.getContext('2d');
  rotulo(ct, M, 44, 'As músicas · na ordem da folha', COR.ouro, 30);
  const itens = entradas.map((en, i) => {
    const x = M + Math.floor(i / porCol) * (larg + LISTA.gap), y = topo + (i % porCol) * alt;
    const cv = tela(larg, alt), c = cv.getContext('2d');
    if (en.bis) {
      c.strokeStyle = COR.ouro; c.lineWidth = 2; c.setLineDash([10, 8]);
      c.beginPath(); c.moveTo(90, alt / 2); c.lineTo(larg - 10, alt / 2); c.stroke();
      rotulo(c, 0, alt / 2 + 11, 'bis', COR.ouro, 30);
    } else {
      caixa(c, 0, alt - 1, larg, 1, 0, COR.linha);
      linha(c, 58, alt / 2 + px * 0.42, [{ fonte: tamanho(px * 1.25, DISP, 900), cor: COR.ouro, t: String(en.n) }], 64, 'right');
      linha(c, 76, alt / 2 + px * 0.36, [{ fonte: tamanho(px, CORPO, 600), cor: COR.texto, t: en.nome }], larg - 80);
    }
    return { cv, x, y, bis: !!en.bis };
  });
  return { titulo: { cv: titulo, x: 0, y: LISTA.y }, itens };
}
