// Botão "Compartilhar" (WhatsApp) ao lado do "Só a imagem", embaixo do botão dourado do vídeo. No toque gera a MESMA
// imagem do story (story.js + folha.js, as funções que o app.js usa) e abre o compartilhar do celular com ela e o texto.
// Onde não dá pra mandar arquivo (computador, navegador interno do Instagram) abre o WhatsApp só com texto e link.
// Módulo apartado: traz o próprio CSS e não mexe no app.js. Sem o botão do vídeo, fica o layout antigo.
// Desligar: LIGADO = false ou ?sem-zap na URL.
import { story } from './story.js';
import { paraBlob } from './folha.js';
import { DENTRO_DE_APP } from './salvar.js';
import { linkAtual } from './link-setlist.js';

const LIGADO = true;
const SITE = 'https://somaisumfadepearljam.com.br/setlist-ibirapuera';
const $ = (s) => document.querySelector(s);

// noite: 1 = sexta 20/11, 2 = domingo 22/11.
export const texto = (noite) => `Esse vai ser o meu setlist no show do Eddie Vedder no Ibirapuera, dia ${noite === 2 ? '22' : '20'}/11! `
  + `Qual vai ser o seu? Faz o seu aqui: ${SITE}`;
export const linkWhats = (txt) => `https://wa.me/?text=${encodeURIComponent(txt)}`;
// 'arquivo' = compartilhar do sistema com a imagem; 'whats' = WhatsApp só com o texto.
export const caminho = ({ podeArquivo, dentro }) => (podeArquivo && !dentro ? 'arquivo' : 'whats');

const ZAP = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const FOTO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f0b93a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Ccircle cx='9' cy='9' r='1.8'/%3E%3Cpath d='M21 15l-4.5-4.5L6 21'/%3E%3C/svg%3E\")";
// Os dois botões iguais numa linha (grid 1fr 1fr). As regras vencem o "#acoes.com-video #story" do index.html.
const CSS = `#acoes.com-video.com-zap { column-gap: 10px; }
#acoes.com-video.com-zap #story, #acoes.com-video.com-zap #compartilhar { grid-column: auto; box-sizing: border-box; width: 100%; min-width: 0;
  height: 50px; min-height: 50px; padding: 0 8px; gap: 8px; border: 1.5px solid; border-radius: 12px; font-size: 15px; font-weight: 700;
  line-height: 1; white-space: nowrap; text-decoration: none; animation: none; box-shadow: none; }
#acoes.com-video.com-zap #story { color: #f0b93a; border-color: #f0b93a; background: #f0b93a1f; }
#acoes.com-video.com-zap #compartilhar { color: #25D366; border-color: #25D366; background: #25d3661f; }
#acoes.com-video.com-zap #story::before { content: ''; flex: none; width: 20px; height: 20px; background: ${FOTO} center / contain no-repeat; }
#acoes.com-video.com-zap #compartilhar svg { flex: none; }
#acoes.com-video.com-zap :is(#story, #compartilhar):disabled { opacity: .45; }
#acoes.com-video.com-zap :is(#story, #compartilhar).gerando { pointer-events: none; }
#acoes.com-video.com-zap :is(#story, #compartilhar).gerando span { font-size: 0; }
#acoes.com-video.com-zap :is(#story, #compartilhar).gerando span::after { content: ''; display: inline-block; width: 16px; height: 16px; margin: 0;
  border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: gira .7s linear infinite; }`;

// Abre o WhatsApp com o texto. Se o navegador barrar a aba nova, vai na mesma aba, deixando a setlist no endereço
// (link-setlist.js) pra ela estar lá quando a pessoa voltar.
function abrirWhats(txt) {
  const url = linkWhats(txt), aba = window.open(url, '_blank');
  if (aba) { try { aba.opener = null; } catch (e) { /* ok */ } return; }
  try { const link = linkAtual(); if (link) history.replaceState(history.state, '', link); } catch (e) { /* ok */ }
  location.href = url;
}

async function compartilhar(b) {
  if (b.disabled || b.classList.contains('gerando')) return;
  const noite = /22\/11/.test($('#r-show')?.textContent) ? 2 : 1, txt = texto(noite);
  const nome = `setlist-eddie-ibirapuera-${noite === 2 ? '22' : '20'}-11.jpg`;
  let podeArquivo = false;
  try { podeArquivo = !!navigator.canShare?.({ files: [new File([''], nome, { type: 'image/jpeg' })] }); } catch (e) { /* sem compartilhar */ }
  // Sem arquivo: abre já, ainda dentro do toque (depois de esperar a imagem o navegador barraria a aba).
  if (caminho({ podeArquivo, dentro: DENTRO_DE_APP }) === 'whats') return abrirWhats(txt);
  b.classList.add('gerando');
  try {
    const blob = await paraBlob(await story($('#folha')));
    await navigator.share({ files: [new File([blob], nome, { type: 'image/jpeg' })], text: txt });
  } catch (e) {
    if (e?.name !== 'AbortError') abrirWhats(txt); // a pessoa fechou a folha de compartilhar: não insiste
  }
  b.classList.remove('gerando');
}

const ref = typeof document !== 'undefined' && LIGADO && !/[?&]sem-zap/.test(location.search) ? $('#story') : null;
// story-video.js (carregado antes) marca #acoes com .com-video quando o vídeo é o botão principal.
if (ref && $('#acoes')?.classList.contains('com-video')) {
  document.head.append(Object.assign(document.createElement('style'), { textContent: CSS }));
  const b = Object.assign(document.createElement('button'), { id: 'compartilhar', type: 'button', className: 'btn', innerHTML: `${ZAP}<span>Compartilhar</span>` });
  b.setAttribute('aria-label', 'Compartilhar no WhatsApp');
  ref.firstElementChild.textContent = 'Só a imagem';
  ref.setAttribute('aria-label', 'Baixar só a imagem');
  ref.after(b);
  $('#acoes').classList.add('com-zap');
  const espelhar = () => { b.disabled = ref.disabled; };
  new MutationObserver(espelhar).observe(ref, { attributes: true, attributeFilter: ['disabled'] });
  espelhar();
  b.addEventListener('click', () => compartilhar(b));
}
