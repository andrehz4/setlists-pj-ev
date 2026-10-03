// Peças do estilo Caderno B: paleta, fontes de sistema, masthead, regras e rodapé.
import { clamp01, easeOutCubic, easeOutBack, easeInOutQuad, progress, escapeXml } from "../_shared.mjs";

export const CREME  = "#f4ede0";
export const TINTA  = "#0a0908";
export const SEPIA  = "#5a4a2a";
export const REGUA  = "#c8b894";  // cor das linhas internas finas

// Fontes — só chains com fontes de sistema (sharp/libvips sem Google Fonts).
export const SERIF_DISPLAY = "'Playfair Display','Georgia','Times New Roman',serif";
export const SERIF_TEXT    = "'Georgia','Times New Roman',serif";
export const MONO          = "'Courier New',Courier,monospace";
export const SANS_BOLD     = "'Arial Black',Impact,'Helvetica Neue',sans-serif";

// -----------------------------------------------------------------------
// Helpers SVG
// -----------------------------------------------------------------------

// Masthead preto + "Só mais Um Fã de Pearl Jam" + ANO 1 · Nº {edition}
export function mastheadSvg({ W, tarjaColor, edition, day, monthShort, year, slideY, opacity }) {
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
export function doubleRuleSvg({ W, y, p, thin = false }) {
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
export function thinRuleSvg({ W, y, p, color = REGUA }) {
  const fullW = W - 108;
  const halfW = (fullW * p) / 2;
  const cx    = W / 2;
  return `<rect x="${(cx - halfW).toFixed(1)}" y="${y}" width="${(halfW * 2).toFixed(1)}" height="2" fill="${color}"/>`;
}

// Footer URL
export function footerSvg({ W, H, opacity }) {
  return `<g opacity="${opacity.toFixed(2)}">
    ${thinRuleSvg({ W, y: H - 80, p: 1 })}
    <text x="54" y="${H - 44}"
      font-family="${MONO}"
      font-size="22" fill="${TINTA}" letter-spacing="3" opacity="0.7"
    >SOMAISUMFADEPEARLJAM.COM.BR</text>
    <text x="${W - 54}" y="${H - 44}"
      font-family="${MONO}"
      font-size="22" fill="${TINTA}" letter-spacing="3" text-anchor="end" opacity="0.7"
    >09H BRT</text>
  </g>`;
}
