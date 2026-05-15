// Style: CADERNO B — Jornal / fanzine editorial. Newsprint creme, masthead
// clássico no topo com wordmark + data + número da edição em serif. Headline
// gigante com número da edição em DM Serif / Playfair. Baseado no template
// CadernoBIntro / CadernoBOutro do design @smufdpj.
//
// Intro 3.0s:  masthead → regras duplas → EDIÇÃO Nº gigante → data → manifesto
// Outro 1.5s:  masthead → FIM DESTA EDIÇÃO → A íntegra no site → LINK NA BIO

import { clamp01, easeOutCubic, easeOutBack, easeInOutQuad, progress, escapeXml } from "./_shared.mjs";

const CREME  = "#f4ede0";
const TINTA  = "#0a0908";
const SEPIA  = "#5a4a2a";
const REGUA  = "#c8b894";  // cor das linhas internas finas

// Fontes — só chains com fontes de sistema (sharp/libvips sem Google Fonts).
const SERIF_DISPLAY = "'Playfair Display','Georgia','Times New Roman',serif";
const SERIF_TEXT    = "'Georgia','Times New Roman',serif";
const MONO          = "'Courier New',Courier,monospace";
const SANS_BOLD     = "'Arial Black',Impact,'Helvetica Neue',sans-serif";

// -----------------------------------------------------------------------
// Helpers SVG
// -----------------------------------------------------------------------

// Masthead preto + "Só mais Um Fã de Pearl Jam" + ANO 1 · Nº {edition}
function mastheadSvg({ W, tarjaColor, edition, day, monthShort, year, slideY, opacity }) {
  const barH    = 88;
  const dblGap  = 4;
  const ty = slideY * (1 - opacity); // slide-in do topo: opacity 0→1 faz ty 0
  return `<g transform="translate(0, ${(-barH * (1 - opacity)).toFixed(1)})" opacity="${opacity.toFixed(2)}">
    <!-- barra preta do masthead -->
    <rect x="0" y="0" width="${W}" height="${barH}" fill="${TINTA}"/>
    <!-- linha dupla abaixo da barra -->
    <rect x="0" y="${barH}"     width="${W}" height="4" fill="${CREME}"/>
    <rect x="0" y="${barH + dblGap + 4}" width="${W}" height="2" fill="${CREME}"/>
    <rect x="0" y="${barH}"     width="${W}" height="10" fill="none" stroke="${TINTA}" stroke-width="0"/>

    <!-- Wordmark: "Só mais Um Fã de Pearl Jam" -->
    <text x="54" y="56"
      font-family="${SERIF_DISPLAY}"
      font-style="italic" font-weight="700"
      font-size="36" fill="${CREME}" letter-spacing="-0.5"
    >Só mais Um Fã de Pearl Jam</text>

    <!-- ANO 1 · Nº {edition} + data -->
    <text x="${W - 54}" y="42"
      font-family="${MONO}"
      font-size="18" fill="${CREME}" letter-spacing="3" text-anchor="end" opacity="0.85"
    >ANO 1 · Nº ${edition}</text>
    <text x="${W - 54}" y="66"
      font-family="${MONO}"
      font-size="18" fill="${CREME}" letter-spacing="3" text-anchor="end" opacity="0.85"
    >${day} ${escapeXml(monthShort)} ${year}</text>
  </g>`;
}

// Pares de regras horizontais (traço grosso + fino) saindo do centro
function doubleRuleSvg({ W, y, p, thin = false }) {
  const fullW  = W - 108;
  const halfW  = (fullW * p) / 2;
  const cx     = W / 2;
  const thick  = thin ? 2 : 6;
  const slim   = thin ? 1 : 2;
  return `<g>
    <rect x="${(cx - halfW).toFixed(1)}" y="${y}" width="${(halfW * 2).toFixed(1)}" height="${thick}" fill="${TINTA}"/>
    <rect x="${(cx - halfW).toFixed(1)}" y="${y + thick + 3}" width="${(halfW * 2).toFixed(1)}" height="${slim}" fill="${TINTA}"/>
  </g>`;
}

// Regua única fina (sepia) expandindo do centro
function thinRuleSvg({ W, y, p, color = REGUA }) {
  const fullW = W - 108;
  const halfW = (fullW * p) / 2;
  const cx    = W / 2;
  return `<rect x="${(cx - halfW).toFixed(1)}" y="${y}" width="${(halfW * 2).toFixed(1)}" height="2" fill="${color}"/>`;
}

// Footer URL
function footerSvg({ W, H, opacity }) {
  return `<g opacity="${opacity.toFixed(2)}">
    ${thinRuleSvg({ W, y: H - 80, p: 1 })}
    <text x="54" y="${H - 44}"
      font-family="${MONO}"
      font-size="22" fill="${TINTA}" letter-spacing="3" opacity="0.7"
    >SETLISTS-PJ-EV.PAGES.DEV</text>
    <text x="${W - 54}" y="${H - 44}"
      font-family="${MONO}"
      font-size="22" fill="${TINTA}" letter-spacing="3" text-anchor="end" opacity="0.7"
    >09H BRT</text>
  </g>`;
}

// -----------------------------------------------------------------------
// INTRO (3.0s)
// -----------------------------------------------------------------------
function buildIntroFrame({ tRel, state }) {
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

// -----------------------------------------------------------------------
// OUTRO (1.5s)
// -----------------------------------------------------------------------
function buildOutroFrame({ tRel, state }) {
  const { W, H, day, monthShort, year, edition, itemCount, tarjaColor } = state;

  // === timings ===
  const mastheadP = easeOutCubic(progress(tRel, 0.0,  0.30));
  const fimP      = easeOutCubic(progress(tRel, 0.1,  0.30));
  const rulesP    = easeOutCubic(progress(tRel, 0.15, 0.30));
  const integraP  = easeOutCubic(progress(tRel, 0.3,  0.40));
  const ctaP      = easeOutBack (progress(tRel, 0.5,  0.40));
  const handleP   = easeOutCubic(progress(tRel, 0.75, 0.35));
  const footerP   = easeOutCubic(progress(tRel, 0.9,  0.40));

  const cx = W / 2;
  const mastheadH = 102;

  // "A íntegra / está no / site." — slide from right
  const integraSlideX = (1 - integraP) * 80;
  // CTA box — scale pop-in
  const ctaScale = ctaP;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <!-- bg creme -->
    <rect width="${W}" height="${H}" fill="${CREME}"/>

    <!-- masthead -->
    ${mastheadSvg({ W, tarjaColor, edition, day, monthShort, year, slideY: 0, opacity: mastheadP })}

    <!-- double rules -->
    ${doubleRuleSvg({ W, y: mastheadH, p: rulesP })}

    <!-- FIM DESTA EDIÇÃO -->
    <text x="${cx}" y="${mastheadH + 80}"
      font-family="${MONO}"
      font-size="28" fill="${TINTA}" letter-spacing="14" text-anchor="middle"
      opacity="${fimP.toFixed(2)}"
    >FIM DESTA EDIÇÃO</text>

    <!-- rule abaixo do label -->
    ${thinRuleSvg({ W, y: mastheadH + 100, p: rulesP, color: TINTA })}

    <!-- "A íntegra / está no / site." — display serif grande com accent no "site." -->
    <g transform="translate(${(cx + integraSlideX).toFixed(1)}, 370)" opacity="${integraP.toFixed(2)}">
      <text x="0" y="0"
        font-family="${SERIF_DISPLAY}"
        font-size="160" font-weight="900"
        fill="${TINTA}" letter-spacing="-4" text-anchor="middle"
        paint-order="stroke fill"
      >A íntegra</text>
      <text x="0" y="200"
        font-family="${SERIF_DISPLAY}"
        font-style="italic" font-size="160" font-weight="900"
        fill="${tarjaColor}" letter-spacing="-4" text-anchor="middle"
        paint-order="stroke fill"
      >está no</text>
      <text x="0" y="390"
        font-family="${SERIF_DISPLAY}"
        font-style="italic" font-size="160" font-weight="900"
        fill="${tarjaColor}" letter-spacing="-4" text-anchor="middle"
        paint-order="stroke fill"
      >site.</text>
    </g>

    <!-- CTA box: TOQUE EM / LINK NA BIO -->
    <g transform="translate(${cx}, 1060) scale(${ctaScale.toFixed(3)})" opacity="${clamp01(ctaP * 2).toFixed(2)}">
      <rect x="-400" y="-60" width="800" height="220" fill="${TINTA}"/>
      <text x="0" y="-10"
        font-family="${MONO}"
        font-size="26" fill="${CREME}" letter-spacing="10" text-anchor="middle" opacity="0.7"
      >TOQUE EM</text>
      <text x="0" y="114"
        font-family="${SANS_BOLD}"
        font-size="100" font-weight="900"
        fill="${CREME}" letter-spacing="4" text-anchor="middle"
      >LINK NA BIO</text>
    </g>

    <!-- @smufdpj handle -->
    <text x="${cx}" y="1360"
      font-family="${SERIF_TEXT}"
      font-style="italic" font-weight="700"
      font-size="62" fill="${TINTA}" text-anchor="middle"
      opacity="${handleP.toFixed(2)}"
    >@smufdpj</text>

    <!-- regua acima do footer -->
    ${thinRuleSvg({ W, y: 1780, p: footerP })}

    <!-- footer: "próxima edição amanhã às 09h00" -->
    <g opacity="${footerP.toFixed(2)}">
      <text x="${cx}" y="1840"
        font-family="${SERIF_TEXT}"
        font-style="italic" font-size="38"
        fill="${SEPIA}" text-anchor="middle"
      >próxima edição amanhã às 09h00</text>
      <text x="${cx}" y="1884"
        font-family="${MONO}"
        font-size="22" fill="${TINTA}" letter-spacing="3" text-anchor="middle" opacity="0.55"
      >SETLISTS-PJ-EV.PAGES.DEV</text>
    </g>
  </svg>`;
}

export default {
  intro: buildIntroFrame,
  outro: buildOutroFrame,
};
