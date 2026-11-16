// Geometria do story 1080x1920 (imagem e vídeo usam a mesma). Conta de baixo pra cima: o rodapé fica colado na base,
// as cartas empilham em cima dele e a FOLHA fica com tudo o que sobra até o título. Antes era tudo y fixo: quando o
// rodapé "Segue a gente" entrou, a folha encolheu pra 37% da largura e sobraram 12% de vazio embaixo.
// Respiro igual (RESPIRO) entre os grupos: folha, cartas e rodapé. O papel não entra mais atrás da carta do índice.
// Faixas do Instagram (~250 px no topo e na base): o Andre aprovou descer a chamada do @ pra dentro da faixa de baixo
// (uns 60 px) pra não grudar nas cartas nem encolher a folha; o rodapé todo acaba a BASE px da borda.
import { W, H } from './story-pincel.js';

export const TITULO_FIM = 428; // o título (2 linhas) acaba aqui; a folha começa logo abaixo
// Rodapé: a chamada (logo, SEGUE A GENTE, @smufdpj) ocupa os primeiros 100 px; o resto é link e aviso.
export const RODAPE_ALT = { chamada: 100, total: 226 };
export const RESPIRO = 30, BASE = 64;
const ALT = { indice: 128, grade: 80, chance: 72 }, GAP = 8;
const FOLHA_MAX = 760; // sem carta nenhuma a folha não passa disso

// tem = quais cartas existem; linhas = linhas da grade de 2 colunas; prop = altura/largura do papel (1400/1100).
export function layout({ indice = true, linhas = 2, chance = true, prop = 1400 / 1100 } = {}) {
  const rodape = { y: H - BASE - RODAPE_ALT.total };
  rodape.fim = rodape.y + RODAPE_ALT.total;
  let y = rodape.y - RESPIRO; // desce empilhando de baixo pra cima
  const sobe = (h) => { y -= h; const topo = y; y -= GAP; return topo; };
  const g = { rodape };
  if (chance) g.chance = { y: sobe(ALT.chance), h: ALT.chance };
  if (linhas > 0) {
    const alt = linhas * ALT.grade + (linhas - 1) * GAP;
    g.grade = { y: sobe(alt), h: ALT.grade, gap: GAP };
  }
  if (indice) g.indice = { y: sobe(ALT.indice), h: ALT.indice };
  const temCarta = indice || linhas > 0 || chance;
  const fundo = temCarta ? y + GAP - RESPIRO : rodape.y - RESPIRO; // até onde o papel pode ir
  const cabe = fundo - TITULO_FIM, larg = Math.round(Math.min(FOLHA_MAX, W - 80, cabe / prop)), alt = larg * prop;
  g.folha = { x: (W - larg) / 2, y: Math.round(TITULO_FIM + (cabe - alt) / 2), larg, alt };
  return g;
}

// Vazio embaixo do rodapé, como fração da altura (a regressão cobra menos de 6%).
export const vazioEmbaixo = (g) => (H - g.rodape.fim) / H;
