// Gerador de setlist do Eddie no Ibirapuera: escolhe o show, monta até 24 músicas (ou sorteia), reordena, marca o bis,
// vê a folha escrita à mão e baixa/compartilha (folha 1100x1400 ou story 1080x1920).
import { desenharFolha, story, paraBlob } from './folha.js';
import { entregar } from './salvar.js';
import { sortearShow } from './sorteio.js';

const LIMITE = 24;
const $ = (s) => document.querySelector(s);
const estado = { show: 1, lista: [] };
let grupos = [];
let modelo = null;

const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const naLista = (k) => estado.lista.some((m) => m.chave === k);

function catalogo() {
  const q = $('#busca').value.trim().toLowerCase();
  $('#catalogo').innerHTML = grupos.map((g) => {
    const ms = g.musicas.filter((m) => !q || m.nome.toLowerCase().includes(q) || (m.de || '').toLowerCase().includes(q));
    if (!ms.length) return '';
    return `<details ${q ? 'open' : ''}><summary>${esc(g.grupo)} <small>${ms.length}</small></summary><ul>${ms.map((m) =>
      `<li><button class="add" data-k="${esc(m.chave)}" ${naLista(m.chave) ? 'disabled' : ''}>${esc(m.nome)}${
        m.de ? ` <small>(${esc(m.de)})</small>` : ''}${m.vezes ? ` <em>${m.vezes}x solo</em>` : ''}</button></li>`).join('')}</ul></details>`;
  }).join('');
}

function selecionadas() {
  const n = estado.lista.length;
  $('#contador').textContent = `${n}/${LIMITE}`;
  $('#limite').hidden = n < LIMITE;
  $('#lista').innerHTML = estado.lista.map((m, i) => `<li draggable="true" data-i="${i}">
    <span class="num">${i + 1}</span><span class="nome">${esc(m.nome)}</span>
    <button data-acao="bis" data-i="${i}" class="${m.bis ? 'on' : ''}" title="traço de bis depois desta">bis</button>
    <button data-acao="sobe" data-i="${i}" aria-label="subir">↑</button>
    <button data-acao="desce" data-i="${i}" aria-label="descer">↓</button>
    <button data-acao="tira" data-i="${i}" aria-label="tirar">✕</button></li>`).join('');
  $('#acoes').hidden = !n;
  $('#atalho').hidden = !n;
  $('#atalho').textContent = `Ver minha setlist (${n}/${LIMITE}) ↓`;
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
    for (const id of ['baixar', 'story', 'compartilhar']) $(`#${id}`).disabled = sim;
  };
  ocupado(true, 'Montando a folha...');
  $('#aviso').textContent = '';
  const falhas = await desenharFolha($('#folha'), { show: estado.show, musicas: [...estado.lista] }, {
    vigente: () => meu === pedido,
    progresso: (k, total) => { $('#estado-folha').textContent = `Montando a folha... ${k}/${total}`; },
    atrasada: (faltam) => { if (!faltam) $('#aviso').textContent = ''; },
  }).catch(() => -1);
  if (meu !== pedido) return;
  ocupado(false);
  if (falhas) $('#aviso').textContent = falhas < 0 ? 'Não consegui desenhar a folha. Recarregue a página.'
    : 'Algumas imagens não chegaram (internet lenta?). A folha saiu com letra simples nessas e se ajeita sozinha quando chegarem.';
}

function tudo() { catalogo(); selecionadas(); folha(); }

function sortear() {
  const escolha = sortearShow(grupos, modelo);
  estado.lista = escolha;
  tudo();
  $('#previa').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mover(i, j) {
  if (j < 0 || j >= estado.lista.length) return;
  const [m] = estado.lista.splice(i, 1);
  estado.lista.splice(j, 0, m);
}

async function baixar(tipo) {
  const nome = `setlist-eddie-ibirapuera-${estado.show === 2 ? '22' : '20'}-11${tipo === 'story' ? '-story' : ''}.jpg`;
  try {
    const blob = await paraBlob(tipo === 'story' ? story($('#folha')) : $('#folha'));
    await entregar(blob, nome, { compartilhar: tipo === 'compartilhar' });
  } catch (e) { $('#aviso').textContent = 'Não consegui gerar a imagem. Tire um print da folha.'; }
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
    bis: () => { estado.lista[i].bis = !estado.lista[i].bis; },
    sobe: () => mover(i, i - 1), desce: () => mover(i, i + 1), tira: () => estado.lista.splice(i, 1),
  };
  if (acoes[b.dataset.acao]) { acoes[b.dataset.acao](); return tudo(); }
  if (b.dataset.show) {
    estado.show = Number(b.dataset.show);
    document.querySelectorAll('[data-show]').forEach((x) => x.classList.toggle('on', x === b));
    return folha();
  }
  const extras = { sortear, limpar: () => { estado.lista = []; tudo(); },
    ouvir: () => window.open(`https://www.youtube.com/watch_videos?video_ids=${
      estado.lista.filter((m) => m.yt).slice(0, 50).map((m) => m.yt).join(',')}`, '_blank', 'noopener'),
    atalho: () => $('#minha').scrollIntoView({ behavior: 'smooth', block: 'start' }),
    baixar: () => baixar('folha'), story: () => baixar('story'), compartilhar: () => baixar('compartilhar') };
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
  .catch(() => { $('#catalogo').textContent = 'Não consegui carregar a lista de músicas. Recarregue a página.'; });
