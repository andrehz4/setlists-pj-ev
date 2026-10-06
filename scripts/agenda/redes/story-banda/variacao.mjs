// Rodízio diário da cena do mapa: A (pinos), B (papel recortado), C (rota de turnê). A rota só vale com estrada de
// verdade: abaixo de KM_MIN_ROTA a linha some embaixo do pino, e sem a posição exata da origem ou de algum show (cidade
// que caiu no meio do estado) a quilometragem seria inventada. Nos dois casos esse dia cai pro papel.
import { kmDaRota } from "./mapa-rota.mjs";

export const VARIACOES = ["A", "B", "C"];
export const KM_MIN_ROTA = 150;

export function variacaoDoDia(dia, story) {
  const forcada = process.env.AGENDA_MAPA; // teste: AGENDA_MAPA=C força a variação
  if (VARIACOES.includes(forcada)) return forcada;
  const v = VARIACOES[Math.floor(Date.parse(`${dia}T12:00:00Z`) / 864e5) % 3];
  const exata = story.baseLonlat && story.shows.every((s) => !s.aproximado);
  return v === "C" && (!exata || kmDaRota(story) < KM_MIN_ROTA) ? "B" : v;
}
