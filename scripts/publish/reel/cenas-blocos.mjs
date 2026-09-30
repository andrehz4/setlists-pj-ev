// Cenas de manchete do reel: cinética, card e papel. `dur` = duração real da
// cena (com narração varia); a saída do texto acompanha.

import { W, H, BLOCK_DUR, F_TYPEWRITER, BRAND, TAG_LABELS, linear, easeOutCubic, easeOutQuart, easeOutQuad, easeInCubic, easeOutBack, seg, escapeXml, wrapWords, F_ANTON, F_INTER, F_INTER_XB } from "./base.mjs";
import { wordmarkSvg, counterSvg, clipChipSvg, tarjaSvg, kineticWordsSvg, veilSvg, paperBgSvg } from "./atomos.mjs";

// BLOCO CINETICO: tarja + manchete palavra a palavra sobre clipe/foto/fantasma.
// dur: duração real da cena (com narração ela varia); a saída do texto acompanha.
export function kineticSvg(t, { item, n, total, accent, dark = 0.68, ghost = false, layout = null, tarjaTextW = null, chipTextW = null, showChip = true, dur = BLOCK_DUR }) {
  const size = (item.title_pt || "").length > 60 ? 94 : 112;
  const xe = seg(t, dur - 0.32, 0.32, easeInCubic);
  const words = kineticWordsSvg(t, {
    text: item.title_pt || "", size, color: BRAND.sujo,
    x: 60, y: 664, maxWidth: 920, inAt: 0.5, stagger: 0.11, dur: 0.38,
    idPrefix: `kin-${n}`, layout,
  });
  const tag = TAG_LABELS[item.tags?.[0]] || String(item.tags?.[0] || "NOTÍCIA").toUpperCase();

  // fundo fantasma (sem clipe e sem foto): listras + CLIPE outline derivando
  const drift = -24 + 48 * linear(t / dur);
  const ghostBg = ghost ? `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0d0c0b"/>
    <defs><pattern id="kin-stripes" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="3" height="64" fill="rgba(247,241,222,0.045)"/></pattern></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#kin-stripes)"/>
    <text x="${(W / 2 + drift).toFixed(1)}" y="${700 + 340 * 0.8}" text-anchor="middle" font-family="${F_ANTON}" font-size="340" fill="none" stroke="rgba(247,241,222,0.12)" stroke-width="2">CLIPE</text>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${ghostBg}
    ${ghost ? "" : veilSvg(dark)}
    ${showChip ? clipChipSvg(t, { inAt: 0.1, place: "bottom", textW: chipTextW }) : ""}
    ${wordmarkSvg(t, "rgba(247,241,222,0.9)", 0.2)}
    ${counterSvg(t, n, total, BRAND.sujo, 0.1)}
    <g transform="translate(0 ${(-40 * xe).toFixed(1)})" opacity="${(1 - xe).toFixed(3)}">
      ${tarjaSvg(t, { text: tag, bg: accent, color: BRAND.sujo, x: 60, y: 560, size: 30, inAt: 0.15, dur: 0.3, id: `kin-${n}-tarja`, textW: tarjaTextW })}
      ${words.svg}
    </g>
  </svg>`;
}

// BLOCO CARD: overlay sobre a foto (gradiente, cunha, tarja, manchete em bloco, meta).
export function cardSvg(t, { item, n, total, accent, layout = null, tarjaTextW = null, dur = BLOCK_DUR }) {
  const size = (item.title_pt || "").length > 60 ? 66 : 78;
  const lines = layout || wrapWords(item.title_pt || "", size, 880);
  const lh = Math.round(size * 1.06);
  const xe = seg(t, dur - 0.3, 0.3, easeInCubic);
  const wedge = seg(t, 0.15, 0.35, easeOutCubic);
  const head = seg(t, 0.6, 0.55, easeOutQuart);
  const metaO = seg(t, 1.3, 0.3, easeOutQuad);
  const tag = TAG_LABELS[item.tags?.[0]] || String(item.tags?.[0] || "NOTÍCIA").toUpperCase();

  // ancoragem no fundo: meta colada em bottom 300, manchete acima, tarja acima
  const metaH = 27 + 14 + 27;
  const metaTop = H - 300 - metaH;
  const titleH = lines.length * lh;
  const titleTop = metaTop - 30 - titleH;
  const tarjaTop = titleTop - 26 - (28 + 22);

  let titleText = "";
  lines.forEach((line, li) => {
    const lineStr = line.map((w) => w.text).join(" ");
    titleText += `<text x="60" y="${(titleTop + li * lh + size * 0.82).toFixed(1)}" font-family="${F_ANTON}" font-size="${size}" letter-spacing="0.5" fill="${BRAND.sujo}">${escapeXml(lineStr)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="card-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10,9,8,0.28)"/>
        <stop offset="24%" stop-color="rgba(10,9,8,0)"/>
        <stop offset="46%" stop-color="rgba(10,9,8,0)"/>
        <stop offset="88%" stop-color="rgba(10,9,8,0.9)"/>
        <stop offset="100%" stop-color="rgba(10,9,8,0.9)"/>
      </linearGradient>
      <clipPath id="card-title-${n}"><rect x="54" y="${(titleTop - size * 0.12).toFixed(1)}" width="892" height="${(titleH + size * 0.24).toFixed(1)}"/></clipPath>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#card-grad)"/>
    <g transform="translate(${(-(1 - wedge) * 454).toFixed(1)} ${(-(1 - wedge) * 420).toFixed(1)})">
      <polygon points="0,0 454,0 0,420" fill="${accent}"/>
    </g>
    ${wordmarkSvg(t, "rgba(247,241,222,0.95)", 0.35)}
    ${counterSvg(t, n, total, BRAND.sujo, 0.3)}
    <g transform="translate(${(-60 * xe).toFixed(1)} 0)" opacity="${(1 - xe).toFixed(3)}">
      ${tarjaSvg(t, { text: tag, bg: accent, color: BRAND.sujo, x: 60, y: tarjaTop, size: 28, inAt: 0.5, dur: 0.3, id: `card-${n}-tarja`, textW: tarjaTextW })}
      <g clip-path="url(#card-title-${n})"><g transform="translate(0 ${((1 - head) * titleH * 1.1).toFixed(1)})" opacity="${head <= 0 ? 0 : 1}">${titleText}</g></g>
      <g opacity="${metaO.toFixed(3)}">
        <text x="60" y="${(metaTop + 27 * 0.8).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="27" letter-spacing="8.1" fill="${BRAND.sujo}">LEIA MAIS ...</text>
        <text x="60" y="${(metaTop + 27 + 14 + 27 * 0.8).toFixed(1)}" font-family="${F_INTER}" font-size="27" fill="rgba(247,241,222,0.78)">${BRAND.site}</text>
      </g>
    </g>
  </svg>`;
}


// BLOCO PAPEL: digesto da comunidade, snapshot colado inclinado + manchete em tinta.
export function paperSvg(t, { item, n, total, accent, photoDataUri = null, layout = null, tarjaTextW = null, dur = BLOCK_DUR }) {
  const size = (item.title_pt || "").length > 56 ? 88 : 100;
  const xe = seg(t, dur - 0.32, 0.32, easeInCubic);
  const snapE = seg(t, 0.22, 0.5, easeOutBack);
  const typeO = seg(t, 1.5, 0.3, easeOutQuad);
  const tag = TAG_LABELS[item.tags?.[0]] || String(item.tags?.[0] || "COMUNIDADE").toUpperCase();
  const words = kineticWordsSvg(t, {
    text: item.title_pt || "", size, color: BRAND.ink,
    x: 60, y: 1042, maxWidth: 920, inAt: 0.7, stagger: 0.10, dur: 0.36,
    idPrefix: `pap-${n}`, layout,
  });
  const typeY = 1042 + words.lines * words.lineHeight + 30;

  // snapshot 740x560 em (170,280): sombra dura, moldura f7f1de pad 16, foto cover
  const cx = 170 + 370, cy = 280 + 280;
  const rot = -8 + 5.5 * snapE;
  const dy = (1 - snapE) * 90;
  const photo = photoDataUri
    ? `<image href="${photoDataUri}" x="-354" y="-264" width="708" height="528" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="-354" y="-264" width="708" height="528" fill="#ddd3b8"/><text x="0" y="10" text-anchor="middle" font-family="${F_TYPEWRITER}" font-size="30" fill="${BRAND.ink}">FOTO DA COMUNIDADE</text>`;
  const snapshot = snapE <= 0 ? "" : `
    <g transform="translate(${cx} ${(cy + dy).toFixed(1)}) rotate(${rot.toFixed(2)})" opacity="${Math.min(1, snapE * 2).toFixed(3)}">
      <rect x="${-370 + 14}" y="${-280 + 16}" width="740" height="560" fill="rgba(10,9,8,0.9)"/>
      <rect x="-370" y="-280" width="740" height="560" fill="${BRAND.sujo}"/>
      ${photo}
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${paperBgSvg(`pap-${n}`)}
    ${wordmarkSvg(t, BRAND.ink, 0.15)}
    ${counterSvg(t, n, total, BRAND.ink, 0.1)}
    ${snapshot}
    <g transform="translate(0 ${(-40 * xe).toFixed(1)})" opacity="${(1 - xe).toFixed(3)}">
      ${tarjaSvg(t, { text: tag, bg: accent, color: BRAND.sujo, x: 60, y: 940, size: 30, inAt: 0.45, dur: 0.3, id: `pap-${n}-tarja`, textW: tarjaTextW })}
      ${words.svg}
      ${typeO > 0 ? `<text x="60" y="${(typeY + 30 * 0.8).toFixed(1)}" font-family="${F_TYPEWRITER}" font-size="30" letter-spacing="1.2" fill="${BRAND.ink}" opacity="${typeO.toFixed(3)}">direto da comunidade global de fãs</text>` : ""}
    </g>
  </svg>`;
}

