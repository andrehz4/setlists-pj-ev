// Slides do carrossel das cápsulas do YouTube: citação e CTA final, só tipografia.
import path from "node:path";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../fontconfig-boot.mjs";
import { sharp, SLIDE_W, SLIDE_H, SLIDES_DIR, escapeXml, hexToRgb, ensureSlidesDir, fundo } from "./base.mjs";
import { fitHeadline, wrapQuote } from "./texto.mjs";

function mixHex(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const c = (k) => Math.round(pa[k] + (pb[k] - pa[k]) * t);
  return `#${[c("r"), c("g"), c("b")].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

// Cores de um slide de cápsula a partir da cor do ciclo: fundo em tom ESCURO da cor (legível pra
// texto branco) e accent na cor viva. O preto do ciclo cai no grafite + vermelho de marca.
export function capsuleColors(cycleColor = "#0a0a0a") {
  const p = hexToRgb(cycleColor);
  const lum = 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
  const veryDark = lum < 40;
  return {
    accent: veryDark ? "#e04b53" : cycleColor,
    bg: veryDark ? "#141821" : mixHex(cycleColor, "#050608", 0.84),
  };
}

async function gravar(svg, bg, destId) {
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);
  const base = await fundo(hexToRgb(bg));
  await sharp(base).composite([{ input: Buffer.from(svg), blend: "over" }]).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, reused: false };
}

// Citação: fundo escuro + aspa decorativa + frase forte + autor + CTA pra legenda/site.
export async function buildQuoteSlide({ quote, author = "Eddie Vedder", cta = "matéria completa na legenda" }, destId, cycleColor = "#0a0a0a") {
  const { bg, accent: ACCENT } = capsuleColors(cycleColor);
  const PAD = 80;
  const boxW = SLIDE_W - PAD * 2;
  const fit = wrapQuote(quote, boxW, 7, 68, 40) || wrapQuote(quote, boxW, 9, 40, 30);
  const blockH = fit.lines.length * fit.lh;
  const startY = Math.round((SLIDE_H - blockH) / 2) + 40; // centrado, um pouco abaixo da aspa
  const spans = fit.lines.map((l, i) => `<tspan x="${PAD}" y="${startY + i * fit.lh}">${escapeXml(l)}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="${bg}"/>
  <text x="${SLIDE_W / 2}" y="62" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28" fill="#ffffff" opacity="0.85" letter-spacing="-0.5">Só Mais um Fã de PEARL JAM</text>
  <text x="${PAD - 6}" y="${startY - 30}" font-family="${F_PLAYFAIR}" font-weight="900" font-size="200" fill="${ACCENT}" opacity="0.9">&#8220;</text>
  <text font-family="${F_PLAYFAIR}" font-weight="700" font-size="${fit.fs}" fill="#ffffff" letter-spacing="-0.3">${spans}</text>
  <text x="${PAD}" y="${startY + blockH + 46}" font-family="${F_INTER_XB}" font-weight="800" font-size="26" fill="${ACCENT}" letter-spacing="1.5">${escapeXml(author.toUpperCase())}</text>
  <rect x="${PAD}" y="${SLIDE_H - 150}" width="${boxW}" height="2" fill="#ffffff" opacity="0.15"/>
  <text x="${PAD}" y="${SLIDE_H - 104}" font-family="${F_INTER_XB}" font-weight="800" font-size="24" fill="#ffffff">→ ${escapeXml(cta)}</text>
  <text x="${PAD}" y="${SLIDE_H - 68}" font-family="${F_INTER_SB}" font-size="21" fill="#ffffff" opacity="0.55" letter-spacing="0.5">somaisumfadepearljam.com.br</text>
</svg>`;
  return gravar(svg, bg, destId);
}

// Slide final: CTA forte pra matéria completa (legenda) + gancho do site.
export async function buildCtaSlide({ hook = "o maior acervo de Pearl Jam do Brasil" } = {}, destId, cycleColor = "#E10600") {
  const cx = SLIDE_W / 2;
  const { bg: DARK, accent: bg } = capsuleColors(cycleColor);
  const hookFit = fitHeadline(hook, SLIDE_W - 140, 2, 60, 42);
  const hookSpans = hookFit.lines.map((l, i) => `<tspan x="${cx}" y="${872 + i * hookFit.lh}">${escapeXml(l)}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="${DARK}"/>
  <text x="${cx}" y="64" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28" fill="#ffffff" opacity="0.85" letter-spacing="-0.5">Só Mais um Fã de PEARL JAM</text>

  <text x="${cx}" y="430" text-anchor="middle" font-family="${F_ANTON}" font-size="128" fill="#ffffff" letter-spacing="0.5">A MATÉRIA</text>
  <text x="${cx}" y="558" text-anchor="middle" font-family="${F_ANTON}" font-size="128" fill="${bg}" letter-spacing="0.5">COMPLETA</text>
  <text x="${cx}" y="632" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="#ffffff" letter-spacing="1">está aqui na legenda deste post  &#8595;</text>

  <rect x="${cx - 90}" y="712" width="180" height="3" fill="#ffffff" opacity="0.2"/>

  <text x="${cx}" y="794" text-anchor="middle" font-family="${F_INTER_SB}" font-size="26" fill="#ffffff" opacity="0.65">explore também</text>
  <text text-anchor="middle" font-family="${F_ANTON}" font-size="${hookFit.fs}" fill="#ffffff" letter-spacing="0.3">${hookSpans}</text>

  <text x="${cx}" y="${SLIDE_H - 150}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${bg}" letter-spacing="1">link no nosso perfil  &#8599;</text>
  <text x="${cx}" y="${SLIDE_H - 96}" text-anchor="middle" font-family="${F_INTER_SB}" font-size="24" fill="#ffffff" opacity="0.7" letter-spacing="0.5">somaisumfadepearljam.com.br</text>
</svg>`;
  return gravar(svg, DARK, destId);
}
