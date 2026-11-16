// Gerador de setlist do Eddie no Ibirapuera: escolhe o show, monta até 24 músicas (ou sorteia), reordena, marca o bis,
// vê a folha escrita à mão e baixa/compartilha o story 1080x1920.
import { desenharFolha, paraBlob } from './folha.js';
import { story } from './story.js';
import { entregar } from './salvar.js';
import { sortearShow } from './sorteio.js';

const LIMITE = 24;
const $ = (s) => document.querySelector(s);
// Uma lista por noite (1 = 20/11, 2 = 22/11); estado.lista é sempre a da noite marcada.
const estado = { show: 1, listas: { 1: [], 2: [] },
  get lista() { return this.listas[this.show]; }, set lista(v) { this.listas[this.show] = v; } };
const chaveDe = (show) => show + ':' + estado.listas[show].map((m) => m.chave + (m.bis ? '|' : '')).join(',');
let grupos = [];
let modelo = null;

const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const naLista = (k) => estado.lista.some((m) => m.chave === k);

function catalogo() {
  const q = $('#busca').value.trim().toLowerCase(), abertos = new Set([...document.querySelectorAll('#catalogo details[open]')].map((d) => d.dataset.g));
  $('#catalogo').innerHTML = grupos.map((g) => {
    const ms = g.musicas.filter((m) => !q || m.nome.toLowerCase().includes(q) || (m.de || '').toLowerCase().includes(q));
    if (!ms.length) return '';
    return `<details data-g="${esc(g.grupo)}" ${q || abertos.has(g.grupo) ? 'open' : ''}><summary>${esc(g.grupo)} <small>${ms.length}</small></summary><ul>${ms.map((m) =>
      `<li><button class="add" data-k="${esc(m.chave)}" ${naLista(m.chave) ? 'disabled' : ''}>${esc(m.nome)}${
        m.de ? ` <small>(${esc(m.de)})</small>` : ''}${m.vezes ? ` <em>${m.vezes}x solo</em>` : ''}</button></li>`).join('')}</ul></details>`;
  }).join('') || (q ? '<p class="vazio">Nenhuma música com esse nome.</p>' : '');
}

function selecionadas() {
  const n = estado.lista.length;
  $('#contador').textContent = `${n}/${LIMITE}`;
  $('#limite').hidden = n < LIMITE;
  $('#lista').innerHTML = estado.lista.map((m, i) => `<li draggable="true" data-i="${i}">
    <span class="num">${i + 1}</span><span class="nome">${esc(m.nome)}</span>
    <button data-acao="bis" data-i="${i}" class="${m.bis ? 'on' : ''}" aria-pressed="${!!m.bis}" title="traço de bis depois desta">bis</button>
    <button data-acao="sobe" data-i="${i}" aria-label="subir">↑</button>
    <button data-acao="desce" data-i="${i}" aria-label="descer">↓</button>
    <button data-acao="tira" data-i="${i}" aria-label="tirar">✕</button></li>`).join('');
  $('#acoes').hidden = !n;
  $('#atalho').hidden = !n;
  $('#atalho').textContent = `Ver meu setlist (${n}/${LIMITE}) ↓`;
  const yt = estado.lista.filter((m) => m.yt).length;
  $('#ouvir').hidden = !yt;
  $('#ouvir').textContent = yt === n ? 'Ouvir no YouTube' : `Ouvir no YouTube (${yt} de ${n})`;
}

let pedido = 0;
async function folha() {
  const meu = ++pedido;
  if (!estado.lista.length) { $('#previa').hidden = true; return; }
  $('#previa').hidden = false;
  const ocupado = (sim, txt = '') => {
    $('#estado-folha').textContent = txt;
    $('#previa').classList.toggle('montando', sim);
    $('#story').disabled = sim;
  };
  ocupado(true, 'Escrevendo a folha…');
  $('#aviso').textContent = '';
  const falhas = await desenharFolha($('#folha'), { show: estado.show, musicas: [...estado.lista] }, {
    vigente: () => meu === pedido,
    progresso: (k, total) => { $('#estado-folha').textContent = `Escrevendo a folha… ${k}/${total}`; },
    atrasada: (faltam) => { if (!faltam) $('#aviso').textContent = ''; },
  }).catch(() => -1);
  if (meu !== pedido) return;
  ocupado(false); if (!falhas) adiantarOutra();
  if (falhas) $('#aviso').textContent = falhas < 0 ? 'A folha não saiu. Recarregue a página e tente de novo.'
    : 'Internet lenta? Algumas músicas saíram em letra simples. A folha se ajeita sozinha quando elas chegarem.';
}

const pronta = {};
// Desenha por trás a folha da outra noite; quando a pessoa trocar o seletor, ela já está pronta.
async function adiantarOutra() {
  const outra = estado.show === 1 ? 2 : 1, chave = chaveDe(outra);
  if (!estado.listas[outra].length || pronta[outra]?.chave === chave) return;
  const c = Object.assign(document.createElement('canvas'), { width: 1100, height: 1400 });
  const falhas = await desenharFolha(c, { show: outra, musicas: [...estado.listas[outra]] }, { vigente: () => true }).catch(() => -1);
  if (!falhas && chaveDe(outra) === chave) pronta[outra] = { chave, c };
}

function tudo() { catalogo(); selecionadas(); folha(); }
function trocarNoite(show) {
  estado.show = show;
  if (!estado.lista.length) estado.lista = estado.listas[show === 1 ? 2 : 1].map((m) => ({ ...m }));
  const p = pronta[show];
  if (p?.chave === chaveDe(show)) {
    ++pedido; $('#folha').getContext('2d').drawImage(p.c, 0, 0);
    $('#previa').classList.remove('montando'); $('#story').disabled = false; $('#estado-folha').textContent = '';
    catalogo(); selecionadas(); adiantarOutra(); return;
  }
  tudo();
}

function sortear() {
  estado.listas = { 1: sortearShow(grupos, modelo), 2: sortearShow(grupos, modelo) };
  tudo();
  $('#previa').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mover(i, j) {
  if (j < 0 || j >= estado.lista.length) return;
  const [m] = estado.lista.splice(i, 1);
  estado.lista.splice(j, 0, m);
}

// Um botão só: gera o story; no celular abre o compartilhar (Instagram etc.), no computador baixa.
async function baixarStory() {
  const b = $('#story');
  if (b.classList.contains('gerando')) return;
  b.classList.add('gerando'); b.firstElementChild.textContent = 'Montando o seu story';
  const nome = `setlist-eddie-ibirapuera-${estado.show === 2 ? '22' : '20'}-11-story.jpg`;
  try {
    const blob = await paraBlob(await story($('#folha')));
    const como = await entregar(blob, nome, { compartilhar: matchMedia('(pointer: coarse)').matches });
    const t = $('#toast'), msg = { baixado: 'Story salvo. Agora posta e marca @smufdpj', compartilhado: 'Boa! Marca @smufdpj pra gente ver' }[como];
    if (msg) { t.textContent = msg; t.classList.add('ver'); setTimeout(() => t.classList.remove('ver'), 3500); }
  } catch (e) { $('#aviso').textContent = 'O story não saiu. Tente de novo ou tire um print da folha.'; }
  b.classList.remove('gerando'); b.firstElementChild.textContent = 'Baixar a imagem pro story';
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.classList.contains('add') && estado.lista.length < LIMITE) {
    const m = grupos.flatMap((g) => g.musicas).find((x) => x.chave === b.dataset.k);
    estado.lista.push({ ...m }); return tudo();
  }
  const i = Number(b.dataset.i);
  const acoes = {
    bis: () => { const m = estado.lista[i]; m.bis = !m.bis && i < estado.lista.length - 1 && estado.lista.filter((x) => x.bis).length < 2; },
    sobe: () => mover(i, i - 1), desce: () => mover(i, i + 1), tira: () => estado.lista.splice(i, 1),
  };
  if (acoes[b.dataset.acao]) { acoes[b.dataset.acao](); return tudo(); }
  if (b.dataset.show) {
    document.querySelectorAll('[data-show]').forEach((x) => x.classList.toggle('on', x === b));
    return trocarNoite(Number(b.dataset.show));
  }
  const extras = { sortear, limpar: () => { estado.listas = { 1: [], 2: [] }; tudo(); },
    ouvir: () => window.open(`https://www.youtube.com/watch_videos?video_ids=${
      estado.lista.filter((m) => m.yt).slice(0, 50).map((m) => m.yt).join(',')}`, '_blank', 'noopener'),
    atalho: () => $('#minha').scrollIntoView({ behavior: 'smooth', block: 'start' }),
    story: baixarStory };
  extras[b.id]?.();
});

let arrastando = null;
$('#lista').addEventListener('dragstart', (e) => { arrastando = Number(e.target.closest('li')?.dataset.i); });
$('#lista').addEventListener('dragover', (e) => e.preventDefault());
$('#lista').addEventListener('drop', (e) => {
  e.preventDefault();
  const alvo = e.target.closest('li');
  if (alvo && arrastando !== null) { mover(arrastando, Number(alvo.dataset.i)); tudo(); }
  arrastando = null;
});
$('#busca').addEventListener('input', catalogo);

// window.musicasCedo: o index.html já começou a baixar o catálogo antes deste módulo chegar.
(window.musicasCedo || fetch('musicas.json').then((r) => r.json())).then((d) => { grupos = d.grupos; modelo = d.modelo; if (location.hash === '#sortear') sortear(); else tudo(); })
  .catch(() => { $('#catalogo').textContent = 'As músicas não carregaram. Recarregue a página.'; });
