// Contador interno do gerador (painel privado do Andre): avisa o servidor que algo aconteceu.
// Vai o nome do evento, a noite marcada (20 ou 22) e se a página está no navegador interno do Instagram. No sorteio,
// nos downloads e no compartilhar vai também o primeiro nome digitado (o do título) e o texto que o filtro barrou.
// Nada de cookie, armazenamento ou identificador. Falha em silêncio: se o envio não sair, o gerador segue igual.
// Não mexe no app.js nem no telas.js: escuta os cliques no document. Desligar: LIGADO = false ou ?sem-contador na URL.
// Servidor: functions/api/contador.js (a lista de eventos de lá tem que conter a daqui; o teste confere).
import { DENTRO_DE_APP } from './salvar.js';
import { CODIGO } from './link-setlist.js';

const LIGADO = true;
const ROTA = '/api/contador';
export const EVENTOS = ['visita', 'sorteou', 'montou', 'pediu_video', 'baixou_video', 'baixou_imagem', 'saiu_app', 'abriu_fora', 'compartilhou'];

export const COM_NOME = ['sorteou', 'baixou_video', 'baixou_imagem', 'compartilhou'];
const MAX_NOME = 30;

// O mesmo primeiro nome que o telas.js põe no título, e o texto bruto que o filtro.js barrou (data-barrado do campo).
export function nomeDoCampo(campo) {
  const nome = String(campo?.value || '').trim().split(/\s+/)[0].replace(/[<>&"]/g, '').slice(0, MAX_NOME);
  return { nome, barrado: String(campo?.dataset?.barrado || '').trim().slice(0, MAX_NOME) };
}

// Corpo do envio: { e, ig, n?, nome?, bar? }. `noite` é o data-show marcado (1 = 20/11, 2 = 22/11).
// Nome vazio não vai, e nome só acompanha os eventos de COM_NOME.
export function corpo(evento, { noite = null, dentro = false, nome = '', barrado = '' } = {}) {
  const c = { e: evento, ig: dentro ? 1 : 0 };
  if (noite === 1 || noite === 2) c.n = noite === 2 ? 22 : 20;
  if (COM_NOME.includes(evento)) {
    if (nome) c.nome = nome;
    if (barrado) c.bar = barrado;
  }
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
    const campo = COM_NOME.includes(evento) ? document.querySelector('#nome') : null;
    const dados = corpo(evento, { noite, dentro: DENTRO_DE_APP, ...nomeDoCampo(campo) });
    if (campo?.dataset?.barrado) delete campo.dataset.barrado; // o texto barrado vai uma vez só
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
