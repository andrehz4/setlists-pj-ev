// Style: CADERNO B — Jornal / fanzine editorial. Newsprint creme, masthead
// clássico no topo com wordmark + data + número da edição em serif. Headline
// gigante com número da edição em DM Serif / Playfair. Baseado no template
// CadernoBIntro / CadernoBOutro do design @smufdpj.
//
// Intro 3.0s:  masthead → regras duplas → EDIÇÃO Nº gigante → data → manifesto
// Outro 1.5s:  masthead → FIM DESTA EDIÇÃO → A íntegra no site → LINK NA BIO

import { buildIntroFrame } from "./caderno-b/abertura.mjs";
import { buildOutroFrame } from "./caderno-b/final.mjs";

export default {
  intro: buildIntroFrame,
  outro: buildOutroFrame,
};
