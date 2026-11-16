// Roteiro do story em vídeo (15 a 20 s), quadro a quadro, por cima do vídeo do Eddie:
// 1. o título entra e o papel em branco cai; 2. a folha é escrita música por música (story-escrita.js);
// 3. a folha sai e entra a lista digitada, item por item; 4. a lista sai, a folha pronta volta grande e encolhe pro
// tamanho da imagem enquanto as cartas sobem uma
// por uma com os números contando de 0 e a barra do índice enchendo; 5. o link.
import { W, tela } from './story-pincel.js';
import { montar, fundo, medidor, numero, geoFolha } from './story.js';
import { montarEscrita, escrever, montarLista, musicasLidas } from './story-escrita.js';

const fase = (t, ini, dur) => Math.min(1, Math.max(0, (t - ini) / dur));
const sai = (p) => 1 - (1 - p) ** 3;
const mola = (p) => { const s = 1.4, q = p - 1; return p >= 1 ? 1 : 1 + (s + 1) * q ** 3 + s * q ** 2; };

export async function prepararRoteiro(folha) {
  const musicas = musicasLidas();
  const [camadas, escrita] = await Promise.all([montar(folha), montarEscrita(folha, musicas)]);
  camadas.filter((k) => k.nome === 'carta').forEach((k, j) => { k.j = j; });
  const lista = montarLista(musicas);
  const T = { escreve: 1.3 };
  T.saiFolha = T.escreve + escrita.total + 0.5;
  T.lista = T.saiFolha + 0.3;
  T.item = (i) => T.lista + 0.3 + i * 0.12;
  T.saiLista = T.item(lista.itens.length) + 1.6;
  T.volta = T.saiLista + 0.4; // a folha volta grande, pronta,
  T.encolhe = T.volta + 0.7; // e só então encolhe pro tamanho da imagem enquanto as cartas sobem
  T.chega = (j) => T.encolhe + 0.5 + j * 0.3;
  T.cta = T.chega(6) + 0.3;
  const duracao = Math.min(20, Math.max(15, T.cta + 2));
  return { camadas, escrita, lista, T, duracao };
}

function pinta(c, cv, x, y, a, dx = 0, dy = 0, esc = 1, w = cv.width, h = cv.height) {
  if (a <= 0) return;
  const cx = x + w / 2, cy = y + h / 2;
  c.save(); c.globalAlpha = a;
  c.translate(cx + dx, cy + dy); c.scale(esc, esc); c.translate(-cx, -cy);
  c.drawImage(cv, x, y);
  c.restore();
}

// Cena 2: o papel cai em branco e vai sendo escrito; no fim encolhe e some.
function cenaEscrita(c, r, t) {
  const { escrita: e, T } = r;
  if (t >= T.saiFolha + 0.5) return;
  const cai = fase(t, 0.4, 0.85), some = sai(fase(t, T.saiFolha, 0.5));
  if (cai <= 0) return;
  c.save(); c.globalAlpha = 1 - some;
  const cx = W / 2, cy = e.geo.cy;
  c.translate(cx, cy + (1 - mola(cai)) * -1300 - some * 60); c.rotate((1 - sai(cai)) * 0.18); c.scale(1 - some * 0.2, 1 - some * 0.2);
  c.translate(-cx, -cy);
  // escreve num canvas à parte e só então aplica a transparência (senão os pedaços sobrepostos aparecem como caixas)
  const b = e.buffer.getContext('2d'), topo = e.geo.y - 80;
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, e.buffer.width, e.buffer.height); b.translate(0, -topo);
  escrever(b, e, Math.max(0, t - T.escreve));
  c.drawImage(e.buffer, 0, topo);
  c.restore();
}

// Cena 4a: a folha pronta volta grande e encolhe até o lugar dela na imagem final (aí entra a camada 'folha').
function cenaVolta(c, r, t) {
  const { escrita: e, T } = r;
  if (t < T.volta || t >= T.encolhe + 0.7) return;
  if (!r.pronta) { // a folha toda escrita, pintada uma vez só
    r.pronta = tela(W, e.base.height);
    const b = r.pronta.getContext('2d'); b.translate(0, -(e.geo.y - 80)); escrever(b, e, e.total + 1);
  }
  const p = sai(fase(t, T.encolhe, 0.7)), pequena = geoFolha(e.folha), alvo = pequena.larg / e.geo.larg;
  const esc = 1 + (alvo - 1) * p, cy = e.geo.cy + (pequena.cy - e.geo.cy) * p;
  c.save(); c.globalAlpha = sai(fase(t, T.volta, 0.35));
  c.translate(W / 2, cy); c.scale(esc, esc); c.translate(-W / 2, -e.geo.cy);
  c.drawImage(r.pronta, 0, e.geo.y - 80);
  c.restore();
}

// Cena 3: a lista digitada, com os itens entrando em sequência; sai subindo.
function cenaLista(c, r, t) {
  const { lista, T } = r;
  if (t < T.lista || t >= T.saiLista + 0.5) return;
  const some = sai(fase(t, T.saiLista, 0.45)), dy = some * -50;
  const tit = sai(fase(t, T.lista, 0.4));
  pinta(c, lista.titulo.cv, lista.titulo.x, lista.titulo.y, tit * (1 - some), (1 - tit) * -40, dy);
  lista.itens.forEach((it, i) => {
    const p = sai(fase(t, T.item(i), 0.35));
    pinta(c, it.cv, it.x, it.y, p * (1 - some), (1 - p) * 70, dy);
  });
}

// Cenas 1 e 4: título (fica o vídeo todo), folha pronta voltando, cartas com números contando, link.
function cenaFinal(c, r, t) {
  const { camadas, T } = r;
  for (const k of camadas) {
    let a = 1, dx = 0, dy = 0, esc = 1, conta = 1;
    if (k.nome === 'titulo') { const p = sai(fase(t, 0.15, 0.7)); a = p; dx = (1 - p) * -60; }
    else if (k.nome === 'folha') a = t >= T.encolhe + 0.7 ? 1 : 0;
    else if (k.nome === 'cta') a = sai(fase(t, T.cta, 0.5));
    else if (k.nome === 'aviso') a = 1; // parado desde o começo
    else {
      const ini = T.chega(k.j);
      a = Math.min(1, fase(t, ini, 0.25)); dy = (1 - mola(fase(t, ini, 0.5))) * 160; conta = sai(fase(t, ini + 0.2, 1.1));
    }
    if (a <= 0) continue;
    pinta(c, k.cv, k.x, k.y, a, dx, dy, esc, k.w, k.h);
    if (!k.medidor && !k.numero) continue;
    c.save(); c.globalAlpha = a; c.translate(dx, dy);
    if (k.medidor) medidor(c, k.medidor, conta);
    if (k.numero) numero(c, k.numero, conta);
    c.restore();
  }
}

export function quadro(c, r, fonteFundo, t) {
  fundo(c, fonteFundo);
  cenaEscrita(c, r, t);
  cenaLista(c, r, t);
  cenaVolta(c, r, t);
  cenaFinal(c, r, t);
}
