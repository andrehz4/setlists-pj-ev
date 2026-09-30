// Texto dos posts do X (limite 280). SEM LINK no texto: na API paga por uso,
// post com URL custa ~13x mais (US$ 0,20 x 0,015). O link fica na bio.
// Sem travessão (regra do projeto).

export const LIMITE = 280;
const CTA_NOTICIA = "Matéria completa no site (link na bio).";
const CTA_CAPSULA = "A cápsula completa está no site (link na bio).";
const TAGS = "#PearlJam #EddieVedder";

// Tamanho como o X conta: emoji e alguns símbolos pesam 2; letra com acento pesa 1.
export function tamanhoX(texto) {
  let n = 0;
  for (const ch of String(texto)) n += ch.codePointAt(0) > 0x2fff ? 2 : 1;
  return n;
}

// Corta no fim de uma frase que caiba; se nenhuma couber, na última palavra + "…".
function caber(texto, max) {
  if (tamanhoX(texto) <= max) return texto;
  const frases = texto.match(/[^.!?]+[.!?]+/g) || [];
  let out = "";
  for (const f of frases) { if (tamanhoX(out + f) > max) break; out += f; }
  if (out.trim()) return out.trim();
  const palavras = texto.split(/\s+/); out = "";
  for (const p of palavras) { if (tamanhoX(`${out} ${p}…`) > max) break; out = out ? `${out} ${p}` : p; }
  return `${out}…`;
}

// Monta: título + corpo (cortado pra caber) + chamada + hashtags.
function montar(titulo, corpo, cta, tags = TAGS) {
  const fixo = [titulo, cta, tags].filter(Boolean).join("\n\n");
  const sobra = LIMITE - tamanhoX(fixo) - 4;
  const meio = corpo && sobra > 40 ? caber(corpo, sobra) : "";
  return [titulo, meio, cta, tags].filter(Boolean).join("\n\n");
}

export function textoNoticia(item) {
  return montar(item.title_pt || item.title_ig || "", item.intro_pt || "", CTA_NOTICIA);
}

export function textoCapsula(cap) {
  return montar(cap.title_capa || cap.title_pt || "", cap.intro_pt || "", CTA_CAPSULA);
}

// rangeLabel: "24 A 30 SET" (o mesmo do reel).
export function textoReel(rangeLabel = "") {
  const semana = rangeLabel ? ` (${rangeLabel.toLowerCase()})` : "";
  return montar(`O resumo da semana do Pearl Jam${semana}, narrado.`, "", "Todas as matérias no site (link na bio).");
}
