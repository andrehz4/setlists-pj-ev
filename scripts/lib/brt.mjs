// Fuso do Brasil (BRT, UTC-3 fixo: o Brasil não tem horário de verão desde 2019). Único lugar com essa conta.
export const BRT_OFFSET_MS = 3 * 3600e3;

// Date "deslocada" pra BRT: use os getters UTC (getUTCDate, toISOString) pra ler a data/hora de Brasília.
export const emBRT = (d = new Date()) => new Date(new Date(d).getTime() - BRT_OFFSET_MS);

// "AAAA-MM-DD" do dia em Brasília.
export const diaBRT = (d = new Date()) => emBRT(d).toISOString().slice(0, 10);

// Número do dia desde a época, em Brasília (rodízios diários: capa, citação).
export const numeroDiaBRT = (d = new Date()) => Math.floor(emBRT(d).getTime() / 864e5);

// "HH:MM" de Brasília, pra mensagens.
export const horaBRT = (d = new Date()) =>
  new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
