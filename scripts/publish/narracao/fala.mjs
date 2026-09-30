// O que a voz fala em cada cena do reel. Nas manchetes, lê EXATAMENTE o
// título que aparece na tela (title_pt), pra fala e texto andarem juntos; só
// ajusta o que soa mal falado (siglas, "Jr.", símbolos).

// Abertura (curiosidade rápida) e final (chamada pro site, CTR): 3 variações de
// cada, aprovadas em 2026-09-30, alternando por semana. Ficam GRAVADAS no repo
// por voz (ver narracao.mjs, arquivoFixo): não gastam crédito toda semana.
// Mudou uma frase? O áudio dela é regerado sozinho (hash do texto no nome).
export const ABERTURAS = [
  "Fã de Pearl Jam? Olha o que rolou essa semana.",
  "Semana agitada no mundo Pearl Jam. Vem ver.",
  "Tem novidade do Pearl Jam. Bora pro resumo da semana?",
];
export const FINAIS = [
  "Tem muito mais no maior acervo de Pearl Jam do Brasil. O link tá na bio!",
  "Quer ler tudo? O maior acervo de Pearl Jam do Brasil te espera. Link na bio!",
  "Setlists, letras e notícias: o maior acervo de Pearl Jam do Brasil. Link na bio!",
];

// "2026-W40" -> 40 % 3. Semana muda, a variação muda.
export function variacaoDaSemana(lista, weekKey) {
  const n = Number(String(weekKey || "").split("-W")[1]) || 0;
  return lista[n % lista.length];
}

// Troca o que a voz leria errado. Ordem importa (Jr. antes de pontuação).
const TROCAS = [
  [/\bPJ\b/g, "Pearl Jam"],
  [/\bEV\b/g, "Eddie Vedder"],
  [/\bJr\.?(?=\s|$|[,:;!?])/g, "Júnior"],
  [/\s&\s/g, " e "],
  [/["“”«»]/g, ""],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""],
  [/\s+/g, " "],
];

export function normalizarFala(texto) {
  let t = String(texto || "");
  for (const [de, para] of TROCAS) t = t.replace(de, para);
  t = t.trim();
  if (t && !/[.!?…]$/.test(t)) t += "."; // ponto final dá a cadência de fim de frase
  return t;
}

// scenes = buildScenePlan(items).scenes. Devolve [{ sceneIndex, texto }].
export function falasDasCenas(scenes, weekKey = "") {
  return scenes.map((s, i) => ({
    sceneIndex: i,
    texto: s.kind === "coldopen" ? variacaoDaSemana(ABERTURAS, weekKey)
      : s.kind === "outro" ? variacaoDaSemana(FINAIS, weekKey)
      : normalizarFala(s.item?.title_pt || s.item?.title_ig || ""),
  })).filter((f) => f.texto);
}
