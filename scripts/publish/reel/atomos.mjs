// Átomos visuais recorrentes das cenas (SVG): assinatura, contador, chip de
// clipe, tarja com wipe, manchete palavra a palavra, véu e papel xerox.

import { W, H, BRAND, easeOutCubic, easeOutQuart, easeOutQuad, seg, escapeXml, wrapWords, F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./base.mjs";

// ============ atomos recorrentes (SVG) ============

export function wordmarkSvg(t, color, inAt = 0.3) {
  const o = seg(t, inAt, 0.3, easeOutQuad);
  if (o <= 0) return "";
  return `<text x="${W / 2}" y="${64 + 34 * 0.8}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="34" fill="${color}" opacity="${o.toFixed(3)}">${escapeXml(BRAND.wordmark)}</text>`;
}

export function counterSvg(t, n, total, color, inAt = 0.1) {
  const e = seg(t, inAt, 0.3, easeOutCubic);
  if (e <= 0) return "";
  const label = `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return `<text x="${W - 60}" y="${(62 + 32 * 0.8 - 24 * (1 - e)).toFixed(1)}" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="32" letter-spacing="2.5" fill="${color}" opacity="${e.toFixed(3)}">${label}</text>`;
}

// Chip "CLIPE · MUDO" com bolinha vermelha piscando (step de 0.5s).
export function clipChipSvg(t, { inAt = 0.12, place = "top", textW = null } = {}) {
  const o = seg(t, inAt, 0.25, easeOutQuad);
  if (o <= 0) return "";
  const blink = Math.floor(t * 2) % 2 === 0 ? 1 : 0.25;
  const label = "CLIPE · MUDO";
  const fs = 24;
  if (textW == null) textW = Math.round(label.length * fs * 0.62 + label.length * fs * 0.14);
  const boxW = 18 + 14 + 12 + textW + 18;
  const boxH = fs + 10 + 10 + 4;
  const y = place === "bottom" ? H - 70 - boxH : 60;
  return `<g opacity="${o.toFixed(3)}">
    <rect x="60" y="${y}" width="${boxW}" height="${boxH}" fill="none" stroke="rgba(247,241,222,0.55)" stroke-width="2"/>
    <circle cx="${60 + 18 + 7}" cy="${y + boxH / 2}" r="7" fill="#E10600" opacity="${blink}"/>
    <text x="${60 + 18 + 14 + 12}" y="${(y + boxH / 2 + fs * 0.34).toFixed(1)}" font-family="${F_INTER_SB}" font-weight="600" font-size="${fs}" letter-spacing="3.4" fill="${BRAND.sujo}">${label}</text>
  </g>`;
}

// Tarja com wipe horizontal esquerda->direita (clip-path de largura crescente).
export function tarjaSvg(t, { text, bg, color, x, y, size = 30, inAt = 0.15, dur = 0.3, id, centerAt = null, textW = null }) {
  const e = seg(t, inAt, dur, easeOutQuart);
  if (e <= 0) return "";
  const label = String(text).toUpperCase();
  if (textW == null) textW = Math.round(label.length * size * 0.62 + Math.max(0, label.length - 1) * size * 0.16);
  const boxW = 24 + textW + 24;
  const boxH = size + 12 + 10;
  const bx = centerAt != null ? Math.round(centerAt - boxW / 2) : x;
  return `<g clip-path="url(#${id})">
    <defs><clipPath id="${id}"><rect x="${bx}" y="${y}" width="${(boxW * e).toFixed(1)}" height="${boxH}"/></clipPath></defs>
    <rect x="${bx}" y="${y}" width="${boxW}" height="${boxH}" fill="${bg}"/>
    <text x="${bx + 24}" y="${(y + 12 + size * 0.8).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${size}" letter-spacing="${(size * 0.16).toFixed(1)}" fill="${color}">${escapeXml(label)}</text>
  </g>`;
}

// Manchete cinetica: palavra a palavra, mascara por linha (translateY 104%).
export function kineticWordsSvg(t, { text, size, color, x, y, maxWidth = 920, inAt = 0.5, stagger = 0.11, dur = 0.38, idPrefix, layout = null }) {
  const lines = layout || wrapWords(text, size, maxWidth);
  const lh = Math.round(size * 1.02);
  let defs = "";
  let body = "";
  let wi = 0;
  lines.forEach((line, li) => {
    const clipId = `${idPrefix}-ln${li}`;
    const top = y + li * lh - size * 0.10;
    defs += `<clipPath id="${clipId}"><rect x="${x - 6}" y="${top.toFixed(1)}" width="${maxWidth + 12}" height="${(lh + size * 0.20).toFixed(1)}"/></clipPath>`;
    for (const w of line) {
      const e = seg(t, inAt + wi * stagger, dur, easeOutCubic);
      wi++;
      if (e <= 0) continue;
      const dy = (1 - e) * lh * 1.04;
      body += `<g clip-path="url(#${clipId})"><text x="${x + w.x}" y="${(y + li * lh + size * 0.82).toFixed(1)}" font-family="${F_ANTON}" font-size="${size}" letter-spacing="0.5" fill="${color}" transform="translate(0 ${dy.toFixed(1)})">${escapeXml(w.text)}</text></g>`;
    }
  });
  return { svg: `<defs>${defs}</defs>${body}`, lines: lines.length, lineHeight: lh };
}

// ============ cenas ============

// Veu escuro sobre clipe/foto (cor do spec, opacidade por cena).
export const veilSvg = (dark) => dark > 0 ? `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(10,9,8,${dark})"/>` : "";

// Textura papel xerox (linhas sutis de tinta).
export function paperBgSvg(idPrefix) {
  return `<rect x="0" y="0" width="${W}" height="${H}" fill="${BRAND.creme}"/>
    <defs>
      <pattern id="${idPrefix}-ph" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="rgba(10,9,8,0.02)"/></pattern>
      <pattern id="${idPrefix}-pv" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="3" height="9" fill="rgba(10,9,8,0.014)"/></pattern>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${idPrefix}-ph)"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${idPrefix}-pv)"/>`;
}

