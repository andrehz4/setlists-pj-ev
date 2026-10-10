// Rodízio diário da cena do mapa: A (pinos), B (papel recortado), C (rota de turnê). A rota só vale com estrada de
// verdade: abaixo de KM_MIN_ROTA a linha some embaixo do pino, e sem a posição exata da origem ou de algum show (cidade
// que caiu no meio do estado) a quilometragem seria inventada. Nos dois casos cai pro papel (ou pinos, se o papel já
// saiu hoje). k = ordem da banda no dia e usados = mapas das bandas anteriores: bandas do mesmo dia não repetem mapa.
import { kmDaRota } from "./mapa-rota.mjs";

export const VARIACOES = ["A", "B", "C"];
export const KM_MIN_ROTA = 150;

export function variacaoDoDia(dia, story, k = 0, usados = []) {
  const forcada = process.env.AGENDA_MAPA; // teste: AGENDA_MAPA=C força a variação
  if (VARIACOES.includes(forcada)) return forcada;
  const v = VARIACOES[(Math.floor(Date.parse(`${dia}T12:00:00Z`) / 864e5) + k) % 3];
  const exata = story.baseLonlat && story.shows.every((s) => !s.aproximado);
  const rotaOk = exata && kmDaRota(story) >= KM_MIN_ROTA;
  const validas = [v, "B", "A"].filter((x) => x !== "C" || rotaOk);
  return validas.find((x) => !usados.includes(x)) || validas[0];
}
