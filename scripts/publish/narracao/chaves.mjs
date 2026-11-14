// Contas da ElevenLabs em ordem de uso. Automático: principal -> reserva -> reserva2 -> agenda, pulando a que tem saldo curto ou
// falha por crédito no meio. Interruptor: ELEVENLABS_CHAVE=principal|reserva|reserva2|agenda (variável do repo) força uma.
// A reserva tem permissão só de gerar fala: não informa saldo (saldo null = tenta no escuro).
export const CONTAS = [
  ["principal", "ELEVENLABS_API_KEY"],
  ["reserva", "ELEVENLABS_API_KEY_RESERVA"],
  ["reserva2", "ELEVENLABS_API_KEY_RESERVA2"], // 14/11/2026, conta free com 10 mil por mês
  ["agenda", "ELEVENLABS_API_KEY_AGENDA"],
];

export function chavesEmOrdem(env = process.env) {
  const todas = CONTAS.map(([nome, variavel]) => ({ nome, chave: env[variavel] })).filter((c) => c.chave);
  const forcar = String(env.ELEVENLABS_CHAVE || "").trim().toLowerCase();
  return forcar ? todas.filter((c) => c.nome === forcar) : todas;
}

// Erro que vale tentar na próxima conta (crédito, plano, chave recusada).
export const erroDeConta = (e) => /quota|credit|insufficient|exceed|paid_plan|40[12]\b|unauthorized/i.test(String(e?.message || e));
