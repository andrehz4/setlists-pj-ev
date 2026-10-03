// Final (1,5 s): masthead, FIM DESTA EDIÇÃO, a íntegra no site e LINK NA BIO.
import { clamp01, easeOutCubic, easeOutBack, easeInOutQuad, progress, escapeXml } from "../_shared.mjs";
import { CREME, TINTA, SEPIA, REGUA, SERIF_DISPLAY, SERIF_TEXT, MONO, SANS_BOLD, mastheadSvg, doubleRuleSvg, thinRuleSvg, footerSvg } from "./pecas.mjs";

// -----------------------------------------------------------------------
// OUTRO (1.5s)
// -----------------------------------------------------------------------
export function buildOutroFrame({ tRel, state }) {
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
      >SOMAISUMFADEPEARLJAM.COM.BR</text>
    </g>
  </svg>`;
}
