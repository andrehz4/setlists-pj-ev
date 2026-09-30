// O que a voz fala em cada cena do reel. Nas manchetes, lê EXATAMENTE o
// título que aparece na tela (title_pt), pra fala e texto andarem juntos; só
// ajusta o que soa mal falado (siglas, "Jr.", símbolos).

export const FALA_ABERTURA = "O resumo da semana do Pearl Jam.";
export const FALA_FINAL = "Segue a gente no Instagram!";

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
export function falasDasCenas(scenes) {
  return scenes.map((s, i) => ({
    sceneIndex: i,
    texto: s.kind === "coldopen" ? FALA_ABERTURA
      : s.kind === "outro" ? FALA_FINAL
      : normalizarFala(s.item?.title_pt || s.item?.title_ig || ""),
  })).filter((f) => f.texto);
}
