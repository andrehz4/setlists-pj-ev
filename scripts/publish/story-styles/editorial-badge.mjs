// Style: EDITORIAL + BADGE-CARIMBO. Badge editorial centralizado funciona
// como CARIMBO DE FUNDO (zoom 115%, escurecido) com o conteudo da edicao
// escrito por cima. Badge vive em scripts/publish/assets/intro-badge.gif
// (sharp le 1o frame automaticamente, ja injetado como base64 no state).
//
// Composicao:
//   1. Badge centralizado, scale ~1.15 (cobre boa parte do canvas)
//   2. Overlay escuro semitransparente em cima do badge
//   3. Texto principal (data, edicao, dia, manchetes) por cima do overlay
//   4. Header/footer brand bars sobrevoam tudo
//
// Animacao:
//   Pop-in inicial 0->1.15 com easeOutBack nos primeiros 0.6s, sem rotacao
//   sintetica. O proprio peso do carimbo + escurecimento entrega presenca.

import { clamp01, easeOutCubic, easeOutBack, progress, escapeXml } from "./_shared.mjs";

const TINTA = "#0a0908";
const CREME = "#ede4cc";

// Zoom do carimbo (115% do tamanho base)
const BADGE_ZOOM = 1.15;
// Quao escuro o badge fica de fundo (0..1, sobre TINTA)
const BADGE_DARKEN = 0.45;

function noiseSvg() {
  return `<g opacity="0.06" fill="${TINTA}">
    <circle cx="120" cy="420" r="1.6"/><circle cx="300" cy="500" r="1.2"/>
    <circle cx="780" cy="380" r="1.8"/><circle cx="900" cy="640" r="1.3"/>
    <circle cx="200" cy="1500" r="1.6"/><circle cx="600" cy="1620" r="1.2"/>
    <circle cx="950" cy="1480" r="1.7"/><circle cx="450" cy="1380" r="1.3"/>
    <circle cx="80"  cy="1200" r="1.4"/><circle cx="1000" cy="1100" r="1.5"/>
  </g>`;
}

function brandHeaderSvg(opacity = 1, tarjaColor) {
  return `<g opacity="${opacity.toFixed(2)}">
    <rect x="0" y="0" width="1080" height="80" fill="${tarjaColor}"/>
    <rect x="0" y="80" width="1080" height="4" fill="${TINTA}"/>
    <text x="60" y="58" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="44" font-weight="900" fill="${CREME}" stroke="${TINTA}" stroke-width="2" paint-order="stroke fill" letter-spacing="8">SMUFDPJ</text>
    <text x="${1080 - 60}" y="50" font-family="'Special Elite',Courier,monospace" font-size="14" fill="${CREME}" letter-spacing="3" text-anchor="end" opacity="0.92">SÓ MAIS UM FÃ</text>
    <text x="${1080 - 60}" y="70" font-family="'Special Elite',Courier,monospace" font-size="14" fill="${CREME}" letter-spacing="3" text-anchor="end" opacity="0.92">DE PEARL JAM</text>
  </g>`;
}

function brandFooterSvg(opacity = 1, tarjaColor, H) {
  return `<g opacity="${opacity.toFixed(2)}">
    <rect x="0" y="${H - 84}" width="1080" height="4" fill="${TINTA}"/>
    <rect x="0" y="${H - 80}" width="1080" height="80" fill="${tarjaColor}"/>
    <text x="${1080 / 2}" y="${H - 35}" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="32" font-weight="900" fill="${CREME}" stroke="${TINTA}" stroke-width="2" paint-order="stroke fill" letter-spacing="6" text-anchor="middle">SETLISTS-PJ-EV.PAGES.DEV</text>
  </g>`;
}

// Seleciona o frame do GIF correspondente ao tempo tRel. Se for PNG
// estatico (fps=0), sempre retorna frame[0]. Se badge ausente, null.
function pickBadgeFrame(tRel, state) {
  const frames = state.badgeFrames;
  if (!frames || frames.length === 0) return null;
  if (state.badgeFps <= 0 || state.badgeTotalFrames <= 1) return frames[0];
  const idx = Math.floor(tRel * state.badgeFps) % state.badgeTotalFrames;
  return frames[idx];
}

// Badge como carimbo de fundo: scale 1.15, escurecido com overlay TINTA
function badgeCarimboSvg({ W, H, frameB64, popScale, popOpacity }) {
  if (!frameB64) {
    // placeholder visivel se badge sumir
    return `<g transform="translate(${W / 2}, ${H / 2})" opacity="${(popOpacity * 0.3).toFixed(2)}">
      <circle cx="0" cy="0" r="420" fill="none" stroke="${TINTA}" stroke-width="6" stroke-dasharray="24 12"/>
      <text x="0" y="0" font-family="'Special Elite',Courier,monospace" font-size="36" fill="${TINTA}" text-anchor="middle" opacity="0.5">[BADGE FALTANDO]</text>
      <text x="0" y="48" font-family="'Special Elite',Courier,monospace" font-size="18" fill="${TINTA}" text-anchor="middle" opacity="0.4">assets/intro-badge.gif</text>
    </g>`;
  }
  // dimensoes base do carimbo (antes do zoom)
  const baseSize = 900;
  const cx = W / 2;
  const cy = H / 2 + 40; // levemente abaixo do centro pra header respirar
  const totalScale = popScale * BADGE_ZOOM;
  return `<g transform="translate(${cx}, ${cy}) scale(${totalScale.toFixed(3)})" opacity="${popOpacity.toFixed(2)}">
    <image href="data:image/png;base64,${frameB64}" x="${-baseSize / 2}" y="${-baseSize / 2}" width="${baseSize}" height="${baseSize}" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
}

// Overlay escuro em cima do badge, com mascara circular pra escurecer
// apenas onde o carimbo aparece. Usa rect simples cobrindo o canvas
// inteiro com opacidade controlada, ja que sharp+libvips renderiza bem.
function badgeDarkenOverlay({ W, H, opacity }) {
  // overlay aplica TINTA semitransparente em uma area generosa onde
  // mora o badge (caixa central). Nao cobre header/footer porque estao
  // sobrepostos depois no z-order.
  const boxW = 1000;
  const boxH = 1000;
  const x = (W - boxW) / 2;
  const y = H / 2 + 40 - boxH / 2;
  return `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="${TINTA}" opacity="${(BADGE_DARKEN * opacity).toFixed(3)}"/>`;
}

function buildIntroFrame({ tRel, state }) {
  const { W, H, day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = state;
  const frameB64 = pickBadgeFrame(tRel, state);

  // ====== timings ======
  const headerP = easeOutCubic(progress(tRel, 0.0, 0.3));
  const datelineP = easeOutCubic(progress(tRel, 0.15, 0.35));
  const linesTopP = easeOutCubic(progress(tRel, 0.25, 0.4));

  // badge pop-in 0.3-0.9 (sem rotacao sintetica)
  const badgePopP = progress(tRel, 0.3, 0.6);
  const popScale = easeOutBack(badgePopP); // overshoot ate ~1.07
  const popOpacity = clamp01(badgePopP * 2);

  // overlay escuro acompanha o badge
  const overlayOpacity = clamp01(badgePopP * 1.6);

  // textos por cima do carimbo
  const ediP = easeOutCubic(progress(tRel, 0.8, 0.5));
  const dataP = easeOutCubic(progress(tRel, 1.0, 0.5));
  const subDataP = easeOutCubic(progress(tRel, 1.3, 0.5));
  const manchetesP = easeOutCubic(progress(tRel, 1.6, 0.5));
  const legendaP = easeOutCubic(progress(tRel, 2.0, 0.5));
  const linesBotP = easeOutCubic(progress(tRel, 0.55, 0.4));

  // ====== compõe SVG ======
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${CREME}"/>
    ${noiseSvg()}

    <!-- dateline topo -->
    <text x="${W / 2}" y="180" font-family="'Special Elite',Courier,monospace" font-size="26" fill="${TINTA}" letter-spacing="6" text-anchor="middle" opacity="${datelineP.toFixed(2)}">EST. ${year}  ·  ED. Nº ${edition}  ·  ${dayOfWeekShort}</text>

    <!-- linhas duplas top (cresce do centro) -->
    <rect x="${80 + (W - 160) * (1 - linesTopP) / 2}" y="220" width="${((W - 160) * linesTopP).toFixed(1)}" height="6" fill="${TINTA}"/>
    <rect x="${80 + (W - 160) * (1 - linesTopP) / 2}" y="234" width="${((W - 160) * linesTopP).toFixed(1)}" height="2" fill="${TINTA}"/>

    <!-- BADGE como carimbo de fundo (zoom 115%, frame do GIF animado) -->
    ${badgeCarimboSvg({ W, H, frameB64, popScale, popOpacity })}

    <!-- overlay escuro por cima do badge -->
    ${badgeDarkenOverlay({ W, H, opacity: overlayOpacity })}

    <!-- TEXTO PRINCIPAL POR CIMA DO CARIMBO -->

    <!-- ED. Nº gigante (topo do bloco central) -->
    <g opacity="${ediP.toFixed(2)}">
      <text x="${W / 2}" y="640" font-family="'Special Elite',Courier,monospace" font-size="34" fill="${CREME}" letter-spacing="14" text-anchor="middle">EDIÇÃO</text>
      <text x="${W / 2}" y="780" font-family="'Newsreader','Playfair Display','Georgia',serif" font-style="italic" font-size="180" font-weight="900" fill="${tarjaColor}" stroke="${CREME}" stroke-width="3" paint-order="stroke fill" letter-spacing="-2" text-anchor="middle">Nº ${edition}</text>
    </g>

    <!-- DATA grande (centro do bloco) -->
    <g opacity="${dataP.toFixed(2)}">
      <text x="${W / 2}" y="990" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="220" font-weight="900" fill="${CREME}" stroke="${TINTA}" stroke-width="4" paint-order="stroke fill" letter-spacing="-2" text-anchor="middle">${day} ${escapeXml(monthShort)}</text>
    </g>

    <!-- DIA DA SEMANA (logo abaixo da data) -->
    <g opacity="${subDataP.toFixed(2)}">
      <rect x="${W / 2 - 220}" y="1040" width="440" height="68" fill="${tarjaColor}"/>
      <text x="${W / 2}" y="1086" font-family="'Special Elite',Courier,monospace" font-size="32" fill="${CREME}" letter-spacing="10" text-anchor="middle">${dayOfWeekShort} · ${year}</text>
    </g>

    <!-- MANCHETES DO DIA (chamada inferior) -->
    <g opacity="${manchetesP.toFixed(2)}">
      <text x="${W / 2}" y="1230" font-family="'Newsreader','Playfair Display','Georgia',serif" font-style="italic" font-size="58" font-weight="900" fill="${CREME}" stroke="${TINTA}" stroke-width="2" paint-order="stroke fill" text-anchor="middle">${itemCount} manchetes</text>
      <text x="${W / 2}" y="1280" font-family="'Special Elite',Courier,monospace" font-size="24" fill="${CREME}" letter-spacing="8" text-anchor="middle">do dia</text>
    </g>

    <!-- linhas duplas bot -->
    <rect x="${80 + (W - 160) * (1 - linesBotP) / 2}" y="1480" width="${((W - 160) * linesBotP).toFixed(1)}" height="2" fill="${TINTA}"/>
    <rect x="${80 + (W - 160) * (1 - linesBotP) / 2}" y="1490" width="${((W - 160) * linesBotP).toFixed(1)}" height="6" fill="${TINTA}"/>

    <!-- legenda inferior -->
    <text x="80" y="1565" font-family="'Newsreader','Playfair Display','Georgia',serif" font-style="italic" font-size="32" fill="${TINTA}" opacity="${legendaP.toFixed(2)}">diário do pearl jam</text>
    <text x="${W - 80}" y="1565" font-family="'Special Elite',Courier,monospace" font-size="26" fill="${TINTA}" letter-spacing="4" text-anchor="end" opacity="${legendaP.toFixed(2)}">@SMUFDPJ</text>

    <!-- header/footer brand bars sobrevoam o badge -->
    ${brandHeaderSvg(headerP, tarjaColor)}
    ${brandFooterSvg(headerP, tarjaColor, H)}
  </svg>`;
}

// ====================================================================
// OUTRO (1.5s) - mesma carcaca editorial, badge no canto pequeno
// (sem zoom de carimbo) e CTA LINK NA BIO centralizado
// ====================================================================
function buildOutroFrame({ tRel, state }) {
  const { W, H, edition, itemCount, tarjaColor, dayOfWeekShort } = state;
  // continua animado: tRel do outro segue contagem propria, mas usa fps
  // do GIF mesma forma (loop natural)
  const frameB64 = pickBadgeFrame(tRel, state);

  const headerP = easeOutCubic(progress(tRel, 0.0, 0.25));
  const datelineP = easeOutCubic(progress(tRel, 0.0, 0.3));
  const linesP = easeOutCubic(progress(tRel, 0.05, 0.35));

  // badge canto inferior esquerdo, pop-in simples sem rotacao
  const badgeP = progress(tRel, 0.0, 0.4);
  const badgeOpacity = clamp01(badgeP * 1.8);
  const badgeScale = easeOutBack(badgeP);

  // LINK NA BIO centralizado
  const linkP = progress(tRel, 0.2, 0.5);
  const linkScale = easeOutBack(linkP);
  const linkOpacity = clamp01(linkP * 2);

  // @SMUFDPJ
  const handleP = easeOutCubic(progress(tRel, 0.55, 0.4));

  // footer "PRÓXIMA EDIÇÃO"
  const footerP = easeOutCubic(progress(tRel, 0.8, 0.45));

  // ====== badge canto ======
  const badgeCx = 220;
  const badgeCy = 1480;
  const badgeSize = 320;
  const badgeImg = frameB64
    ? `<g transform="translate(${badgeCx}, ${badgeCy}) scale(${badgeScale.toFixed(3)})" opacity="${badgeOpacity.toFixed(2)}">
        <image href="data:image/png;base64,${frameB64}" x="${-badgeSize / 2}" y="${-badgeSize / 2}" width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="xMidYMid meet"/>
      </g>`
    : `<g transform="translate(${badgeCx}, ${badgeCy})" opacity="${(badgeOpacity * 0.3).toFixed(2)}">
        <circle cx="0" cy="0" r="${badgeSize / 2 - 10}" fill="none" stroke="${TINTA}" stroke-width="3" stroke-dasharray="14 6"/>
      </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${CREME}"/>
    ${noiseSvg()}

    ${brandHeaderSvg(headerP, tarjaColor)}
    ${brandFooterSvg(headerP, tarjaColor, H)}

    <!-- dateline FIM -->
    <text x="${W / 2}" y="180" font-family="'Special Elite',Courier,monospace" font-size="26" fill="${TINTA}" letter-spacing="6" text-anchor="middle" opacity="${datelineP.toFixed(2)}">FIM DA EDIÇÃO Nº ${edition}  ·  ${itemCount} MANCHETES  ·  ${dayOfWeekShort}</text>

    <!-- linhas duplas top -->
    <rect x="${80 + (W - 160) * (1 - linesP) / 2}" y="220" width="${((W - 160) * linesP).toFixed(1)}" height="6" fill="${TINTA}"/>
    <rect x="${80 + (W - 160) * (1 - linesP) / 2}" y="234" width="${((W - 160) * linesP).toFixed(1)}" height="2" fill="${TINTA}"/>

    <!-- CTA central -->
    <g transform="translate(${W / 2}, 780) scale(${linkScale.toFixed(3)})" opacity="${linkOpacity.toFixed(2)}">
      <text x="0" y="0" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="120" font-weight="900" fill="${TINTA}" letter-spacing="-2" text-anchor="middle">LINK NA</text>
      <text x="0" y="180" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="220" font-weight="900" fill="${tarjaColor}" stroke="${TINTA}" stroke-width="3" paint-order="stroke fill" letter-spacing="-4" text-anchor="middle">BIO</text>
    </g>

    <!-- linha sob LINK NA BIO -->
    <line x1="${80 + (W - 160) * (1 - linkP) / 2}" y1="1050" x2="${(W - 80) - (W - 160) * (1 - linkP) / 2}" y2="1050" stroke="${TINTA}" stroke-width="4" opacity="${linkOpacity.toFixed(2)}"/>

    <!-- @SMUFDPJ -->
    <text x="${W / 2}" y="1140" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="64" font-weight="900" fill="${TINTA}" text-anchor="middle" opacity="${handleP.toFixed(2)}">@smufdpj</text>

    <!-- badge canto inferior esquerdo -->
    ${badgeImg}

    <!-- footer "PRÓXIMA EDIÇÃO" lado direito -->
    <g opacity="${footerP.toFixed(2)}">
      <text x="${W - 80}" y="1380" font-family="'Special Elite',Courier,monospace" font-size="22" fill="${TINTA}" letter-spacing="4" text-anchor="end">PRÓXIMA EDIÇÃO</text>
      <text x="${W - 80}" y="1410" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="44" font-weight="900" fill="${tarjaColor}" stroke="${TINTA}" stroke-width="2" paint-order="stroke fill" text-anchor="end">AMANHÃ</text>
      <text x="${W - 80}" y="1440" font-family="'Special Elite',Courier,monospace" font-size="22" fill="${TINTA}" letter-spacing="4" text-anchor="end">09H BRT</text>
    </g>
  </svg>`;
}

export default {
  intro: buildIntroFrame,
  outro: buildOutroFrame,
};
