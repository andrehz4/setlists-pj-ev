// Memória de pronúncia das vozes do ElevenLabs (Bella, Chris, Jessica, Liam): tudo que soou estranho no ouvido do
// Andre, num lugar só. Vale pra toda fala gravada (story diário, story por banda, reel, agenda, tutoriais).
// "bloqueia": o gravador não grava e o teste de regressão derruba a frase fixa. "suspeita": só avisa.
// Achou fala estranha nova? Acrescenta aqui com a data, o que a voz fez e a troca que deu certo.
// \b do JavaScript não entende letra com acento: pra palavra com acento use (?<!\p{L}) / (?!\p{L}) com a flag u.
export const REGRAS = [
  { re: /(^|[.!?]\s+)fã(?!\p{L})/iu, nivel: "bloqueia", data: "2026-10-18",
    motivo: "frase começando com Fã (a voz lê Fá)", troca: "\"fã\" no meio da frase (\"Alô, fã de Pearl Jam!\")" },
  { re: /\bmundo Pearl Jam\b/i, nivel: "bloqueia", data: "2026-10-18",
    motivo: "mundo Pearl Jam (a voz lê Mungo)", troca: "\"no universo do Pearl Jam\" ou \"pro Pearl Jam\"" },
  { re: /\bagitad[ao]s?\b/i, nivel: "bloqueia", data: "2026-10-19",
    motivo: "agitada (a voz lê com sotaque espanhol, 19/10/2026)", troca: "\"cheia\", \"movimentada\"" },
  { re: /(?<![\p{L}-])pros?(?![\p{L}-])/iu, nivel: "bloqueia", data: "2026-11-13",
    motivo: "pro (a voz lê PRÓ de profissional, 13/11/2026)", troca: "\"para o\" / \"pra\"" },
  { re: /\bcena cover\b/i, nivel: "bloqueia", data: "2026-11-14",
    motivo: "cena cover (a voz lê Sela/Senna Cover, 14/11/2026)", troca: "\"as bandas cover\"" },
  { re: /^corre que\b/i, nivel: "bloqueia", data: "2026-11-14",
    motivo: "começar com Corre que (a voz embola: Correc, Quareque, 14/11/2026)", troca: "\"Bora, que...\"" },
  { re: /\bquem ainda\b/i, nivel: "bloqueia", data: "2026-11-14",
    motivo: "quem ainda (a Bella emenda: que a Mainda / que o Emma, 14/11/2026)", troca: "\"a galera que ainda\"" },
  { re: /^quem\b|\bquem divide\b/i, nivel: "bloqueia", data: "2026-11-14",
    motivo: "Quem no começo ou quem divide (a Bella lê Queen, em inglês; Andre ouviu, 14/11/2026)", troca: "\"Marca a galera que...\"" },
  { re: /\bdivide\b/i, nivel: "bloqueia", data: "2026-11-28",
    motivo: "divide com sotaque estranho (\"Divide com quem vai de primeira viagem\", 28/11/2026)", troca: "\"Manda pra galera que...\"" },
  { re: /\bosasco\b/i, nivel: "bloqueia", data: "2026-11-22",
    motivo: "Osasco sai \"o Zasko\" (22/11/2026)", troca: "escrever \"Ozasco\" só na fala; na tela fica Osasco" },
  { re: /(^|[.!?]\s+)(segunda|terça|quarta|quinta|sexta)[.!?]/iu, nivel: "bloqueia", data: "2026-11-22",
    motivo: "dia da semana solto (\"Quinta.\" soa estranho, \"Sexta.\" vira \"Sesta\")", troca: "com artigo: \"Na quinta\", \"No sábado\"" },
  { re: /(^|[.!?]\s+)nove shows\b/i, nivel: "bloqueia", data: "2026-11-22",
    motivo: "\"Nove shows\" no começo vira \"Novos shows\"", troca: "\"São nove shows...\"" },
  { re: /\bsegue a gente\b/i, nivel: "suspeita", data: "2026-11-24",
    motivo: "\"Segue a gente\" saiu errado na Jessica (reel Even Flow); na Bella/Chris ninguém reclamou", troca: "\"Bora seguir a gente!\" (na tela pode ficar SEGUE A GENTE)" },
  { re: /\bquem\b/i, nivel: "suspeita", data: "2026-11-28",
    motivo: "\"quem\" ainda soa estranho às vezes; conferir de ouvido", troca: "\"a galera que\", \"seus amigos que\"" },
];

// Grafias só pra voz (na tela fica o nome oficial). Mapas que aplicam: FALADO em scripts/agenda/redes/voz.mjs e
// CIDADE_FALADA no reel da agenda. Aqui fica o registro do que já foi decidido de ouvido.
export const GRAFIAS_FALADAS = {
  "PJ 90": "Pearl Jam noventa", Blaymorphed: "Blaymorfédi", Osasco: "Ozasco",
};

// Outras lições de ouvido (não dá pra checar por regex):
// - Forçar idioma "pt" na Bella/Chris soou português de Portugal; sem forçar, soa brasileiro (voz.mjs IDIOMA=null).
// - Data com cara de Portugal: escrever "em São Paulo: sexta-feira, vinte e seis de fevereiro" (tutoriais, 23/11).
// - Emendar trechos gravados separados soa recortado: gravar a frase inteira (abertura com o nome da banda).
// - Whisper só filtra; quem decide é o ouvido do Andre (página de audição, escolha por número).

export function checarFala(texto) {
  return REGRAS.filter((r) => r.re.test(texto)).map((r) => ({ nivel: r.nivel, motivo: r.motivo, troca: r.troca }));
}

// Só os motivos que bloqueiam (formato do teste de regressão antigo).
export const problemas = (texto) => checarFala(texto).filter((p) => p.nivel === "bloqueia").map((p) => p.motivo);
export const bloqueia = (texto) => problemas(texto).length > 0;
