// Passada 2B contextual: reduz tiques de tradução em interpretations.json.
// Alvos:
//   1. "o tipo de" (271 ocorrências) — varia o invólucro mantendo o sentido.
//   2. "estruturada em torno de" (23) — varia a relação estrutural.
//   3. "da canção" subtiques: "a estrutura/o verso da canção convida/exige" (50+).
//
// Rotações determinísticas: cada padrão tem um pool de sinônimos e um contador
// que cicla pelo pool, garantindo que repetições do mesmo padrão recebam
// formas diferentes. Mesma entrada -> mesma saída (idempotência por seed).

import fs from 'node:fs';

const IN = 'media/interpretations.json';
const OUT_DRY = 'media/interpretations.pass2b.json';

const orig = fs.readFileSync(IN, 'utf8');
const data = JSON.parse(orig);

// ---------- rotators ----------
function rot(pool) {
  let i = 0;
  return () => pool[(i++) % pool.length];
}

const rComoOTipoDe = rot([
  'como a espécie de',
  'ocupando a função de',
  'no papel de',
  'cumprindo o papel de',
  'como o gênero de',
  'como aquela espécie de',
  'como o formato de',
  'como aquele tipo de',
  'como a modalidade de',
  'como a forma de',
  'como aquela modalidade de',
]);

const rNoTipoDe = rot([
  'na espécie de',
  'no gênero de',
  'naquele tipo de',
  'na forma de',
  'no formato de',
  'naquela espécie de',
]);

const rDoTipoDe = rot([
  'da espécie de',
  'do gênero de',
  'daquele tipo de',
  'da forma de',
  'do formato de',
  'daquela espécie de',
]);

const rAoTipoDe = rot([
  'à espécie de',
  'ao gênero de',
  'àquele tipo de',
  'à forma de',
  'ao formato de',
  'àquela espécie de',
]);

const rPraOTipoDe = rot([
  'pra espécie de',
  'pro gênero de',
  'pra forma de',
  'pro formato de',
  'pra modalidade de',
  'pra aquele tipo de',
]);

const rOTipoDeGenerico = rot([
  'a espécie de',
  'o gênero de',
  'aquele tipo de',
  'a forma de',
  'o formato de',
  'aquela espécie de',
  'a modalidade de',
  'aquele gênero de',
]);

const rEstruturadaEmTorno = rot([
  'construída sobre',
  'armada em torno de',
  'centrada em',
  'ancorada em',
  'que se ergue sobre',
  'erguida sobre',
  'que gira em torno de',
  'que se organiza em torno de',
  'sustentada por',
  'que se desdobra a partir de',
]);

// "(música|canção) é estruturada em torno de" -> casos de cabeçalho
const rEhEstruturada = rot([
  'se ergue sobre',
  'se constrói sobre',
  'se organiza em torno de',
  'gira em torno de',
  'se ancora em',
  'se arma em torno de',
]);

const rEstruturaConvida = rot([
  'a arquitetura da faixa pede',
  'o desenho da canção convida',
  'a arquitetura convida',
  'a estrutura pede',
  'a forma da canção convida',
  'o arranjo da canção convida',
  'a estrutura da faixa pede',
  'a arquitetura da canção pede',
]);

// Para "que o verso da canção exige"
const rVersoExige = rot([
  'que o verso pede',
  'que o verso da faixa exige',
  'que o verso da música exige',
  'que aquele verso exige',
  'que o verso requer',
  'que o verso reclama',
  'que o verso solicita',
]);

// ---------- substituidores ----------
function applyAll(text) {
  if (typeof text !== 'string') return text;
  let s = text;

  // 1) "música/canção é estruturada em torno de" -> reorganiza a oração
  // Captura: "A música é estruturada em torno de" / "A canção é estruturada em torno de"
  s = s.replace(/\b(música|canção) é estruturada em torno de\b/gi, (_, w) => `${w} ${rEhEstruturada()}`);

  // 2) "estruturada em torno de" remanescente (após adjetivos, etc.)
  s = s.replace(/\bestruturada em torno de\b/g, () => rEstruturadaEmTorno());

  // 3) "a estrutura da canção convida" / "estrutura da canção convida"
  s = s.replace(/\ba? ?estrutura da canção convida\b/g, () => rEstruturaConvida());

  // 4) "que o verso da canção exige"
  s = s.replace(/\bque o verso da canção exige\b/g, () => rVersoExige());

  // 5) "como o tipo de"
  s = s.replace(/\bcomo o tipo de\b/g, () => rComoOTipoDe());

  // 6) Contrações comuns antes de "tipo de"
  s = s.replace(/\bno tipo de\b/g, () => rNoTipoDe());
  s = s.replace(/\bdo tipo de\b/g, () => rDoTipoDe());
  s = s.replace(/\bao tipo de\b/g, () => rAoTipoDe());
  s = s.replace(/\bpra o tipo de\b/g, () => rPraOTipoDe());
  s = s.replace(/\bpro tipo de\b/g, () => rPraOTipoDe());

  // 7) "o tipo de" genérico remanescente
  s = s.replace(/\bo tipo de\b/g, () => rOTipoDeGenerico());

  return s;
}

function walk(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') obj[i] = applyAll(obj[i]);
      else walk(obj[i]);
    }
    return;
  }
  for (const k of Object.keys(obj)) {
    if (k === 'text_pt' && typeof obj[k] === 'string') {
      obj[k] = applyAll(obj[k]);
    } else if (k === 'byShow_pt' && typeof obj[k] === 'object' && obj[k] !== null) {
      for (const showKey of Object.keys(obj[k])) {
        if (typeof obj[k][showKey] === 'string') {
          obj[k][showKey] = applyAll(obj[k][showKey]);
        }
      }
    } else if (typeof obj[k] === 'object') {
      walk(obj[k]);
    }
  }
}

walk(data);

// Mantém formatação canônica (2 espaços + newline final) idêntica à origem.
const out = JSON.stringify(data, null, 2) + '\n';
fs.writeFileSync(OUT_DRY, out);
console.log(`escrito dry-run: ${OUT_DRY}  (${out.length} bytes)`);
