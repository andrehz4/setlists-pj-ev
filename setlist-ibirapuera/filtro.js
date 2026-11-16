// Filtro do nome que vai no título e no story: só letras, e nada de palavrão, crime, ódio ou coisa bizarra.
// Normaliza antes de comparar (minúsculas, sem acento, 0→o 1→i 3→e 4→a 5→s 7→t @→a $→s, letra repetida vira uma),
// então "P3D0", "pórrraaa" e "p u t a" caem igual. Escuta o input em captura, ANTES do telas.js usar o valor.

// Raízes que barram em qualquer parte do nome (longas o bastante pra não pegar nome de gente de verdade).
const RAIZES = ['caralh', 'buceta', 'boceta', 'putari', 'arombad', 'punhet', 'siriric', 'boquet', 'estupr', 'pedofil',
  'nazis', 'hitler', 'xoxota', 'xereca', 'piroc', 'cocain', 'maconh', 'terroris', 'retardad', 'fuck', 'shit', 'bitch',
  'cunt', 'pusy', 'niga', 'niger', 'fagot', 'whore', 'rapist', 'porn', 'viad', 'cuzao', 'pora', 'merda', 'bosta', 'foder', 'fodid',
  'otari', 'babaca', 'travec', 'sapatao', 'crioul', 'racist', 'suicid', 'cacet', 'escrot', 'vagabund', 'piranha',
  'zofil', 'necrofil', 'incest', 'sexo', 'sexy', 'penis', 'vagina', 'bunda', 'peito', 'gostos', 'tesao', 'tezao',
  'gozad', 'chupa', 'slut', 'nude', 'onlyfan', 'assassin', 'matador', 'traficant', 'bandid', 'ladrao', 'golpist',
  'genocid', 'massacr', 'abuso', 'abusad', 'jihad'];
// Palavras que só barram sozinhas (curtas demais pra procurar dentro de outro nome).
const INTEIRAS = ['puta', 'puto', 'cu', 'pau', 'rola', 'pica', 'bicha', 'foda', 'fdp', 'vsf', 'pqp', 'tnc', 'gozo',
  'gozar', 'pedo', 'macaco', 'mongol', 'morte', 'matar', 'droga', 'crack', 'rape', 'xota', 'nazi', 'ku', 'krl', 'prr',
  'bct', 'pnc', 'cuzinho', 'pinto', 'saco', 'teta', 'tetas', 'anal', 'oral', 'cum', 'ass', 'hell', 'diabo', 'satan',
  'capeta', 'lucifer', 'demonio', 'cadaver', 'defunto', 'arma', 'bomba', 'tiro', 'mama', 'anus', 'dick', 'cock'];
// Fora de propósito: 'nig' (Nigel), 'fag' (Fagner, Fagundes), 'isis' (Ísis), 'kkk' (vira 'k' na normalização).

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

export function normalizar(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[013457@$]/g, (c) => LEET[c]).replace(/(.)\1+/g, '$1');
}

// true quando o nome não pode aparecer no título nem no story.
export function nomeProibido(nome) {
  const n = normalizar(nome);
  const palavras = n.split(/[^a-z]+/).filter(Boolean);
  const junto = palavras.join('');
  const inteiras = INTEIRAS.map(normalizar);
  if (palavras.some((p) => inteiras.includes(p)) || inteiras.includes(junto)) return true;
  return RAIZES.some((r) => junto.includes(normalizar(r)));
}

// Deixa só letras latinas (A-Z e acentuadas À-ÿ, sem × e ÷), espaço e apóstrofo, e corta no primeiro hífen.
// Letra cirílica ou grega parecida ("putа", "hіtler") cai fora, e "Ganhe-ingresso-pix" vira "Ganhe".
export const soLetras = (t) => String(t).split('-')[0].replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s']/g, '').replace(/\s{2,}/g, ' ').slice(0, 18);

if (typeof document !== 'undefined' && document.querySelector('#nome')) { // só na página, com o campo do nome
  const campo = document.querySelector('#nome');
  const aviso = Object.assign(document.createElement('small'), { id: 'nome-aviso', role: 'status' });
  aviso.style.cssText = 'color:var(--cor);font-size:13px;min-height:1em';
  campo?.after(aviso);
  const conferir = () => {
    const limpo = soLetras(campo.value);
    if (nomeProibido(campo.value) || nomeProibido(limpo)) { // cru também: "p3d0" sem os números vira "pd"
      campo.dataset.barrado = campo.value.slice(0, 30); // o contador.js manda pro painel o que foi barrado
      campo.value = '';
      aviso.textContent = 'Esse nome não rola por aqui. Coloque o seu primeiro nome.';
    } else {
      if (limpo !== campo.value) campo.value = limpo;
      if (limpo) aviso.textContent = '';
    }
  };
  document.addEventListener('input', (e) => { if (e.target === campo) conferir(); }, true);
  // Nome salvo de antes também passa no filtro (o telas.js já colocou no campo).
  if (campo && (nomeProibido(campo.value) || soLetras(campo.value) !== campo.value)) {
    conferir();
    campo.dispatchEvent(new Event('input'));
  }
}
