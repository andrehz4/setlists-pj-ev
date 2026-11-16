// Lista legível das músicas ao lado da folha: a letra de mão nem sempre dá pra ler.
// Lê o #lista que o app.js desenha (nome + botão de bis ligado) e repete em texto simples.
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function musicasDaLista() {
  return [...$('#lista').children].map((li) => ({
    nome: li.querySelector('.nome').textContent,
    bis: li.querySelector('[data-acao="bis"]').classList.contains('on'),
  }));
}

function desenhar() {
  const ms = musicasDaLista();
  $('#bloco-lidas').hidden = !ms.length;
  $('#lidas').innerHTML = ms.map((m, i) => `<li><i>${i + 1}</i>${esc(m.nome)}</li>${
    m.bis && i < ms.length - 1 ? '<li class="bis">bis</li>' : ''}`).join('');
}

new MutationObserver(desenhar).observe($('#lista'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
desenhar();
