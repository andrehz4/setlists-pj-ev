// Memória de pronúncia das vozes do ElevenLabs (Bella e Chris): palavras e combinações que soaram estranhas no
// ouvido do Andre. Cada fala nova é checada antes de gravar; "bloqueia" impede a gravação (e derruba o teste),
// "suspeita" só avisa. Toda vez que o Andre achar uma fala estranha, ela entra aqui com a data e a troca que deu certo.
export const REGRAS = [
  { trecho: /\bdivide\b/i, nivel: "bloqueia", data: "2026-11-28", motivo: "sotaque estranho no \"divide\"",
    troca: "\"manda pra galera\" ou \"compartilha\"" },
  { trecho: /\bdivide com quem\b/i, nivel: "bloqueia", data: "2026-11-28", motivo: "\"divide com quem\" soou muito estranho",
    troca: "\"Manda pra galera que vai pela primeira vez!\"" },
  // \b não entende letra com acento, por isso o (?!\p{L})
  { trecho: /^\s*fã(?!\p{L})/iu, nivel: "bloqueia", data: "2026-11-14", motivo: "\"fã\" no começo da frase a voz lê \"fá\"",
    troca: "pôr \"fã\" no meio da frase (\"Alô, fã de Pearl Jam!\")" },
  { trecho: /\bosasco\b/i, nivel: "bloqueia", data: "2026-11-22", motivo: "\"Osasco\" sai errado",
    troca: "escrever \"Ozasco\" só na fala (na tela fica Osasco)" },
  { trecho: /\bquem\b/i, nivel: "suspeita", data: "2026-11-28", motivo: "\"quem\" soou estranho junto com \"divide\"; conferir de ouvido",
    troca: "\"a galera que\", \"seus amigos que\"" },
];

// Problemas de uma fala: [{ nivel, motivo, troca, trecho }]. Lista vazia = pode gravar.
export function checarFala(texto) {
  return REGRAS.filter((r) => r.trecho.test(texto))
    .map((r) => ({ nivel: r.nivel, motivo: r.motivo, troca: r.troca, trecho: (texto.match(r.trecho) || [""])[0] }));
}

export const bloqueia = (texto) => checarFala(texto).some((p) => p.nivel === "bloqueia");
