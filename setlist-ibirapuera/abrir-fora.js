// Navegador interno do Instagram/Facebook não grava nem baixa vídeo. Aqui o botão do vídeo abre o navegador de
// verdade (Chrome no Android, Safari no iPhone) já com o link da MESMA setlist (link-setlist.js). Lá fora a pessoa
// toca de novo em "Baixar vídeo para o seu stories". Se o app não deixar abrir, fica na tela o caminho pelo menu •••.
import { fecharTela } from './salvar.js';
import { linkAtual } from './link-setlist.js';

// Endereço que tira a pessoa do navegador interno. 'outro' = sem atalho conhecido, só a instrução do menu.
export function destino(link, ua) {
  const u = new URL(link), esquema = u.protocol.replace(':', '');
  if (/Android/i.test(ua)) {
    return { tipo: 'android', nome: 'Chrome', url: `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${esquema};package=com.android.chrome;`
      + `S.browser_fallback_url=${encodeURIComponent(link)};end` };
  }
  // x-safari-https:// abre o Safari direto (iOS 17 em diante); em iOS mais antigo nada acontece e vale a instrução.
  if (/iPhone|iPad|iPod/i.test(ua)) return { tipo: 'ios', nome: 'Safari', url: `x-safari-${link}` };
  return { tipo: 'outro', nome: 'navegador', url: null };
}

function painel(d, foto) {
  fecharTela();
  const p = document.createElement('div');
  p.id = 'salvar-tela';
  const abrindo = d.url ? `Abrindo no ${d.nome}…` : 'O vídeo sai no navegador do celular.';
  p.innerHTML = `<p role="status" style="margin:0;max-width:420px;text-align:center;line-height:1.45;font-weight:600">${abrindo}<br>
    Lá, toque de novo em “Baixar vídeo para o seu stories”. A sua setlist vai junto.</p>
    <p style="margin:0;max-width:420px;text-align:center;line-height:1.45;font-size:14px;color:#f2efe6b3">${d.url ? 'Não abriu? ' : ''}Toque em
    <b>•••</b> lá em cima e escolha <b>“Abrir no navegador externo”</b>${d.tipo === 'ios' ? '' : ' (ou “Abrir no Chrome”)'}.</p>
    <div class="botoes">${d.url ? `<a class="btn cheio" data-fora href="${d.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">Abrir no ${d.nome}</a>` : '<span></span>'}
    <button type="button" class="btn" data-fechar>Fechar</button></div>
    <button type="button" data-foto style="background:none;border:0;padding:8px;color:#f2efe6b3;font:inherit;font-size:14px;text-decoration:underline;text-underline-offset:3px">Prefere foto? Baixar só a imagem</button>`;
  p.querySelector('[data-fechar]').onclick = fecharTela;
  p.querySelector('[data-foto]').onclick = () => { fecharTela(); foto(); };
  document.body.append(p);
}

// Clique no botão do vídeo dentro do app. `foto` baixa a imagem (a opção que funciona ali mesmo).
export function abrirFora(foto, ua = navigator.userAgent) {
  const link = linkAtual();
  if (!link) return;
  // O link vai pra barra de endereço: se a pessoa sair pelo menu ••• do app, a setlist vai junto do mesmo jeito.
  try { history.replaceState(history.state, '', link); } catch (e) { /* ok */ }
  const d = destino(link, ua);
  painel(d, foto);
  if (d.url) location.href = d.url;
}
