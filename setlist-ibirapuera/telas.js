// Navegação entre as 3 telas, sorteio pessoal, estatísticas de sorte, Spotify e estado de carregando da folha.
// Não mexe no app.js: lê a lista que ele desenha em #lista e reaproveita os mesmos botões por id.
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
// Vídeo de fundo: só o poster com movimento reduzido
const video = $('#fundo-video'), calmo = matchMedia('(prefers-reduced-motion: reduce)');
const ajustarVideo = () => { if (calmo.matches) { video.pause(); video.removeAttribute('autoplay'); } else video.play().catch(() => {}); };
calmo.addEventListener('change', ajustarVideo); ajustarVideo();
let dados = null, porNome = new Map();

// Telas
function ir(tela, empurrar = true) {
  document.body.dataset.tela = tela;
  fecharSheets();
  if (tela === 'resultado') $('#vaga-resultado').append($('#shows'));
  window.scrollTo(0, 0);
  if (empurrar) history.pushState({ tela }, '');
}
addEventListener('popstate', (e) => ir(e.state?.tela || 'chegada', false));
history.replaceState({ tela: 'chegada' }, '');

function fecharSheets() {
  ['#sorteio', '#fundo-sorteio', '#gaveta', '#fundo-gaveta'].forEach((s) => $(s).classList.remove('aberto'));
}
function abrirSorteio() {
  $('#vaga-sorteio').append($('#shows'));
  $('#sorteio').classList.add('aberto'); $('#fundo-sorteio').classList.add('aberto');
}

// Nome opcional
$('#nome').value = localStorage.getItem('setlist-nome') || '';
$('#nome').addEventListener('input', () => { localStorage.setItem('setlist-nome', $('#nome').value.trim()); titulo(); });
function titulo() {
  const n = $('#nome').value.trim().split(/\s+/)[0];
  $('#r-nome').innerHTML = n ? `A setlist <em>${n.replace(/[<>&"]/g, '')}</em>` : 'A sua <em>setlist</em>';
  const on = $('#shows .on')?.dataset.show === '2';
  $('#r-show').textContent = on ? 'Dom 22/11 · São Paulo II · Ibirapuera' : 'Sex 20/11 · São Paulo I · Ibirapuera';
}

// Cliques (o app.js trata os ids dele no mesmo document; aqui só a navegação)
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.id === 'abrir-sorteio') return abrirSorteio();
  if (b.id === 'ir-montar') return ir('montar');
  if (b.dataset.ir) return ir(b.dataset.ir);
  if (b.id === 'sortear') { setTimeout(() => ir('resultado')); return; }
  if (b.id === 'outra') return $('#sortear').click();
  if (b.dataset.gerar) return ir('resultado');
  if (b.id === 'abrir-gaveta') { $('#gaveta').classList.add('aberto'); $('#fundo-gaveta').classList.add('aberto'); return; }
  if (b.id === 'fechar-gaveta') return fecharSheets();
  if (b.dataset.show) setTimeout(titulo);
  if (b.id === 'ver-spotify') { $('#sp-lista').hidden = !$('#sp-lista').hidden; return; }
}, true);
['#fundo-sorteio', '#fundo-gaveta'].forEach((s) => $(s).addEventListener('click', fecharSheets));

// Feedback ao adicionar
let toastT;
document.addEventListener('click', (e) => {
  const b = e.target.closest('button.add');
  if (!b || b.disabled) return;
  const n = $('#lista').children.length;
  const nome = b.firstChild?.textContent?.trim() || 'Música';
  const t = $('#toast');
  t.textContent = n >= 24 ? 'Chegou no limite de 24 músicas' : `+ ${nome} · ${n + 1}/24`;
  t.classList.add('ver'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('ver'), 1400);
  const g = $('#abrir-gaveta'); g.classList.remove('pulo'); void g.offsetWidth; g.classList.add('pulo');
}, true);

// Lê a lista atual direto do #lista que o app.js desenha
function lista() {
  return [...$('#lista').children].map((li) => {
    const nome = li.querySelector('.nome').textContent;
    return { ...(porNome.get(nome) || { nome }), bis: li.querySelector('[data-acao="bis"]').classList.contains('on') };
  });
}

const pct = (x) => (x ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: x < 1 ? 1 : 0 });
const dataBR = (d) => d ? d.split('-').reverse().slice(0, 2).join('/') + '/' + d.slice(2, 4) : '';
function umEm(p) {
  if (p <= 0) return null;
  const x = 1 / p;
  if (x < 1e6) return Math.round(x).toLocaleString('pt-BR');
  const nomes = [[1e15, 'quatrilhões'], [1e12, 'trilhões'], [1e9, 'bilhões'], [1e6, 'milhões']];
  if (x < 1e18) { const [v, n] = nomes.find(([v]) => x >= v); return `${(x / v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <small>${n}</small>`; }
  return `10<sup>${Math.floor(Math.log10(x))}</sup>`;
}

function sorte(ms) {
  if (!dados || !ms.length) return;
  const S = dados.showsSolo, n = ms.length;
  const comDado = ms.filter((m) => m.vezes > 0);
  const nunca = ms.filter((m) => !m.vezes);
  const indice = Math.round(ms.reduce((s, m) => s + (m.pct || 0), 0) / n);
  const esperadas = ms.reduce((s, m) => s + (m.pct || 0) / 100, 0);
  const rara = [...comDado].sort((a, b) => a.pct - b.pct)[0];
  const certa = [...comDado].sort((a, b) => b.pct - a.pct)[0];
  const de26 = ms.filter((m) => m.ult?.startsWith('2026'));
  const chance = nunca.length ? null : umEm(ms.reduce((p, m) => p * m.pct / 100, 1));
  const c = [];
  c.push(`<div class="carta larga indice"><div><div class="rot">Índice de sorte</div>
    <div class="txt">Em média, cada música sua apareceu em ${indice}% dos ${S} shows solo.</div></div>
    <div class="val">${indice}<small>/100</small></div><div class="medidor"><i style="width:${indice}%"></i></div></div>`);
  if (rara) c.push(`<div class="carta"><div class="rot">Carta mais rara</div><div class="val">${pct(rara.pct)}<small>%</small></div>
    <div class="txt"><b>${rara.nome}</b>, só em ${rara.vezes} ${rara.vezes === 1 ? 'show' : 'shows'}</div></div>`);
  if (certa) c.push(`<div class="carta"><div class="rot">A mais garantida</div><div class="val">${pct(certa.pct)}<small>%</small></div>
    <div class="txt"><b>${certa.nome}</b>, em ${certa.vezes} shows</div></div>`);
  c.push(`<div class="carta"><div class="rot">Tocadas em 2026</div><div class="val">${de26.length}<small>/${n}</small></div>
    <div class="txt">${de26.length ? `A mais recente: <b>${[...de26].sort((a, b) => b.ult.localeCompare(a.ult))[0].nome}</b>, ${dataBR([...de26].sort((a, b) => b.ult.localeCompare(a.ult))[0].ult)}` : 'Nenhuma saiu do baú este ano'}</div></div>`);
  c.push(`<div class="carta"><div class="rot">Num show típico</div><div class="val">${esperadas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<small>/${n}</small></div>
    <div class="txt">das suas estariam lá. Ele toca ${String(dados.mediaPorShow).replace('.', ',')} por noite.</div></div>`);
  c.push(nunca.length
    ? `<div class="carta larga"><div class="rot">Chance de ouvir todas</div><div class="val">0</div>
      <div class="txt"><b>${nunca[0].nome}</b>${nunca.length > 1 ? ` e mais ${nunca.length - 1}` : ''} ${nunca.length > 1 ? 'nunca entraram' : 'nunca entrou'} num show solo. Sonhar é de graça.</div></div>`
    : `<div class="carta larga"><div class="rot">Chance de ouvir todas</div><div class="val"><small>1 em</small> ${chance}</div>
      <div class="txt">Multiplicando a frequência de cada uma nos ${S} shows solo desde ${dados.primeiroShow.data.slice(0, 4)}.</div></div>`);
  $('#sorte').innerHTML = c.join('');
}

function spotify(ms) {
  const com = ms.filter((m) => m.sp).length;
  $('#ver-spotify').innerHTML = `<i class="sp-ico"></i>Spotify${com < ms.length ? ` (${com} de ${ms.length})` : ''}`;
  $('#sp-lista').innerHTML = ms.map((m, i) => m.sp
    ? `<li><a href="https://open.spotify.com/track/${m.sp}" target="_blank" rel="noopener"><i>${i + 1}</i>${m.nome}</a></li>`
    : `<li><span><i>${i + 1}</i>${m.nome}</span></li>`).join('');
}

// Carregando: pré-carrega as mesmas imagens que a folha usa e só então mostra o canvas
let geracao = 0;
const carregar = (src) => new Promise((ok) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = im.onerror = ok; im.src = src; });
async function esperarFolha(ms) {
  const g = ++geracao;
  $('#papel').classList.add('desenhando');
  const show = $('#shows .on')?.dataset.show === '2' ? 'cab-sp2' : 'cab-sp1';
  await Promise.all(['https://assets.glitch.ge/pearljam/setlistgenerator/papers/pearl-jam-set-list-paper-without-lines.jpg',
    `img/${show}.png`, 'img/cab-ibira.png', 'img/traco-bis.png', ...ms.map((m) => m.png).filter(Boolean)].map(carregar));
  await new Promise((r) => setTimeout(r, 250));
  if (g === geracao) $('#papel').classList.remove('desenhando');
}

let ultimaChave = '';
function atualizar() {
  const ms = lista();
  const n = ms.length;
  document.body.classList.toggle('sem-lista', !n);
  $('#conta-mini').textContent = `${n}/24`;
  document.querySelectorAll('[data-gerar]').forEach((b) => { b.disabled = !n; });
  const chave = ms.map((m) => m.nome + (m.bis ? '|' : '')).join(',') + $('#shows .on')?.dataset.show;
  if (chave === ultimaChave) return;
  ultimaChave = chave;
  sorte(ms); spotify(ms); titulo();
  if (n) esperarFolha(ms);
}
new MutationObserver(atualizar).observe($('#lista'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
new MutationObserver(atualizar).observe($('#shows'), { subtree: true, attributes: true, attributeFilter: ['class'] });

fetch('musicas.json').then((r) => r.json()).then((d) => {
  dados = d;
  d.grupos.flatMap((g) => g.musicas).forEach((m) => { if (!porNome.has(m.nome)) porNome.set(m.nome, m); });
  $('#base').textContent = `${d.showsSolo} shows solo do Eddie, de ${d.primeiroShow.data.slice(0, 4)} até hoje`;
  ultimaChave = ''; atualizar();
});

// Atalhos: #sortear (app.js já sorteia), ?tela=montar|resultado pra visualizar telas
const pronto = () => new Promise((ok) => { const t = setInterval(() => { if ($('#catalogo').children.length) { clearInterval(t); ok(); } }, 80); });
if (location.hash === '#sortear') ir('resultado', false);
else if (params.get('tela')) pronto().then(() => {
  if (params.has('demo') || params.get('tela') === 'resultado') $('#sortear').click();
  setTimeout(() => ir(params.get('tela'), false), 20);
  if (params.has('gaveta')) setTimeout(() => $('#abrir-gaveta').click(), 60);
  if (params.has('sheet')) setTimeout(abrirSorteio, 60);
});
titulo();
atualizar();
