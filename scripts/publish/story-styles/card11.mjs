// Style: CARD 11 — mesma linguagem da capa do carrossel (bundle Card 11).
// Fundo na cor do ciclo, "PEARL JAAAM" Anton gigante, wordmark Playfair,
// faixa de edicao + data. Substitui o caderno-b (creme/serif) pra o story
// ficar coeso com o feed/capa novos.
//
// Intro 3.0s:  wordmark -> PEARL/JAAAM -> faixa EDIÇÃO Nº X · data -> manchetes
// Outro 1.5s:  PEARL JAAAM -> @smufdpj / LINK NA BIO

import { clamp01, easeOutCubic, easeOutBack, progress, escapeXml } from "./_shared.mjs";
import { F_ANTON, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";

// Contraste da faixa por cor de fundo (mesma regra do slide card02/capa).
function labelBg(bg) {
  const m = {
    "#0a0a0a": "#E10600", "#e10600": "#0a0a0a",
    "#a87f2c": "#0a0a0a", "#2a5b9e": "#E10600",
  };
  return m[String(bg).toLowerCase()] || "#E10600";
}

function bigTypeSvg({ W, y, fs, opacity, slideY = 0 }) {
  // Nome CERTO ("PEARL" / "JAM") so no story (capa/final). O carrossel
  // mantem o "JAAAM" estilizado do bundle. textLength iguala a largura
  // das duas linhas (JAM tem 3 letras, sem isso ficaria curto demais).
  const TW = W - 110;
  return `<g opacity="${opacity.toFixed(2)}" transform="translate(0 ${slideY.toFixed(1)})">
    <text x="${W / 2}" y="${y}" text-anchor="middle" textLength="${TW}" lengthAdjust="spacingAndGlyphs"
      font-family="${F_ANTON}" font-size="${fs}" fill="#ffffff">PEARL</text>
    <text x="${W / 2}" y="${y + Math.round(fs * 0.80)}" text-anchor="middle" textLength="${TW}" lengthAdjust="spacingAndGlyphs"
      font-family="${F_ANTON}" font-size="${fs}" fill="#ffffff">JAM</text>
  </g>`;
}

function wordmarkSvg({ W, y, opacity }) {
  return `<text x="${W / 2}" y="${y}" text-anchor="middle"
    font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="40"
    fill="#ffffff" opacity="${opacity.toFixed(2)}" letter-spacing="-0.8">Só Mais um Fã de PEARL JAM</text>`;
}

// -----------------------------------------------------------------------
// INTRO (3.0s)
// -----------------------------------------------------------------------
function buildIntroFrame({ tRel, state }) {
  const { W, H, day, month, year, dayOfWeekLong, monthLong,
          edition, itemCount, tarjaColor } = state;

  const wmP    = easeOutCubic(progress(tRel, 0.0, 0.4));
  const typeP  = easeOutCubic(progress(tRel, 0.2, 0.6));
  const tagP   = easeOutBack(progress(tRel, 0.9, 0.4));
  const dateP  = easeOutCubic(progress(tRel, 1.2, 0.5));
  const manP   = easeOutCubic(progress(tRel, 1.7, 0.5));
  const footP  = easeOutCubic(progress(tRel, 2.2, 0.5));

  const cx = W / 2;
  const fs = 400;
  const typeSlideY = (1 - typeP) * 60;

  // Faixa EDIÇÃO Nº X · DD/MM/AAAA
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const labelTxt = `EDIÇÃO Nº ${edition} · ${dd}/${mm}/${year}`;
  const lFS = 30, lLS = 3, lPadX = 26, lPadY = 16;
  const lTextW = Math.round(labelTxt.length * lFS * 0.56 + (labelTxt.length - 1) * lLS);
  const lBoxW = lTextW + lPadX * 2;
  const lBoxH = lFS + lPadY * 2;
  const lY = 1180;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${tarjaColor}"/>

    ${wordmarkSvg({ W, y: 150, opacity: wmP })}
    ${bigTypeSvg({ W, y: 620, fs, opacity: typeP, slideY: typeSlideY })}

    <g transform="translate(${(cx - lBoxW / 2).toFixed(1)} ${lY}) scale(${easeOutBack(tagP).toFixed(3)})"
       transform-origin="${lBoxW / 2} ${lBoxH / 2}" opacity="${clamp01(tagP * 2).toFixed(2)}">
      <rect x="0" y="0" width="${lBoxW}" height="${lBoxH}" fill="${labelBg(tarjaColor)}"/>
      <text x="${lBoxW / 2}" y="${lPadY + lFS * 0.78}" text-anchor="middle"
        font-family="${F_INTER_XB}" font-weight="800" font-size="${lFS}"
        fill="#ffffff" letter-spacing="${lLS}">${escapeXml(labelTxt)}</text>
    </g>

    <text x="${cx}" y="1320" text-anchor="middle"
      font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="46"
      fill="#ffffff" opacity="${dateP.toFixed(2)}">${escapeXml(dayOfWeekLong)}, ${day} de ${escapeXml(monthLong)} de ${year}</text>

    <text x="${cx}" y="1470" text-anchor="middle"
      font-family="${F_ANTON}" font-size="120" fill="#ffffff"
      opacity="${manP.toFixed(2)}" letter-spacing="-1">${itemCount} ${itemCount === 1 ? "MANCHETE" : "MANCHETES"}</text>
    <text x="${cx}" y="1530" text-anchor="middle"
      font-family="${F_INTER_XB}" font-weight="800" font-size="28"
      fill="#ffffff" opacity="${(manP * 0.7).toFixed(2)}" letter-spacing="6">DO MUNDO PEARL JAM HOJE</text>

    <text x="${cx}" y="${H - 90}" text-anchor="middle"
      font-family="${F_INTER_XB}" font-weight="800" font-size="26"
      fill="#ffffff" opacity="${(footP * 0.85).toFixed(2)}" letter-spacing="3">SETLISTS-PJ-EV.PAGES.DEV</text>
  </svg>`;
}

// -----------------------------------------------------------------------
// OUTRO (1.5s)
// -----------------------------------------------------------------------
function buildOutroFrame({ tRel, state }) {
  const { W, H, tarjaColor } = state;

  const typeP   = easeOutCubic(progress(tRel, 0.0, 0.4));
  const ctaP    = easeOutBack(progress(tRel, 0.3, 0.5));
  const handleP = easeOutBack(progress(tRel, 0.6, 0.45)); // pop da tag @smufdpj
  const footP   = easeOutCubic(progress(tRel, 0.7, 0.5));

  const cx = W / 2;

  // Tag do @smufdpj (destaque na tela final). Mesma linguagem da faixa
  // EDIÇÃO/tarja de categoria: caixa de cor de contraste + pop.
  const hTxt = "@smufdpj";
  const hFS = 60, hPadX = 40, hPadY = 22;
  const hTextW = Math.round(hTxt.length * hFS * 0.52);
  const hBoxW = hTextW + hPadX * 2;
  const hBoxH = hFS + hPadY * 2;
  const hY = 1480;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${tarjaColor}"/>

    ${bigTypeSvg({ W, y: 560, fs: 400, opacity: typeP, slideY: (1 - typeP) * 50 })}

    <g transform="translate(${cx} 1240) scale(${easeOutBack(ctaP).toFixed(3)})"
       transform-origin="0 0" opacity="${clamp01(ctaP * 2).toFixed(2)}">
      <text x="0" y="-34" text-anchor="middle"
        font-family="${F_INTER_XB}" font-weight="800" font-size="30"
        fill="#ffffff" letter-spacing="10" opacity="0.7">TOQUE EM</text>
      <text x="0" y="130" text-anchor="middle"
        font-family="${F_ANTON}" font-size="150" fill="#ffffff" letter-spacing="2">LINK NA BIO</text>
    </g>

    <g transform="translate(${cx} ${hY + hBoxH / 2}) scale(${easeOutBack(handleP).toFixed(3)})"
       transform-origin="0 0" opacity="${clamp01(handleP * 2).toFixed(2)}">
      <rect x="${-hBoxW / 2}" y="${-hBoxH / 2}" width="${hBoxW}" height="${hBoxH}" fill="${labelBg(tarjaColor)}"/>
      <text x="0" y="${hFS * 0.36}" text-anchor="middle"
        font-family="${F_INTER_XB}" font-weight="800" font-size="${hFS}"
        fill="#ffffff" letter-spacing="1">${hTxt}</text>
    </g>

    <text x="${cx}" y="${H - 90}" text-anchor="middle"
      font-family="${F_INTER_XB}" font-weight="800" font-size="26"
      fill="#ffffff" opacity="${(footP * 0.7).toFixed(2)}" letter-spacing="3">PRÓXIMA EDIÇÃO AMANHÃ</text>
  </svg>`;
}

export default {
  intro: buildIntroFrame,
  outro: buildOutroFrame,
};
