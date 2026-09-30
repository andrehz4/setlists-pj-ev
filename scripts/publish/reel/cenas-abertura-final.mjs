// Cenas de abertura (cold open) e encerramento (outro) do reel.

import { W, H, BRAND, easeOutCubic, easeOutQuart, easeOutQuad, easeOutBack, seg, escapeXml, F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./base.mjs";
import { clipChipSvg, tarjaSvg, veilSvg, paperBgSvg } from "./atomos.mjs";

// COLD OPEN: flash de cor, chip, SMUFDPJ letra a letra, assinatura, tarja, meta.
export function coldOpenSvg(t, { accent, itemCount, rangeLabel, dark = 0.6, letterWidths = null, tarjaTextW = null, chipTextW = null, showChip = true }) {
  const ROT = [-3, 2, -2, 3, -1, 2, -3];
  const letters = "SMUFDPJ".split("");
  const size = 230;
  const gap = 14;
  const widths = letterWidths || letters.map(() => size * 0.5);
  const totalW = widths.reduce((a, b) => a + b, 0) + (letters.length - 1) * gap;
  let letterSvg = "";
  let cursor = (W - totalW) / 2;
  letters.forEach((L, i) => {
    const lw = widths[i];
    const cx = cursor + lw / 2;
    cursor += lw + gap;
    const e = seg(t, 0.35 + i * 0.07, 0.32, easeOutQuart);
    if (e <= 0) return;
    const cy = 740 + size * 0.5;
    const scale = 2.2 - 1.2 * e;
    const rot = ROT[i] * (1 - e);
    letterSvg += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)})"><text x="0" y="${(size * 0.36).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${size}" fill="${BRAND.sujo}">${L}</text></g>`;
  });

  const wmO = seg(t, 0.9, 0.35, easeOutQuad);
  const wmY = 22 * (1 - seg(t, 0.9, 0.35, easeOutCubic));
  const metaO = seg(t, 2.1, 0.3, easeOutQuad);
  const flash = 1 - seg(t, 0, 0.22, easeOutQuad);
  const meta = `${String(itemCount).padStart(2, "0")} MANCHETES · ${rangeLabel}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${veilSvg(dark)}
    ${showChip ? clipChipSvg(t, { inAt: 0.15, place: "top", textW: chipTextW }) : ""}
    ${wmO > 0 ? `<text x="${W / 2}" y="${(660 + 42 * 0.8 + wmY).toFixed(1)}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="42" fill="${BRAND.sujo}" opacity="${wmO.toFixed(3)}">${escapeXml(BRAND.wordmark)}</text>` : ""}
    ${letterSvg}
    ${tarjaSvg(t, { text: "AS NOTÍCIAS DA SEMANA", bg: accent, color: BRAND.sujo, y: 1030, size: 32, inAt: 1.7, dur: 0.35, id: "co-tarja", centerAt: W / 2, textW: tarjaTextW })}
    ${metaO > 0 ? `<text x="${W / 2}" y="${1130 + 28 * 0.8}" text-anchor="middle" font-family="${F_INTER_SB}" font-weight="600" font-size="28" letter-spacing="6.2" fill="rgba(247,241,222,0.85)" opacity="${metaO.toFixed(3)}">${escapeXml(meta)}</text>` : ""}
    ${flash > 0 ? `<rect x="0" y="0" width="${W}" height="${H}" fill="${accent}" opacity="${flash.toFixed(3)}"/>` : ""}
  </svg>`;
}


// OUTRO: badge da marca + SIGA @smufdpj + tarja do site + assinatura.
export function outroSvg(t, { accent, badgeFrame = null, siteTextW = null }) {
  const badge = seg(t, 0.05, 0.4, easeOutBack);
  const siga = seg(t, 0.45, 0.25, easeOutQuad);
  const handle = seg(t, 0.55, 0.35, easeOutQuart);
  const wmO = seg(t, 1.5, 0.3, easeOutQuad);

  // badge: gif real da marca quando disponivel; senao o disco do prototipo
  const badgeInner = badgeFrame
    ? `<clipPath id="out-badge"><circle cx="0" cy="0" r="180"/></clipPath><g clip-path="url(#out-badge)"><image href="data:image/png;base64,${badgeFrame}" x="-180" y="-180" width="360" height="360" preserveAspectRatio="xMidYMid slice"/></g>`
    : `<circle cx="0" cy="0" r="180" fill="${accent}"/>
       <circle cx="0" cy="0" r="156" fill="none" stroke="rgba(247,241,222,0.7)" stroke-width="3" stroke-dasharray="14 10"/>
       <text x="0" y="22" text-anchor="middle" font-family="${F_ANTON}" font-size="64" fill="${BRAND.sujo}">SMUFDPJ</text>`;
  const badgeSvg = badge <= 0 ? "" : `
    <g transform="translate(540 600)">
      <circle cx="12" cy="14" r="${(180 * badge).toFixed(1)}" fill="rgba(10,9,8,0.9)"/>
      <g transform="scale(${badge.toFixed(3)})"><defs>${badgeFrame ? "" : ""}</defs>${badgeInner}</g>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${paperBgSvg("out")}
    ${badgeSvg}
    ${siga > 0 ? `<text x="${W / 2}" y="${900 + 36 * 0.8}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="36" letter-spacing="15.1" fill="${BRAND.ink}" opacity="${siga.toFixed(3)}">SIGA</text>` : ""}
    ${handle > 0 ? `<g transform="translate(540 ${950 + 150 * 0.55}) scale(${(1.5 - 0.5 * handle).toFixed(3)})"><text x="0" y="40" text-anchor="middle" font-family="${F_ANTON}" font-size="150" fill="${BRAND.ink}" opacity="${handle <= 0 ? 0 : 1}">${BRAND.handle}</text></g>` : ""}
    ${tarjaSvg(t, { text: BRAND.site, bg: BRAND.ink, color: BRAND.creme, y: 1190, size: 30, inAt: 1.0, dur: 0.35, id: "out-tarja", centerAt: W / 2, textW: siteTextW })}
    ${wmO > 0 ? `<text x="${W / 2}" y="${1330 + 34 * 0.8}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="34" fill="${BRAND.ink}" opacity="${wmO.toFixed(3)}">${escapeXml(BRAND.wordmark)}</text>` : ""}
  </svg>`;
}
