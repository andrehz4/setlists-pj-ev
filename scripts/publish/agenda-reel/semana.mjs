// Dados da semana pro reel da agenda: shows de terça a domingo (media/agenda/shows.json) no formato que o desenho do
// Claude Design lê (media/agenda/reel-design/reel-core.jsx), logo de cada banda e o rodízio layout x paleta.
import fs from "node:fs";
import { naRaiz } from "../../config.mjs";
import { somaDias } from "../../agenda/redes/semana.mjs";
import { localizar } from "../../agenda/redes/mapa.mjs";
import { trechosAprovados } from "./covers-r2.mjs";

export const LAYOUTS = ["A", "B", "C", "D"];
export const PALETAS = ["amarelo", "laranja", "azul"];

// Semana ISO n -> uma das 12 combinações (4 layouts x 3 paletas), sem repetir em 12 semanas seguidas.
// AGENDA_REEL_LAYOUT / AGENDA_REEL_PALETA forçam (teste ou pedido do Andre).
export function estiloDaSemana(weekKey, env = process.env) {
  const n = Number(String(weekKey).split("-W")[1]) || 0;
  const layout = LAYOUTS.includes(env.AGENDA_REEL_LAYOUT) ? env.AGENDA_REEL_LAYOUT : LAYOUTS[n % 4];
  const paleta = PALETAS.includes(env.AGENDA_REEL_PALETA) ? env.AGENDA_REEL_PALETA : PALETAS[Math.floor(n / 4) % 3];
  return { layout, paleta };
}

// "2026-11-24" -> "2026-W48" (semana ISO, quinta decide o ano).
export function semanaIso(dia) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const ano = d.getUTCFullYear(), jan4 = new Date(Date.UTC(ano, 0, 4));
  const n = 1 + Math.round(((d - jan4) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${ano}-W${String(n).padStart(2, "0")}`;
}

// Shows abertos de terça (inicio) a domingo, por data (ordem do shows.json dentro do dia, igual ao carrossel).
export function showsDoReel(todos, inicio) {
  const fim = somaDias(inicio, 5);
  return todos.filter((s) => !s.fechado && s.data >= inicio && s.data <= fim)
    .map((s, i) => [s, i]).sort((a, b) => a[0].data.localeCompare(b[0].data) || a[1] - b[1]).map(([s]) => s);
}

export const temClipe = (conta, aprovados = trechosAprovados) => aprovados(conta).some((c) => (c.nota || 0) >= 3);

// Show do shows.json -> show do Design ({data, cidade, uf, banda, arrobaBanda, casa, arrobaCasa, hora, lat, lon, semClipe}).
export function paraDesign(s, { comClipe = temClipe } = {}) {
  const pos = localizar(s.cidade, s.uf)?.pos;
  return {
    data: s.data, cidade: s.cidade, uf: s.uf, banda: s.nome, arrobaBanda: `@${s.banda}`,
    casa: s.casaNome || null, arrobaCasa: s.casa ? `@${s.casa}` : null, hora: s.hora || null,
    ...(pos ? { lat: pos[1], lon: pos[0] } : {}), // localizar devolve [lon, lat]
    semClipe: !comClipe(s.banda),
  };
}

export function semanaDoReel(inicio, { arquivo = naRaiz("media/agenda/shows.json"), comClipe } = {}) {
  const todos = JSON.parse(fs.readFileSync(arquivo, "utf8")).shows;
  const shows = showsDoReel(todos, inicio);
  const week = { semana: `${inicio} a ${somaDias(inicio, 5)}`, shows: shows.map((s) => paraDesign(s, { comClipe })) };
  const logos = {};
  for (const s of shows) if (fs.existsSync(naRaiz(`media/agenda/fotos/${s.banda}.jpg`))) logos[`@${s.banda}`] = `/media/agenda/fotos/${s.banda}.jpg`;
  return { shows, week, logos };
}
