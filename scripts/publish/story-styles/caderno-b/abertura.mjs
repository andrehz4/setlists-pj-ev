// Abertura (3 s): masthead, regras duplas, EDIÇÃO Nº gigante, data e manifesto.
import { clamp01, easeOutCubic, easeOutBack, easeInOutQuad, progress, escapeXml } from "../_shared.mjs";
import { CREME, TINTA, SEPIA, REGUA, SERIF_DISPLAY, SERIF_TEXT, MONO, SANS_BOLD, mastheadSvg, doubleRuleSvg, thinRuleSvg, footerSvg } from "./pecas.mjs";

// -----------------------------------------------------------------------
// INTRO (3.0s)
// -----------------------------------------------------------------------
export function buildIntroFrame({ tRel, state }) {
  const { W, H, day, monthShort, monthLong, year,
          dayOfWeekLong, edition, itemCount, tarjaColor } = state;

  // === timings ===
  const mastheadP  = easeOutCubic(progress(tRel, 0.0,  0.35));
  const rulesTopP  = easeOutCubic(progress(tRel, 0.25, 0.35));
  const edicaoP    = easeOutCubic(progress(tRel, 0.55, 0.35));
  const numP       = easeOutBack (progress(tRel, 0.65, 0.40));  // pop-in edition number
  const dateP      = easeOutCubic(progress(tRel, 1.1,  0.45));
  const rulesMidP  = easeOutCubic(progress(tRel, 1.4,  0.35));
  const manifestoP = easeOutCubic(progress(tRel, 1.7,  0.45));
  const footerP    = easeOutCubic(progress(tRel, 2.2,  0.45));

  // Edition number: slide up from +80px
  const numSlideY  = (1 - numP) * 80;
  // date: slide up from +40px
  const dateSlideY = (1 - dateP) * 40;
  // manifesto: slide up from +30px
  const manifSlideY = (1 - manifestoP) * 30;

  const mastheadH = 102;  // barra + linhas duplas + gap

  // === Bloco central ===
  // EDIÇÃO Nº: y=280 (abaixo das double rules em y~200)
  // Número gigante: y~580 (DM Serif Display 260px equivalente)
  // Data: y~850
  // Rule: y~920
  // Manifesto: y~980
  const cx = W / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <!-- bg creme -->
    <rect width="${W}" height="${H}" fill="${CREME}"/>

    <!-- masthead desliza de cima -->
    ${mastheadSvg({ W, tarjaColor, edition, day, monthShort, year, slideY: 0, opacity: mastheadP })}

    <!-- double rules abaixo do masthead -->
    ${doubleRuleSvg({ W, y: mastheadH, p: rulesTopP })}

    <!-- EDIÇÃO Nº (label pequeno) -->
    <text x="${cx}" y="320"
      font-family="${MONO}"
      font-size="30" fill="${TINTA}" letter-spacing="18" text-anchor="middle"
      opacity="${edicaoP.toFixed(2)}"
    >EDIÇÃO Nº</text>

    <!-- Número da edição gigante — o elemento dominante -->
    <g transform="translate(${cx}, ${(580 + numSlideY).toFixed(1)})" opacity="${numP.toFixed(2)}">
      <text x="0" y="0"
        font-family="${SERIF_DISPLAY}"
        font-size="340" font-weight="900"
        fill="${tarjaColor}"
        letter-spacing="-8" text-anchor="middle"
        paint-order="stroke fill"
      >${edition}</text>
    </g>

    <!-- Data por extenso -->
    <g transform="translate(${cx}, ${(840 + dateSlideY).toFixed(1)})" opacity="${dateP.toFixed(2)}">
      <text x="0" y="0"
        font-family="${SERIF_TEXT}"
        font-style="italic" font-size="46" font-weight="600"
        fill="${TINTA}" letter-spacing="0" text-anchor="middle"
      >${escapeXml(dayOfWeekLong)}, ${day} de ${escapeXml(monthLong)} de ${year}</text>
    </g>

    <!-- regua central -->
    ${thinRuleSvg({ W: W, y: 892, p: rulesMidP, color: TINTA })}

    <!-- Manifesto -->
    <g transform="translate(${cx}, ${(940 + manifSlideY).toFixed(1)})" opacity="${manifestoP.toFixed(2)}">
      <text x="0" y="0"
        font-family="${SERIF_TEXT}"
        font-style="italic" font-size="44"
        fill="${SEPIA}" text-anchor="middle"
      >Hoje saíram</text>
      <text x="0" y="88"
        font-family="${SANS_BOLD}"
        font-size="110" font-weight="900"
        fill="${tarjaColor}" text-anchor="middle"
        letter-spacing="-2"
      >${itemCount}</text>
      <text x="0" y="160"
        font-family="${SERIF_TEXT}"
        font-style="italic" font-size="44"
        fill="${SEPIA}" text-anchor="middle"
      >manchetes do mundo Pearl Jam</text>
      <text x="0" y="212"
        font-family="${SERIF_TEXT}"
        font-style="italic" font-size="44"
        fill="${SEPIA}" text-anchor="middle"
      >&amp; Eddie Vedder.</text>
    </g>

    <!-- footer -->
    ${footerSvg({ W, H, opacity: footerP })}
  </svg>`;
}
