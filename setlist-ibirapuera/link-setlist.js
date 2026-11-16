// Link que reabre a MESMA setlist: o estado (noite marcada, nome, as listas das duas noites e os traços de bis) vai
// num código curto em ?s=<base64url>. Serve pra quem chega pelo navegador interno do Instagram: o botão do vídeo abre
// o Chrome/Safari com esse link (abrir-fora.js) e a pessoa cai direto na folha dela, sem sortear de novo.
// Formato (texto, depois base64url): 1~<total do catálogo>~<noite>~<nome>~<lista 1>~<lista 2>, cada lista com a posição
// da música no catálogo em base 36, separadas por ponto, e "-" depois da que leva o traço de bis.
import { soLetras, nomeProibido } from './filtro.js';

const VERSAO = '1', LIMITE = 24, MAX_CODIGO = 900;
const $ = (s) => document.querySelector(s);

// Código que veio na URL, lido já na carga do módulo (depois de restaurar ele sai da barra de endereço).
export const CODIGO = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('s') : null;

const paraB64 = (txt) => btoa(String.fromCharCode(...new TextEncoder().encode(txt))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64 = (b) => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

// Uma música por chave, na ordem do catálogo (a mesma música pode aparecer em mais de um grupo).
function catalogo(grupos) {
  const vistas = new Set();
  return grupos.flatMap((g) => g.musicas).filter((m) => !vistas.has(m.chave) && vistas.add(m.chave));
}

// Nome do link passa pelo mesmo filtro do campo (filtro.js); nome barrado volta vazio.
export const nomeLimpo = (nome) => { const limpo = soLetras(nome || '').trim(); return nomeProibido(nome || '') || nomeProibido(limpo) ? '' : limpo; };

export function codificar({ show, listas, nome = '' }, grupos) {
  const cat = catalogo(grupos), pos = new Map(cat.map((m, i) => [m.chave, i]));
  const lista = (l) => (l || []).filter((m) => pos.has(m.chave)).map((m) => pos.get(m.chave).toString(36) + (m.bis ? '-' : '')).join('.');
  return paraB64([VERSAO, cat.length.toString(36), show === 2 ? 2 : 1, nomeLimpo(nome), lista(listas[1]), lista(listas[2])].join('~'));
}

// Devolve { show, nome, listas } ou null (código quebrado, de outra versão ou de um catálogo que mudou).
export function decodificar(codigo, grupos) {
  if (typeof codigo !== 'string' || !codigo || codigo.length > MAX_CODIGO || /[^A-Za-z0-9_-]/.test(codigo)) return null;
  let partes;
  try { partes = deB64(codigo).split('~'); } catch (e) { return null; }
  const cat = catalogo(grupos);
  if (partes.length !== 6 || partes[0] !== VERSAO || parseInt(partes[1], 36) !== cat.length || !/^[12]$/.test(partes[2])) return null;
  const lista = (txt) => {
    if (!txt) return [];
    const itens = txt.split('.'), usadas = new Set(), out = [];
    if (itens.length > LIMITE) return null;
    for (const [k, item] of itens.entries()) {
      const marca = /^([0-9a-z]+)(-?)$/.exec(item), m = marca && cat[parseInt(marca[1], 36)];
      if (!m || usadas.has(m.chave)) return null;
      usadas.add(m.chave);
      // Mesma regra do botão de bis no app.js: no máximo dois traços, e nunca depois da última.
      const bis = !!marca[2] && k < itens.length - 1 && out.filter((x) => x.bis).length < 2;
      out.push(bis ? { ...m, bis } : { ...m });
    }
    return out;
  };
  const l1 = lista(partes[4]), l2 = lista(partes[5]);
  if (!l1 || !l2 || !(l1.length + l2.length)) return null;
  return { show: Number(partes[2]), nome: nomeLimpo(partes[3]), listas: { 1: l1, 2: l2 } };
}

let atual = null; // { estado, grupos } do app.js, pra montar o link da setlist que está na tela

// Chamado pelo app.js quando o catálogo chega. Se a URL trouxe uma setlist válida, aplica no estado e devolve true.
export function ligar(estado, grupos) {
  atual = { estado, grupos };
  const veio = CODIGO && decodificar(CODIGO, grupos);
  if (!veio) return false;
  estado.show = veio.show; estado.listas = veio.listas;
  document.querySelectorAll('[data-show]').forEach((x) => x.classList.toggle('on', Number(x.dataset.show) === veio.show));
  // O telas.js lê o nome do armazenamento ao carregar e escuta o input: grava nos dois, vale em qualquer ordem de carga.
  try { localStorage.setItem('setlist-nome', veio.nome); } catch (e) { /* armazenamento bloqueado */ }
  const campo = $('#nome');
  if (campo) { campo.value = veio.nome; campo.dispatchEvent(new Event('input', { bubbles: true })); }
  // Tira o código da barra: recarregar depois de "Sortear de novo" não pode trazer a setlist antiga de volta.
  try { history.replaceState(history.state, '', location.pathname + location.hash); } catch (e) { /* ok */ }
  destacar();
  return true;
}

// Quando a folha fica pronta (o botão do story libera), leva a pessoa até o botão principal e avisa o que tocar.
function destacar() {
  const ref = $('#story');
  if (!ref) return;
  const olho = new MutationObserver(() => {
    if (ref.disabled) return;
    olho.disconnect();
    const video = $('#story-video'), b = video && !video.hidden ? video : ref, t = $('#toast');
    (b.closest('.alvo') || b).scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!t) return;
    t.textContent = `Sua setlist voltou! Toque em "${b.textContent.trim()}"`;
    t.classList.add('ver'); setTimeout(() => t.classList.remove('ver'), 5000);
  });
  olho.observe(ref, { attributes: true, attributeFilter: ['disabled'] });
}

// Endereço completo que reabre a setlist da tela (null enquanto o catálogo não chegou ou sem música nenhuma).
export function linkAtual() {
  if (!atual || !(atual.estado.listas[1].length + atual.estado.listas[2].length)) return null;
  const { estado, grupos } = atual;
  return `${location.origin}${location.pathname}?s=${codificar({ show: estado.show, listas: estado.listas, nome: $('#nome')?.value || '' }, grupos)}`;
}
