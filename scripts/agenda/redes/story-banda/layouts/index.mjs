// Layouts novos do story por banda (D, E, F, desenho do Claude Design). Módulo apartado: só entram no rodízio com
// AGENDA_LAYOUTS_NOVOS=1. Cada layout exporta { temas: [4 temas {bg, ...}], quadro(T, story, tema, logoUri) -> SVG }
// e reaproveita o resto do story (tempo.mjs, voz, b-roll, trilha, publicação). A ordem dos temas segue a roda de
// cores do story (azul, ocre, preto, vermelho): o layout pinta cada posição com a paleta dele.
import * as G from "./G/index.mjs";
import * as H from "./H/index.mjs";
import * as I from "./I/index.mjs";
import * as J from "./J/index.mjs";

export const LAYOUTS = {};
export const ORDEM_TEMAS = ["azul", "ocre", "preto", "vermelho"];

export function registrar(nome, layout) {
  if (!Array.isArray(layout.temas) || layout.temas.length !== 4) throw new Error(`layout ${nome}: precisa de 4 temas`);
  if (typeof layout.quadro !== "function") throw new Error(`layout ${nome}: falta quadro()`);
  LAYOUTS[nome] = layout;
}
registrar("G", G);
registrar("H", H);
registrar("I", I);
registrar("J", J);

export const layoutsLigados = () => (process.env.AGENDA_LAYOUTS_NOVOS === "1" ? Object.keys(LAYOUTS) : []);

export function temaDoLayout(nome, tema) {
  const i = Math.max(0, ORDEM_TEMAS.indexOf(tema));
  return LAYOUTS[nome].temas[i];
}
