// Trava de dados da agenda: show que veio SÓ de post de casa e conflita com o que a própria banda anunciou (mesma casa,
// outra data a até 3 dias) não entra no site nem nos posts; vai pro Telegram pra conferir. Caso real 23/11/2026: a
// agenda semanal do @santorockbar virou Blaymorphed na quinta 26 enquanto a banda anunciava sexta 27 no mesmo bar.
// Desliga com AGENDA_SUSPEITOS=0. Função pura, testada em scripts/regressao/agenda-casa-varios-dias.test.mjs.
const DIA = 864e5;
const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const casaDe = (s) => norm(s.casa || s.casaNome);

export function separarSuspeitos(agenda, linksDeCasa, env = process.env) {
  if (env.AGENDA_SUSPEITOS === "0") return { ok: agenda, suspeitos: [] };
  const daCasa = (s) => linksDeCasa.has(s.fonte);
  const suspeito = (s) => daCasa(s) && casaDe(s) && agenda.some((t) => t !== s && !daCasa(t) && t.data !== s.data
    && casaDe(t) === casaDe(s) && Math.abs(Date.parse(t.data) - Date.parse(s.data)) <= 3 * DIA);
  const suspeitos = agenda.filter(suspeito);
  return { ok: agenda.filter((s) => !suspeitos.includes(s)), suspeitos };
}

export const linhaSuspeito = (s) => `• ${s.data.split("-").reverse().slice(0, 2).join("/")} ${s.nome || s.banda} em ${s.casa || s.casaNome || s.cidade || "?"}${s.motivo ? ` (${s.motivo})` : ""}: ${s.fonte}\n  id: ${s.id}`;
