// Gera 5 mockups estaticos da INTRO do story (1080x1920 PNG) pra
// comparar layouts visualmente. Cada um com vibe propria. Output em
// tmp/intro-mockups/. Roda local pra escolher padrao antes de codar
// a animacao definitiva.
//
// Layouts:
//   01-masthead-editorial.png    sobrio, NYT/Guardian de zine
//   02-punk-collage.png          caotico, fita amarela, stencil rotacionado
//   03-brutalist-grid.png        suico, numero gigante, hairlines
//   04-vintage-ticket.png        ingresso de show vintage, perfuracoes
//   05-newspaper-frontpage.png   estilo Folha/Times com Old English

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const W = 1080;
const H = 1920;
const OUT_DIR = path.resolve("tmp/intro-mockups");

// Dados mock fixos pra todos os layouts (mesma data, edicao Nº)
const DATA = {
  day: 13,
  monthShort: "MAI",
  monthLong: "MAIO",
  year: 2026,
  dayOfWeekShort: "QUA",
  dayOfWeekLong: "QUARTA-FEIRA",
  edition: 133, // dayOfYear(2026-05-13)
  itemCount: 5,
  tarjaColor: "#c12727", // vermelho, pra mostrar contraste melhor que preto monotomo
};

function esc(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

// ============ LAYOUT 1: MASTHEAD EDITORIAL ============
// Vibe: jornal sobrio, hierarquia clara, carimbo URGENTE como acento
function buildMastheadEditorial() {
  const { day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = DATA;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="noise1" patternUnits="userSpaceOnUse" width="100" height="100">
        <rect width="100" height="100" fill="#ede4cc"/>
        <circle cx="14" cy="22" r="1.2" fill="#0a0908" opacity="0.08"/>
        <circle cx="58" cy="71" r="0.8" fill="#0a0908" opacity="0.07"/>
        <circle cx="87" cy="18" r="1.0" fill="#0a0908" opacity="0.06"/>
        <circle cx="34" cy="84" r="0.9" fill="#0a0908" opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#noise1)"/>

    <!-- tarjas finas top/bot -->
    <rect x="0" y="0" width="${W}" height="80" fill="${tarjaColor}"/>
    <rect x="0" y="80" width="${W}" height="4" fill="#0a0908"/>
    <rect x="0" y="${H - 84}" width="${W}" height="4" fill="#0a0908"/>
    <rect x="0" y="${H - 80}" width="${W}" height="80" fill="${tarjaColor}"/>

    <!-- brand header dentro da tarja -->
    <text x="60" y="58" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="44" font-weight="900" fill="#f7f1de" stroke="#0a0908" stroke-width="2" paint-order="stroke fill" letter-spacing="8">SMUFDPJ</text>
    <text x="${W - 60}" y="50" font-family="'Special Elite',Courier,monospace" font-size="14" fill="#f7f1de" letter-spacing="3" text-anchor="end" opacity="0.92">SÓ MAIS UM FÃ</text>
    <text x="${W - 60}" y="70" font-family="'Special Elite',Courier,monospace" font-size="14" fill="#f7f1de" letter-spacing="3" text-anchor="end" opacity="0.92">DE PEARL JAM</text>

    <!-- dateline -->
    <text x="${W / 2}" y="180" font-family="'Special Elite',Courier,monospace" font-size="26" fill="#0a0908" letter-spacing="6" text-anchor="middle">EST. 2026  ·  ED. Nº ${edition}  ·  ${dayOfWeekShort}</text>

    <!-- linhas duplas top -->
    <rect x="80" y="220" width="${W - 160}" height="8" fill="#0a0908"/>
    <rect x="80" y="236" width="${W - 160}" height="2" fill="#0a0908"/>

    <!-- masthead serif gigante -->
    <text x="${W / 2}" y="540" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="200" font-weight="900" fill="#0a0908" letter-spacing="-2" text-anchor="middle">SMUFDPJ</text>

    <!-- sub italic -->
    <text x="${W / 2}" y="640" font-family="'Newsreader','Playfair Display','Georgia',serif" font-style="italic" font-size="44" fill="#0a0908" text-anchor="middle">só mais um fã de pearl jam</text>

    <!-- linhas duplas bot -->
    <rect x="80" y="730" width="${W - 160}" height="2" fill="#0a0908"/>
    <rect x="80" y="740" width="${W - 160}" height="8" fill="#0a0908"/>

    <!-- caixa preta com data -->
    <rect x="240" y="900" width="600" height="280" fill="#0a0908"/>
    <text x="${W / 2}" y="1030" font-family="'Newsreader','Playfair Display','Georgia',serif" font-size="120" font-weight="900" fill="#ede4cc" letter-spacing="-2" text-anchor="middle">${day} / ${monthShort}</text>
    <text x="${W / 2}" y="1130" font-family="'Special Elite',Courier,monospace" font-size="38" fill="#ede4cc" letter-spacing="12" text-anchor="middle">${year}</text>

    <!-- carimbo URGENTE rotacionado -->
    <g transform="translate(${W - 280}, 1380) rotate(-8)" opacity="0.92">
      <rect x="-180" y="-50" width="360" height="100" fill="none" stroke="${tarjaColor}" stroke-width="6"/>
      <rect x="-180" y="-50" width="360" height="100" fill="none" stroke="${tarjaColor}" stroke-width="2" transform="translate(6, 6)"/>
      <text x="0" y="20" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="76" font-weight="900" fill="${tarjaColor}" letter-spacing="10" text-anchor="middle">URGENTE</text>
    </g>

    <!-- contagem -->
    <text x="80" y="1550" font-family="'Special Elite',Courier,monospace" font-size="32" fill="#0a0908" letter-spacing="4">↳ ${itemCount} MANCHETES NESTA EDIÇÃO</text>

    <!-- linha rodape -->
    <rect x="80" y="1660" width="${W - 160}" height="4" fill="#0a0908"/>

    <!-- brand footer dentro da tarja inferior -->
    <text x="${W / 2}" y="${H - 35}" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="32" font-weight="900" fill="#f7f1de" stroke="#0a0908" stroke-width="2" paint-order="stroke fill" letter-spacing="6" text-anchor="middle">SETLISTS-PJ-EV.PAGES.DEV</text>
  </svg>`;
}

// ============ LAYOUT 2: PUNK COLLAGE ============
// Vibe: fanzine xerocada DIY, fita amarela rotacionada, stencil quebrado
function buildPunkCollage() {
  const { day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = DATA;
  // SMUFDPJ letra a letra com rotacao individual
  const letters = "SMUFDPJ".split("");
  const lettersSvg = letters.map((l, i) => {
    const rot = ((i % 2 ? 1 : -1) * (2 + (i * 7) % 4));
    const dx = i * 130;
    const dy = (i % 3) * 8;
    return `<g transform="translate(${110 + dx}, ${720 + dy}) rotate(${rot})">
      <text x="0" y="0" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="180" font-weight="900" fill="#0a0908" stroke="#ede4cc" stroke-width="3" paint-order="stroke fill">${l}</text>
    </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="noise2" patternUnits="userSpaceOnUse" width="60" height="60">
        <rect width="60" height="60" fill="#dfd3b5"/>
        <circle cx="8" cy="14" r="1" fill="#0a0908" opacity="0.18"/>
        <circle cx="38" cy="44" r="0.7" fill="#0a0908" opacity="0.15"/>
        <circle cx="52" cy="9" r="1.1" fill="#0a0908" opacity="0.2"/>
        <circle cx="22" cy="51" r="0.6" fill="#0a0908" opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#noise2)"/>

    <!-- borda superior rasgada (zigzag) -->
    <path d="M0,0 L0,30 L60,18 L120,32 L180,16 L240,30 L300,14 L360,32 L420,18 L480,30 L540,14 L600,28 L660,18 L720,30 L780,14 L840,30 L900,16 L960,28 L1020,14 L1080,30 L1080,0 Z" fill="#0a0908"/>

    <!-- fita amarela diagonal -->
    <g transform="translate(0, 240) rotate(-8)">
      <rect x="-80" y="-50" width="1200" height="100" fill="#f0c020" stroke="#0a0908" stroke-width="3" opacity="0.92"/>
      <text x="600" y="22" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="64" font-weight="900" fill="#0a0908" letter-spacing="8" text-anchor="middle">EDIÇÃO Nº ${edition} · ${dayOfWeekShort}</text>
    </g>

    <!-- segunda fita rotacao oposta -->
    <g transform="translate(0, 380) rotate(4)">
      <rect x="-80" y="-30" width="1200" height="60" fill="#0a0908" stroke="#0a0908" stroke-width="2" opacity="0.88"/>
      <text x="540" y="20" font-family="'Special Elite',Courier,monospace" font-size="32" fill="#f0c020" letter-spacing="6" text-anchor="middle">ZINE DIÁRIO DO PEARL JAM</text>
    </g>

    <!-- SMUFDPJ letra a letra rotacionada -->
    ${lettersSvg}

    <!-- caixa data rotacionada gigante -->
    <g transform="translate(${W / 2}, 1180) rotate(-4)">
      <rect x="-380" y="-130" width="760" height="260" fill="#0a0908" stroke="${tarjaColor}" stroke-width="6"/>
      <text x="0" y="-30" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="44" font-weight="900" fill="#f0c020" letter-spacing="14" text-anchor="middle">${dayOfWeekShort}</text>
      <text x="0" y="60" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="160" font-weight="900" fill="#ede4cc" letter-spacing="6" text-anchor="middle">${day} ${monthShort}</text>
      <text x="0" y="100" font-family="'Special Elite',Courier,monospace" font-size="28" fill="${tarjaColor}" letter-spacing="10" text-anchor="middle">/ ${year} /</text>
    </g>

    <!-- carimbo URGENTE circular rotacionado -->
    <g transform="translate(${W - 200}, 1480) rotate(-15)">
      <circle cx="0" cy="0" r="120" fill="none" stroke="${tarjaColor}" stroke-width="8"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="${tarjaColor}" stroke-width="3"/>
      <text x="0" y="-20" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="36" font-weight="900" fill="${tarjaColor}" letter-spacing="4" text-anchor="middle">EDIÇÃO</text>
      <text x="0" y="30" font-family="'Big Shoulders Stencil Display','Arial Path Black',Impact,sans-serif" font-size="60" font-weight="900" fill="${tarjaColor}" letter-spacing="2" text-anchor="middle">DIÁRIA</text>
    </g>

    <!-- decoradores manuais -->
    <text x="80" y="1620" font-family="'Special Elite',Courier,monospace" font-size="42" fill="#0a0908" letter-spacing="6">✘  ✘  ✘  ${itemCount} MANCHETES  ✘  ✘  ✘</text>

    <!-- borda inferior rasgada -->
    <path d="M0,${H} L0,${H - 30} L60,${H - 18} L120,${H - 32} L180,${H - 16} L240,${H - 30} L300,${H - 14} L360,${H - 32} L420,${H - 18} L480,${H - 30} L540,${H - 14} L600,${H - 28} L660,${H - 18} L720,${H - 30} L780,${H - 14} L840,${H - 30} L900,${H - 16} L960,${H - 28} L1020,${H - 14} L1080,${H - 30} L1080,${H} Z" fill="#0a0908"/>
  </svg>`;
}

// ============ LAYOUT 3: BRUTALIST GRID ============
// Vibe: design suico moderno, numero gigante, hairlines, assimetria
function buildBrutalistGrid() {
  const { day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = DATA;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#f5f3ec"/>

    <!-- hairline grid sutil -->
    <g stroke="#0a0908" stroke-width="0.5" opacity="0.08">
      <line x1="0" y1="160" x2="${W}" y2="160"/>
      <line x1="0" y1="${H - 160}" x2="${W}" y2="${H - 160}"/>
      <line x1="${W / 3}" y1="0" x2="${W / 3}" y2="${H}"/>
      <line x1="${2 * W / 3}" y1="0" x2="${2 * W / 3}" y2="${H}"/>
    </g>

    <!-- numero gigante 133 sangrando -->
    <text x="${W + 60}" y="1240" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="900" font-weight="900" fill="#0a0908" letter-spacing="-40" text-anchor="end" opacity="0.95">${edition}</text>

    <!-- mini barra accent vermelha vertical esquerda -->
    <rect x="60" y="160" width="6" height="${H - 320}" fill="${tarjaColor}"/>

    <!-- header brutalista -->
    <text x="100" y="240" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="22" font-weight="700" fill="#0a0908" letter-spacing="8">SMUFDPJ — EDITION FILE</text>
    <line x1="100" y1="260" x2="${W - 100}" y2="260" stroke="#0a0908" stroke-width="1"/>

    <!-- meta -->
    <text x="100" y="320" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="16" fill="#0a0908" letter-spacing="3" opacity="0.7">N° / 0${edition}</text>
    <text x="100" y="350" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="16" fill="#0a0908" letter-spacing="3" opacity="0.7">DATE / ${day}.0${MONTH_NUM(monthShort)}.${year}</text>
    <text x="100" y="380" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="16" fill="#0a0908" letter-spacing="3" opacity="0.7">DAY / ${dayOfWeekShort}</text>
    <text x="100" y="410" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="16" fill="#0a0908" letter-spacing="3" opacity="0.7">ITEMS / 0${itemCount}</text>

    <!-- titulo principal SMUFDPJ rotation 90 lateral -->
    <g transform="translate(140, 1500) rotate(-90)">
      <text x="0" y="0" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="220" font-weight="900" fill="#0a0908" letter-spacing="-8">SMUFDPJ</text>
    </g>

    <!-- bloco accent vermelho com NOTICIAS -->
    <g transform="translate(0, 1620)">
      <rect x="0" y="0" width="${W}" height="180" fill="${tarjaColor}"/>
      <text x="100" y="80" font-family="'Helvetica Neue','Helvetica','Arial Black',sans-serif" font-size="80" font-weight="900" fill="#ede4cc" letter-spacing="-2">NOTÍCIAS</text>
      <text x="100" y="140" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="22" fill="#ede4cc" letter-spacing="8">DO DIA / EDIÇÃO ${edition} / ${dayOfWeekShort}</text>
    </g>

    <!-- contagem inferior -->
    <text x="${W - 100}" y="${H - 60}" font-family="'Helvetica Neue','Helvetica',sans-serif" font-size="14" fill="#0a0908" letter-spacing="4" text-anchor="end" opacity="0.6">PG. 01 OF 0${itemCount}</text>
  </svg>`;
}

// helper pro brutalist
function MONTH_NUM(short) {
  const map = { JAN:"1", FEV:"2", MAR:"3", ABR:"4", MAI:"5", JUN:"6", JUL:"7", AGO:"8", SET:"9", OUT:"10", NOV:"11", DEZ:"12" };
  return map[short] || "5";
}

// ============ LAYOUT 4: VINTAGE TICKET ============
// Vibe: ingresso de show antigo, bordas perfuradas, deco
function buildVintageTicket() {
  const { day, monthShort, year, dayOfWeekShort, edition, itemCount, tarjaColor } = DATA;
  // serie de circulos pra perfuração lateral
  const perfsLeft = Array.from({ length: 24 }, (_, i) => `<circle cx="35" cy="${100 + i * 76}" r="14" fill="#dfc580"/>`).join("");
  const perfsRight = Array.from({ length: 24 }, (_, i) => `<circle cx="${W - 35}" cy="${100 + i * 76}" r="14" fill="#dfc580"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="paper4" patternUnits="userSpaceOnUse" width="80" height="80">
        <rect width="80" height="80" fill="#e8c97a"/>
        <circle cx="10" cy="18" r="1.5" fill="#7a5a1c" opacity="0.18"/>
        <circle cx="50" cy="55" r="1.2" fill="#7a5a1c" opacity="0.15"/>
        <circle cx="68" cy="22" r="1.4" fill="#7a5a1c" opacity="0.16"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#paper4)"/>

    <!-- linha tracejada vertical das perfuracoes -->
    ${perfsLeft}
    ${perfsRight}
    <line x1="80" y1="80" x2="80" y2="${H - 80}" stroke="#7a5a1c" stroke-width="2" stroke-dasharray="8 6" opacity="0.5"/>
    <line x1="${W - 80}" y1="80" x2="${W - 80}" y2="${H - 80}" stroke="#7a5a1c" stroke-width="2" stroke-dasharray="8 6" opacity="0.5"/>

    <!-- header ADMIT ONE -->
    <text x="${W / 2}" y="260" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="80" font-weight="900" fill="${tarjaColor}" stroke="#0a0908" stroke-width="3" paint-order="stroke fill" letter-spacing="14" text-anchor="middle">ADMIT ONE</text>
    <text x="${W / 2}" y="320" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="36" fill="#0a0908" text-anchor="middle">daily news bulletin</text>

    <!-- linha deco dupla -->
    <line x1="180" y1="370" x2="${W - 180}" y2="370" stroke="#0a0908" stroke-width="4"/>
    <line x1="180" y1="385" x2="${W - 180}" y2="385" stroke="#0a0908" stroke-width="2"/>

    <!-- SERIE Nº rotated badge -->
    <g transform="translate(${W - 220}, 480) rotate(-6)">
      <rect x="-100" y="-30" width="200" height="60" fill="${tarjaColor}"/>
      <text x="0" y="14" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="40" font-weight="900" fill="#ede4cc" letter-spacing="6" text-anchor="middle">Nº 0${edition}</text>
    </g>

    <!-- SMUFDPJ central serif elegante -->
    <text x="${W / 2}" y="780" font-family="'Newsreader','Georgia',serif" font-size="160" font-weight="900" fill="#0a0908" letter-spacing="-2" text-anchor="middle">SMUFDPJ</text>
    <text x="${W / 2}" y="850" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="32" fill="#0a0908" text-anchor="middle">só mais um fã de pearl jam</text>

    <!-- linha deco -->
    <line x1="180" y1="930" x2="${W - 180}" y2="930" stroke="#0a0908" stroke-width="2"/>
    <line x1="180" y1="945" x2="${W - 180}" y2="945" stroke="#0a0908" stroke-width="4"/>

    <!-- bloco data formato ticket -->
    <g transform="translate(${W / 2}, 1080)">
      <text x="0" y="0" font-family="'Special Elite',Courier,monospace" font-size="38" fill="#0a0908" letter-spacing="14" text-anchor="middle">${dayOfWeekShort}  ·  ${day} ${monthShort}  ·  ${year}</text>
    </g>

    <!-- ornamento estrelas vintage -->
    <text x="${W / 2}" y="1200" font-family="'Special Elite',Courier,monospace" font-size="42" fill="#0a0908" letter-spacing="20" text-anchor="middle">★  ★  ★  ★  ★</text>

    <!-- carimbo PRESS rotacionado -->
    <g transform="translate(220, 1350) rotate(-12)">
      <rect x="-140" y="-40" width="280" height="80" fill="${tarjaColor}" opacity="0.92"/>
      <rect x="-140" y="-40" width="280" height="80" fill="none" stroke="#0a0908" stroke-width="2" transform="translate(4, 4)"/>
      <text x="0" y="16" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="56" font-weight="900" fill="#ede4cc" letter-spacing="8" text-anchor="middle">PRESS</text>
    </g>

    <!-- valid for -->
    <text x="${W / 2}" y="1550" font-family="'Special Elite',Courier,monospace" font-size="22" fill="#0a0908" letter-spacing="6" text-anchor="middle">VALID FOR 24 HOURS  ·  NON-REFUNDABLE</text>

    <!-- linha deco rodape -->
    <line x1="180" y1="1620" x2="${W - 180}" y2="1620" stroke="#0a0908" stroke-width="3"/>

    <!-- footer -->
    <text x="${W / 2}" y="${H - 100}" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="28" fill="#0a0908" text-anchor="middle">setlists-pj-ev.pages.dev</text>
  </svg>`;
}

// ============ LAYOUT 5: NEWSPAPER FRONT PAGE ============
// Vibe: Folha/Times anos 70, Blackletter masthead, drop cap, EXTRA
function buildNewspaperFrontpage() {
  const { day, monthShort, monthLong, year, dayOfWeekShort, dayOfWeekLong, edition, itemCount, tarjaColor } = DATA;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="paper5" patternUnits="userSpaceOnUse" width="120" height="120">
        <rect width="120" height="120" fill="#ece2c4"/>
        <circle cx="20" cy="30" r="1.2" fill="#5a4a1c" opacity="0.1"/>
        <circle cx="80" cy="80" r="0.9" fill="#5a4a1c" opacity="0.08"/>
        <circle cx="100" cy="20" r="1.1" fill="#5a4a1c" opacity="0.09"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#paper5)"/>

    <!-- top linha tripla -->
    <rect x="40" y="60" width="${W - 80}" height="3" fill="#0a0908"/>
    <rect x="40" y="68" width="${W - 80}" height="1" fill="#0a0908"/>
    <rect x="40" y="73" width="${W - 80}" height="3" fill="#0a0908"/>

    <!-- dateline 3 colunas -->
    <text x="60" y="110" font-family="'Newsreader','Georgia',serif" font-size="22" fill="#0a0908" letter-spacing="2">VOL. I · Nº 0${edition}</text>
    <text x="${W / 2}" y="110" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="22" fill="#0a0908" text-anchor="middle">TODAS AS NOTÍCIAS</text>
    <text x="${W - 60}" y="110" font-family="'Newsreader','Georgia',serif" font-size="22" fill="#0a0908" text-anchor="end">PREÇO: GRATIS</text>

    <!-- masthead style Old English -->
    <text x="${W / 2}" y="290" font-family="'UnifrakturCook','Old English Text MT','Blackletter','Times New Roman',serif" font-size="160" font-weight="900" fill="#0a0908" text-anchor="middle">The SMUFDPJ Times</text>

    <!-- tagline -->
    <text x="${W / 2}" y="360" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="32" fill="#0a0908" text-anchor="middle">"Só mais um fã de Pearl Jam, mas com prensa rotativa"</text>

    <!-- linha tripla pos masthead -->
    <rect x="40" y="410" width="${W - 80}" height="3" fill="#0a0908"/>
    <rect x="40" y="418" width="${W - 80}" height="1" fill="#0a0908"/>
    <rect x="40" y="423" width="${W - 80}" height="3" fill="#0a0908"/>

    <!-- dateline central pos linha -->
    <text x="${W / 2}" y="480" font-family="'Special Elite',Courier,monospace" font-size="26" fill="#0a0908" letter-spacing="8" text-anchor="middle">${dayOfWeekLong.toUpperCase()},  ${day} DE ${monthLong} DE ${year}</text>

    <!-- 2 colunas: drop cap + texto + EXTRA -->
    <text x="80" y="700" font-family="'Newsreader','Georgia',serif" font-size="180" font-weight="900" fill="#0a0908">N</text>
    <text x="240" y="640" font-family="'Newsreader','Georgia',serif" font-size="34" font-weight="900" fill="#0a0908" letter-spacing="-1">esta edição</text>
    <text x="240" y="690" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908">cinco manchetes que</text>
    <text x="240" y="725" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908">dominaram o dia, do</text>
    <text x="240" y="760" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908">Ohana 2026 a um fã</text>
    <text x="240" y="795" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908">pintando o Eddie em</text>
    <text x="240" y="830" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908">acrílico 13x19.</text>

    <!-- carimbo EXTRA rotacionado gigante -->
    <g transform="translate(${W - 240}, 1080) rotate(-14)">
      <rect x="-200" y="-90" width="400" height="180" fill="${tarjaColor}" opacity="0.94"/>
      <rect x="-200" y="-90" width="400" height="180" fill="none" stroke="#0a0908" stroke-width="3" transform="translate(8, 8)"/>
      <text x="0" y="40" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="150" font-weight="900" fill="#ede4cc" letter-spacing="6" text-anchor="middle">EXTRA!</text>
    </g>

    <!-- segunda linha tripla -->
    <rect x="40" y="1340" width="${W - 80}" height="3" fill="#0a0908"/>
    <rect x="40" y="1348" width="${W - 80}" height="1" fill="#0a0908"/>
    <rect x="40" y="1353" width="${W - 80}" height="3" fill="#0a0908"/>

    <!-- mini headlines pseudo-jornal -->
    <text x="60" y="1430" font-family="'Newsreader','Georgia',serif" font-size="30" font-weight="900" fill="#0a0908">·  Ohana 2026 confirma Eddie e Pearl Jam</text>
    <text x="60" y="1480" font-family="'Newsreader','Georgia',serif" font-size="30" font-weight="900" fill="#0a0908">·  Mike McCready anuncia rock-ópera</text>
    <text x="60" y="1530" font-family="'Newsreader','Georgia',serif" font-size="30" font-weight="900" fill="#0a0908">·  Fã pinta retrato do Eddie em acrílico</text>
    <text x="60" y="1580" font-family="'Newsreader','Georgia',serif" font-size="30" font-weight="900" fill="#0a0908">·  Yungblud cita Eddie como inspiração</text>
    <text x="60" y="1630" font-family="'Newsreader','Georgia',serif" font-size="30" font-weight="900" fill="#0a0908">·  'Who You Are' e o paradoxo dos charts</text>

    <!-- linha tripla rodape -->
    <rect x="40" y="${H - 110}" width="${W - 80}" height="3" fill="#0a0908"/>
    <rect x="40" y="${H - 102}" width="${W - 80}" height="1" fill="#0a0908"/>
    <rect x="40" y="${H - 97}" width="${W - 80}" height="3" fill="#0a0908"/>

    <!-- footer -->
    <text x="${W / 2}" y="${H - 50}" font-family="'Newsreader','Georgia',serif" font-style="italic" font-size="26" fill="#0a0908" text-anchor="middle">edição completa: setlists-pj-ev.pages.dev  ·  @smufdpj</text>
  </svg>`;
}

// ============ render ============

const LAYOUTS = [
  { name: "01-masthead-editorial", build: buildMastheadEditorial, label: "MASTHEAD EDITORIAL (sóbrio)" },
  { name: "02-punk-collage", build: buildPunkCollage, label: "PUNK COLLAGE (caótico)" },
  { name: "03-brutalist-grid", build: buildBrutalistGrid, label: "BRUTALIST GRID (suíço)" },
  { name: "04-vintage-ticket", build: buildVintageTicket, label: "VINTAGE TICKET (ingresso)" },
  { name: "05-newspaper-frontpage", build: buildNewspaperFrontpage, label: "NEWSPAPER FRONT PAGE (Folha/Times)" },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`[mockups] gerando 5 layouts em ${OUT_DIR}`);
  await Promise.all(LAYOUTS.map(async (lt) => {
    const svg = lt.build();
    const dest = path.join(OUT_DIR, `${lt.name}.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toFile(dest);
    console.log(`  ✓ ${lt.name}.png  -  ${lt.label}`);
  }));
  console.log(`[mockups] FIM. abre ${OUT_DIR} pra comparar.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
