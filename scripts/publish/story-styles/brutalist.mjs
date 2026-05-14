// Style: BRUTALIST GRID. Cobre intro (3s) e outro (1.5s) do story.
// Continuidade visual entre os dois: numero gigante de edicao sangrando
// pela direita + SMUFDPJ rotacionado 90 a esquerda + faixa accent.
// Difere o conteudo:
//   INTRO  -> meta typewriter (NN.MM.AAAA, dia, items) + faixa "NOTÍCIAS DO DIA"
//   OUTRO  -> faixa superior "FIM DA EDIÇÃO Nº X" + "LINK NA BIO" centralizado
//             + "@SMUFDPJ" + footer "PRÓXIMA EDIÇÃO AMANHÃ"

import { clamp01, easeOutCubic, easeOutBack, progress, escapeXml, MONTH_NUM } from "./_shared.mjs";

// ====================================================================
// INTRO (3.0s)
// ====================================================================
const META_LINES_ORDER = ["edition", "date", "day", "items"];

function buildIntroFrame({ tRel, state }) {
  const { W, H, day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = state;

  const barP = easeOutCubic(progress(tRel, 0.0, 0.3));
  const headerP = easeOutCubic(progress(tRel, 0.0, 0.4));
  const headerLineP = easeOutCubic(progress(tRel, 0.05, 0.35));
  const meta = {
    edition: progress(tRel, 0.30, 0.18),
    date:    progress(tRel, 0.48, 0.18),
    day:     progress(tRel, 0.66, 0.18),
    items:   progress(tRel, 0.84, 0.18),
  };
  const numP = easeOutCubic(progress(tRel, 0.6, 0.8));
  const numStartX = W + 1200;
  const numEndX = W + 60;
  const numX = numStartX + (numEndX - numStartX) * numP;
  const numOpacity = easeOutCubic(progress(tRel, 0.6, 0.3));

  const smufdpjText = "SMUFDPJ";
  const smufdpjP = progress(tRel, 0.9, 0.6);
  const smufdpjShown = Math.floor(easeOutCubic(smufdpjP) * smufdpjText.length);
  const smufdpjVisible = smufdpjText.slice(0, smufdpjShown);

  const faixaP = easeOutCubic(progress(tRel, 1.6, 0.6));
  const faixaH = 180;
  const faixaYStart = H + 200;
  const faixaYEnd = H - faixaH;
  const faixaY = faixaYStart + (faixaYEnd - faixaYStart) * faixaP;
  const faixaTextOpacity = easeOutCubic(progress(tRel, 1.8, 0.6));
  const pgOpacity = easeOutCubic(progress(tRel, 2.5, 0.45));
  const gridOpacity = 0.08 * easeOutCubic(progress(tRel, 0.4, 0.6));

  function typeText(full, p) {
    const shown = Math.floor(easeOutCubic(clamp01(p)) * full.length);
    return full.slice(0, shown);
  }
  const metaLines = [
    { y: 320, full: `N° / 0${edition}` },
    { y: 350, full: `DATE / ${day.toString().padStart(2,"0")}.${MONTH_NUM[monthShort]}.${year}` },
    { y: 380, full: `DAY / ${dayOfWeekShort}` },
    { y: 410, full: `ITEMS / ${String(itemCount).padStart(2,"0")}` },
  ];
  const metaSvg = metaLines.map((ln, i) => {
    const key = META_LINES_ORDER[i];
    const p = meta[key];
    const visible = typeText(ln.full, p);
    const cursor = p > 0 && p < 1 && Math.floor(tRel * 8) % 2 === 0 ? "▌" : "";
    return `<text x="100" y="${ln.y}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="16" fill="#0a0908" letter-spacing="3" opacity="0.7">${escapeXml(visible)}${cursor ? `<tspan opacity="0.6">${cursor}</tspan>` : ""}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#f5f3ec"/>
    <g stroke="#0a0908" stroke-width="0.5" opacity="${gridOpacity.toFixed(3)}">
      <line x1="0" y1="160" x2="${W}" y2="160"/>
      <line x1="0" y1="${H - 160}" x2="${W}" y2="${H - 160}"/>
      <line x1="${W / 3}" y1="0" x2="${W / 3}" y2="${H}"/>
      <line x1="${2 * W / 3}" y1="0" x2="${2 * W / 3}" y2="${H}"/>
    </g>

    <text x="${numX.toFixed(1)}" y="1240" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="900" font-weight="900" fill="#0a0908" letter-spacing="-40" text-anchor="end" opacity="${numOpacity.toFixed(2)}">${edition}</text>

    <rect x="60" y="160" width="6" height="${((H - 320) * barP).toFixed(1)}" fill="${tarjaColor}"/>

    <g opacity="${headerP.toFixed(2)}">
      <text x="100" y="240" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="22" font-weight="700" fill="#0a0908" letter-spacing="8">SMUFDPJ  ·  EDITION FILE</text>
    </g>
    <line x1="100" y1="260" x2="${(100 + (W - 200) * headerLineP).toFixed(1)}" y2="260" stroke="#0a0908" stroke-width="1"/>

    ${metaSvg}

    <g transform="translate(140, 1500) rotate(-90)">
      <text x="0" y="0" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="220" font-weight="900" fill="#0a0908" letter-spacing="-8">${escapeXml(smufdpjVisible)}</text>
    </g>

    <g transform="translate(0, ${faixaY.toFixed(1)})">
      <rect x="0" y="0" width="${W}" height="${faixaH}" fill="${tarjaColor}"/>
      <g opacity="${faixaTextOpacity.toFixed(2)}">
        <text x="100" y="80" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="80" font-weight="900" fill="#ede4cc" letter-spacing="-2">NOTÍCIAS</text>
        <text x="100" y="140" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="22" fill="#ede4cc" letter-spacing="8">DO DIA  /  EDIÇÃO ${edition}  /  ${dayOfWeekShort}</text>
      </g>
    </g>

    <text x="${W - 100}" y="${H - 60}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="14" fill="#0a0908" letter-spacing="4" text-anchor="end" opacity="${(pgOpacity * 0.6).toFixed(2)}">PG. 01 OF ${String(itemCount).padStart(2, "0")}</text>
  </svg>`;
}

// ====================================================================
// OUTRO (1.5s) - mesmo grid suico, conteudo de fechamento
// Continuidade visual: 133 sangrando, SMUFDPJ vertical, barra accent
// Conteudo proprio: faixa superior "FIM DA EDIÇÃO", LINK NA BIO no centro
// ====================================================================

function buildOutroFrame({ tRel, state }) {
  const { W, H, edition, itemCount, tarjaColor, dayOfWeekShort } = state;

  const faixaTopP = easeOutCubic(progress(tRel, 0.0, 0.25));
  const faixaTopH = 180;
  const faixaTopYStart = -faixaTopH - 20;
  const faixaTopYEnd = 0;
  const faixaTopY = faixaTopYStart + (faixaTopYEnd - faixaTopYStart) * faixaTopP;
  const faixaTopTextOpacity = easeOutCubic(progress(tRel, 0.1, 0.35));

  const numP = easeOutCubic(progress(tRel, 0.0, 0.5));
  const numStartX = W + 1200;
  const numEndX = W + 60;
  const numX = numStartX + (numEndX - numStartX) * numP;
  const numOpacity = easeOutCubic(progress(tRel, 0.0, 0.3));

  const smufdpjText = "SMUFDPJ";
  const smufdpjP = progress(tRel, 0.15, 0.45);
  const smufdpjShown = Math.floor(easeOutCubic(smufdpjP) * smufdpjText.length);
  const smufdpjVisible = smufdpjText.slice(0, smufdpjShown);

  const linkP = progress(tRel, 0.3, 0.5);
  const linkScale = easeOutBack(linkP);
  const linkOpacity = clamp01(linkP * 2);
  const handleOpacity = easeOutCubic(progress(tRel, 0.55, 0.4));
  const footerP = easeOutCubic(progress(tRel, 0.8, 0.4));
  const gridOpacity = 0.08 * easeOutCubic(progress(tRel, 0.0, 0.5));
  const barOpacity = easeOutCubic(progress(tRel, 0.0, 0.3));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#f5f3ec"/>

    <g stroke="#0a0908" stroke-width="0.5" opacity="${gridOpacity.toFixed(3)}">
      <line x1="0" y1="${faixaTopH + 80}" x2="${W}" y2="${faixaTopH + 80}"/>
      <line x1="0" y1="${H - 160}" x2="${W}" y2="${H - 160}"/>
      <line x1="${W / 3}" y1="0" x2="${W / 3}" y2="${H}"/>
      <line x1="${2 * W / 3}" y1="0" x2="${2 * W / 3}" y2="${H}"/>
    </g>

    <text x="${numX.toFixed(1)}" y="1240" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="900" font-weight="900" fill="#0a0908" letter-spacing="-40" text-anchor="end" opacity="${numOpacity.toFixed(2)}">${edition}</text>

    <rect x="60" y="${faixaTopH + 60}" width="6" height="${H - faixaTopH - 220}" fill="${tarjaColor}" opacity="${barOpacity.toFixed(2)}"/>

    <g transform="translate(140, 1500) rotate(-90)">
      <text x="0" y="0" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="220" font-weight="900" fill="#0a0908" letter-spacing="-8">${escapeXml(smufdpjVisible)}</text>
    </g>

    <g transform="translate(0, ${faixaTopY.toFixed(1)})">
      <rect x="0" y="0" width="${W}" height="${faixaTopH}" fill="${tarjaColor}"/>
      <g opacity="${faixaTopTextOpacity.toFixed(2)}">
        <text x="100" y="80" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="64" font-weight="900" fill="#ede4cc" letter-spacing="-1">FIM DA EDIÇÃO</text>
        <text x="100" y="140" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="22" fill="#ede4cc" letter-spacing="8">Nº ${edition}  /  ${dayOfWeekShort}  /  ${String(itemCount).padStart(2,"0")} MANCHETES</text>
      </g>
    </g>

    <g transform="translate(${W / 2}, 1020) scale(${linkScale.toFixed(3)})" opacity="${linkOpacity.toFixed(2)}">
      <text x="0" y="0" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="160" font-weight="900" fill="#0a0908" letter-spacing="-4" text-anchor="middle">LINK NA</text>
      <text x="0" y="160" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="220" font-weight="900" fill="${tarjaColor}" letter-spacing="-6" text-anchor="middle">BIO</text>
    </g>

    <text x="${W / 2}" y="1340" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="80" font-weight="900" fill="#0a0908" letter-spacing="-1" text-anchor="middle" opacity="${handleOpacity.toFixed(2)}">@SMUFDPJ</text>

    <g opacity="${footerP.toFixed(2)}">
      <line x1="100" y1="${H - 200}" x2="${W - 100}" y2="${H - 200}" stroke="#0a0908" stroke-width="1"/>
      <text x="100" y="${H - 140}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="20" fill="#0a0908" letter-spacing="6" opacity="0.7">PRÓXIMA EDIÇÃO  /  AMANHÃ  /  09H BRT</text>
      <text x="100" y="${H - 95}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="20" fill="#0a0908" letter-spacing="6" opacity="0.7">SETLISTS-PJ-EV.PAGES.DEV</text>
      <text x="${W - 100}" y="${H - 60}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="14" fill="#0a0908" letter-spacing="4" text-anchor="end" opacity="0.6">PG. ${String(itemCount).padStart(2,"0")} OF ${String(itemCount).padStart(2,"0")}</text>
    </g>
  </svg>`;
}

export default {
  intro: buildIntroFrame,
  outro: buildOutroFrame,
};
