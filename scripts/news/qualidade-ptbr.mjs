// Trava de qualidade do texto curado (PT-BR) antes de entrar no index.
// Nasceu em 2026-09-30: uma rodada da routine escreveu 4 matérias inteiras SEM
// ACENTO ("turne", "nao e oficial") e elas foram pro Instagram assim.
//
// checarPtBr(item) -> { bloqueios: [...], avisos: [...] }
//   bloqueios: o item NÃO entra; volta pro _pending e a próxima rodada reescreve.
//   avisos: entra, mas fica registrado (heurística com chance de falso positivo).

// Palavras que em PT-BR só existem com acento: achar a forma sem acento é sinal
// de texto "achatado". Fica de fora o que é ambíguo (esta, e, so, publico...).
// Fronteira com \p{L}: o \b do JS acha "alem" dentro de "alemão" (ã não é \w).
const SEM_ACENTO = /(?<!\p{L})(nao|entao|tambem|musicas?|albuns|turne|turnes|historia|misterio|voce|voces|apos|tres|alem|proxim[oa]s?|ultim[oa]s?|ja|ate|sao|inicio|possivel|unic[oa]|numero|epoca)(?!\p{L})/giu;
const ACENTUADOS = /[áéíóúâêôãõàç]/gi;

// Português de Portugal que escapa em tradução de fonte PT/IT ("os Pearl Jam").
const PT_PT = /\b(os|dos|aos|pelos) Pearl Jam\b|\bestá a (tocar|cantar|gravar|preparar)\b|\bequipa\b|\bautocarro\b/i;

function juntar(item) {
  return [item.titulo_pt, item.titulo_ig, item.intro_pt, item.corpo_pt].filter(Boolean).join("\n");
}

export function contarSemAcento(texto) {
  return (String(texto).match(SEM_ACENTO) || []).length;
}

export function densidadeAcentos(texto) {
  const t = String(texto);
  return t.length ? ((t.match(ACENTUADOS) || []).length * 1000) / t.length : 0;
}

export function checarPtBr(item) {
  const bloqueios = [], avisos = [];
  const texto = juntar(item);
  const semAcento = contarSemAcento(texto);
  const dens = densidadeAcentos(texto);
  // PT-BR normal fica entre 15 e 35 acentos por 1000 caracteres.
  if (semAcento >= 3 || (texto.length >= 300 && dens < 4)) {
    bloqueios.push(`texto sem acento (${semAcento} palavras sem acento, ${dens.toFixed(1)} acentos/1000 chars)`);
  } else if (contarSemAcento([item.titulo_pt, item.titulo_ig].join(" ")) > 0) {
    bloqueios.push("título sem acento");
  }
  if (/[—–‒―]/.test(texto)) bloqueios.push("travessão");
  if (PT_PT.test(texto)) avisos.push("português de Portugal");
  return { bloqueios, avisos };
}

// Corrige sozinho o que é seguro: "dos/aos/pelos Pearl Jam" -> "do/ao/pelo
// Pearl Jam" (com preposição o verbo não muda). "os Pearl Jam tocaram" fica
// só como aviso, porque trocar exigiria mexer no verbo.
export function corrigirPtPt(texto) {
  return String(texto || "").replace(/\b(d|a|pel)os Pearl Jam\b/g, (_, p) => `${p === "pel" ? "pelo" : p === "d" ? "do" : "ao"} Pearl Jam`);
}
