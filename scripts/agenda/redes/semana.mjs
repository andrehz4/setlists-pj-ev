// "Agenda da semana" (segunda a domingo): seleção dos shows e legenda com o @ da banda e o @ da casa.
// Funções puras, testadas.
import { horaCurta } from "./regiao.mjs";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const somaDias = (dia, n) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const diaSemana = (d) => SEMANA[new Date(`${d}T12:00:00Z`).getUTCDay()];
export const dm = (d) => d.split("-").reverse().slice(0, 2).join("/");
// Segunda-feira da semana do dia (a própria, se já for segunda).
export const segundaDa = (dia) => somaDias(dia, -((new Date(`${dia}T12:00:00Z`).getUTCDay() + 6) % 7));

// Shows públicos de `inicio` (inclusive) até 6 dias depois.
export function showsDaSemana(shows, inicio) {
  const fim = somaDias(inicio, 6);
  return shows.filter((s) => !s.fechado && s.data >= inicio && s.data <= fim);
}

// O Instagram recusa legenda com mais de 20 menções: passado o teto, o nome sai sem "@" (a agenda continua inteira).
export const MAX_MENCOES = 20;

// Agrupada por banda: o @ da banda aparece uma vez só, com os shows dela embaixo (menos repetição = menos cara
// de spam). @ de casa repetida também sai uma vez só; da 2a em diante vai sem @.
export function legendaSemana(lista, inicio) {
  let mencoes = 0;
  const citadas = new Set();
  const arroba = (h) => {
    if (citadas.has(h) || mencoes >= MAX_MENCOES) return h;
    citadas.add(h); mencoes++;
    return `@${h}`;
  };
  const porBanda = new Map();
  for (const s of lista) (porBanda.get(s.banda) || porBanda.set(s.banda, []).get(s.banda)).push(s);
  const linhas = [...porBanda].flatMap(([banda, shows], i) => [
    ...(i ? [""] : []),
    arroba(banda),
    ...shows.map((s) => {
      const onde = s.casa ? arroba(s.casa) : s.casaNome || "";
      const lugar = [onde, [s.cidade, s.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
      return `${diaSemana(s.data)} ${dm(s.data)} · ${lugar || "local a confirmar"}${s.hora ? ` (${horaCurta(s.hora)})` : ""}`
        .replace(/\s+/g, " ").trim();
    }),
  ]);
  return [
    `🎸 AGENDA DA SEMANA: Pearl Jam ao vivo no Brasil (${dm(inicio)} a ${dm(somaDias(inicio, 6))})`,
    "",
    ...linhas,
    "",
    "Confirme sempre no perfil da banda antes de sair de casa.",
    "Agenda completa e atualizada: somaisumfadepearljam.com.br/agenda",
    "",
    "#pearljam #pearljamcover #pearljamtributo #agendadeshows #smufdpj",
  ].join("\n");
}

export const contasDaSemana = (lista) => [...new Set(lista.flatMap((s) => [s.banda, s.casa].filter(Boolean)))];
