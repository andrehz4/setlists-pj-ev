// Texto dos posts do X (limite 280). Na API paga por uso, post com URL custa ~13x
// mais (US$ 0,20 x 0,015): por padrão SEM LINK (fica na bio). No modo manual (kit
// do dia, grátis) passa `link` e ele entra no lugar da chamada.
// Sem travessão (regra do projeto).

export const LIMITE = 280;
const CTA_NOTICIA = "Matéria completa no site (link na bio).";
const CTA_CAPSULA = "A cápsula completa está no site (link na bio).";
const TAGS = "#PearlJam #EddieVedder";
const SITE = "https://somaisumfadepearljam.com.br";
const PESO_URL = 23; // o X conta todo link como 23 caracteres
export const linkMateria = (id) => `${SITE}/n/${id}`;

// Tamanho como o X conta: emoji e alguns símbolos pesam 2; letra com acento pesa 1.
export function tamanhoX(texto) {
  let n = 0;
  const semUrl = String(texto).replace(/https?:\/\/\S+/g, () => { n += PESO_URL; return ""; });
  for (const ch of semUrl) n += ch.codePointAt(0) > 0x2fff ? 2 : 1;
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

export function textoNoticia(item, { link } = {}) {
  return montar(item.title_pt || item.title_ig || "", item.intro_pt || "", link ? `Matéria completa: ${link}` : CTA_NOTICIA);
}

export function textoCapsula(cap, { link } = {}) {
  return montar(cap.title_capa || cap.title_pt || "", cap.intro_pt || "", link ? `Cápsula completa: ${link}` : CTA_CAPSULA);
}

// rangeLabel: "24 A 30 SET" (o mesmo do reel).
export function textoReel(rangeLabel = "") {
  const semana = rangeLabel ? ` (${rangeLabel.toLowerCase()})` : "";
  return montar(`O resumo da semana do Pearl Jam${semana}, narrado.`, "", "Todas as matérias no site (link na bio).");
}
