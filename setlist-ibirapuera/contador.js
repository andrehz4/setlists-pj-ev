// Contador interno do gerador (painel privado do Andre): avisa o servidor que algo aconteceu, sem dado pessoal.
// Vai só o nome do evento, a noite marcada (20 ou 22) e se a página está no navegador interno do Instagram.
// Nada de nome, cookie, armazenamento ou identificador. Falha em silêncio: se o envio não sair, o gerador segue igual.
// Não mexe no app.js nem no telas.js: escuta os cliques no document. Desligar: LIGADO = false ou ?sem-contador na URL.
// Servidor: functions/api/contador.js (a lista de eventos de lá tem que conter a daqui; o teste confere).
import { DENTRO_DE_APP } from './salvar.js';
import { CODIGO } from './link-setlist.js';

const LIGADO = true;
const ROTA = '/api/contador';
export const EVENTOS = ['visita', 'sorteou', 'montou', 'pediu_video', 'baixou_video', 'baixou_imagem', 'saiu_app', 'abriu_fora', 'compartilhou'];

// Corpo do envio: { e, ig, n? }. `noite` é o data-show marcado (1 = 20/11, 2 = 22/11).
export function corpo(evento, { noite = null, dentro = false } = {}) {
  const c = { e: evento, ig: dentro ? 1 : 0 };
  if (noite === 1 || noite === 2) c.n = noite === 2 ? 22 : 20;
  return JSON.stringify(c);
}

// Qual evento um clique vale. `b` é o botão clicado (ou null); `dentro` = navegador interno de app.
export function eventoDoClique(b, dentro) {
  if (!b || b.disabled) return null;
  if (b.id === 'sortear') return 'sorteou'; // "Sortear de novo" clica neste mesmo botão
  if (b.dataset && 'gerar' in b.dataset) return 'montou'; // "Ver a minha folha", depois de montar à mão
  const gerando = b.classList.contains('gerando');
  if (b.id === 'story') return gerando ? null : 'baixou_imagem';
  if (b.id === 'story-video') return gerando ? null : dentro ? 'saiu_app' : 'pediu_video';
  if (b.id === 'compartilhar') return gerando ? null : 'compartilhou'; // botão do WhatsApp (compartilhar.js)
  // "Postar no story" na tela do vídeo pronto: conta uma vez por vídeo gravado.
  const tela = b.closest('#salvar-tela');
  if (tela && b.classList.contains('cheio') && tela.querySelector('video') && !tela.dataset.contado) { tela.dataset.contado = '1'; return 'baixou_video'; }
  return null;
}

function enviar(evento) {
  try {
    // A noite só vale depois que a pessoa gerou uma folha; na chegada o seletor ainda está no padrão.
    const noite = evento === 'visita' || evento === 'abriu_fora' ? null : Number(document.querySelector('#shows .on')?.dataset.show) || null;
    const dados = corpo(evento, { noite, dentro: DENTRO_DE_APP });
    // sendBeacon sobrevive à troca de página (o botão do vídeo dentro do Instagram sai do site na hora).
    if (navigator.sendBeacon?.(ROTA, dados)) return;
    fetch(ROTA, { method: 'POST', body: dados, keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch (e) { /* contador nunca atrapalha o gerador */ }
}

if (LIGADO && typeof document !== 'undefined' && document.addEventListener && !/[?&]sem-contador/.test(location.search)) {
  enviar('visita');
  if (CODIGO) enviar('abriu_fora'); // chegou com ?s=<código>: veio do Instagram pro navegador de verdade
  else if (location.hash === '#sortear') enviar('sorteou'); // atalho que já sorteia ao abrir
  // Fase de captura: lê o estado do botão antes de o app.js e o story-video.js reagirem ao mesmo clique.
  document.addEventListener('click', (e) => {
    try {
      const ev = eventoDoClique(e.target?.closest?.('button'), DENTRO_DE_APP);
      if (ev) enviar(ev);
    } catch (err) { /* idem */ }
  }, true);
}
