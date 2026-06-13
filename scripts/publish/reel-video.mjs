// Gerador do REEL SEMANAL 1080x1920 (MP4) do @smufdpj. Implementa o
// MOTION-SPEC aprovado no Claude Design (design-handoff/retorno/movie/
// project/entrega/MOTION-SPEC.md): cold open 3.0s + N blocos de 4.5s
// (cinetico | card | papel) + outro 2.5s, cortes secos, 30fps.
//
// Arquitetura por SEGMENTO (diferente do story, que e uma sequencia unica
// de PNGs): cada cena vira um MP4 proprio e o ffmpeg concatena (-c copy).
// Isso permite cenas com fundo de CLIPE REAL (trecho mudo do acervo
// media/reels-clips/): nessas, os frames sao overlays PNG com ALPHA que o
// ffmpeg compoe sobre o video (scale/crop 9:16 + overlay). Cenas sem clipe
// degradam pra foto com zoom (Ken Burns) ou fundo fantasma "CLIPE", iguais
// ao prototipo aprovado.
//
// Regra de ouro herdada do spec: toda animacao e funcao deterministica do
// tempo local da cena. Nada de random, estado acumulado ou filtros.

import { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./fontconfig-boot.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import sharp from "sharp";
import got from "got";
import { loadBadgeAnimated } from "./story-video.mjs";

const W = 1080;
const H = 1920;
const FPS = 30;

export const COLD_DUR = 3.0;
export const BLOCK_DUR = 4.5;
export const OUTRO_DUR = 2.5;

const F_TYPEWRITER = "'Special Elite',Courier,monospace";

const BRAND = {
  creme: "#ede4cc",
  ink: "#0a0908",
  sujo: "#f7f1de",
  wordmark: "Só Mais um Fã de PEARL JAM",
  handle: "@smufdpj",
  site: "setlists-pj-ev.pages.dev",
};

const TAG_LABELS = {
  turne: "TURNÊ", lancamento: "LANÇAMENTO", tenclub: "TEN CLUB",
  memoria: "MEMÓRIA", br: "BRASIL", bootleg: "BOOTLEG",
  comunidade: "COMUNIDADE", eddie: "EDDIE", mike: "MIKE",
  stone: "STONE", jeff: "JEFF", matt: "MATT", boom: "BOOM",
  josh: "JOSH", loja: "LOJA",
};

// ============ easings (definicao identica ao spec/animations.jsx) ============
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const linear = (t) => clamp01(t);
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutQuart = (t) => 1 - Math.pow(1 - clamp01(t), 4);
const easeOutQuad = (t) => { const x = clamp01(t); return 1 - (1 - x) * (1 - x); };
const easeInCubic = (t) => Math.pow(clamp01(t), 3);
const easeOutBack = (t) => { const x = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t, start, dur, ease = easeOutCubic) => ease(clamp01((t - start) / dur));

// ============ util ============
function escapeXml(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

// Medicao REAL de texto: renderiza a string com sharp e mede o ink via
// trim. Estimar largura por char nao funciona (Anton renderizado e mais
// largo que a estimativa e as palavras se sobrepoem). Cache por chave.
const _measureCache = new Map();
export async function measureText(text, { size, family = F_ANTON, weight = null, italic = false, letterSpacing = 0 } = {}) {
  const key = [text, size, family, weight, italic, letterSpacing].join("|");
  if (_measureCache.has(key)) return _measureCache.get(key);
  const pad = Math.ceil(size);
  const cw = Math.ceil(String(text).length * size * 1.4) + pad * 2;
  const ch = Math.ceil(size * 2.2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><text x="${pad}" y="${Math.round(size * 1.3)}" font-family="${family}"${weight ? ` font-weight="${weight}"` : ""}${italic ? ` font-style="italic"` : ""} font-size="${size}"${letterSpacing ? ` letter-spacing="${letterSpacing}"` : ""} fill="#fff">${escapeXml(text)}</text></svg>`;
  let width;
  try {
    const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
    width = info.width;
  } catch {
    width = Math.ceil(String(text).length * size * 0.55);
  }
  _measureCache.set(key, width);
  return width;
}

// Wrap de palavras (fallback sincrono por estimativa, usado nos testes e
// quando nao ha layout medido). Gap de 0.24em entre palavras (spec).
export function wrapWords(text, size, maxWidth, widths = null) {
  const charW = size * 0.5;
  const gap = Math.round(size * 0.24);
  const words = String(text || "").toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [];
  let curW = 0;
  words.forEach((w, i) => {
    const ww = widths ? widths[i] : w.length * charW;
    const next = curW === 0 ? ww : curW + gap + ww;
    if (cur.length && next > maxWidth) {
      lines.push(cur);
      cur = [{ text: w, x: 0, w: ww }];
      curW = ww;
    } else {
      cur.push({ text: w, x: curW === 0 ? 0 : curW + gap, w: ww });
      curW = next;
    }
  });
  if (cur.length) lines.push(cur);
  return lines;
}

// Layout medido: mesma saida do wrapWords, com larguras reais por palavra.
export async function layoutWords(text, size, maxWidth) {
  const words = String(text || "").toUpperCase().split(/\s+/).filter(Boolean);
  const widths = [];
  for (const w of words) widths.push(await measureText(w, { size, family: F_ANTON }));
  return wrapWords(text, size, maxWidth, widths);
}

// ============ atomos recorrentes (SVG) ============

function wordmarkSvg(t, color, inAt = 0.3) {
  const o = seg(t, inAt, 0.3, easeOutQuad);
  if (o <= 0) return "";
  return `<text x="${W / 2}" y="${64 + 34 * 0.8}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="34" fill="${color}" opacity="${o.toFixed(3)}">${escapeXml(BRAND.wordmark)}</text>`;
}

function counterSvg(t, n, total, color, inAt = 0.1) {
  const e = seg(t, inAt, 0.3, easeOutCubic);
  if (e <= 0) return "";
  const label = `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return `<text x="${W - 60}" y="${(62 + 32 * 0.8 - 24 * (1 - e)).toFixed(1)}" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="32" letter-spacing="2.5" fill="${color}" opacity="${e.toFixed(3)}">${label}</text>`;
}

// Chip "CLIPE · MUDO" com bolinha vermelha piscando (step de 0.5s).
function clipChipSvg(t, { inAt = 0.12, place = "top", textW = null } = {}) {
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
function tarjaSvg(t, { text, bg, color, x, y, size = 30, inAt = 0.15, dur = 0.3, id, centerAt = null, textW = null }) {
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
function kineticWordsSvg(t, { text, size, color, x, y, maxWidth = 920, inAt = 0.5, stagger = 0.11, dur = 0.38, idPrefix, layout = null }) {
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
const veilSvg = (dark) => dark > 0 ? `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(10,9,8,${dark})"/>` : "";

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

// BLOCO CINETICO: tarja + manchete palavra a palavra sobre clipe/foto/fantasma.
export function kineticSvg(t, { item, n, total, accent, dark = 0.68, ghost = false, layout = null, tarjaTextW = null, chipTextW = null, showChip = true }) {
  const size = (item.title_pt || "").length > 60 ? 94 : 112;
  const xe = seg(t, 4.18, 0.32, easeInCubic);
  const words = kineticWordsSvg(t, {
    text: item.title_pt || "", size, color: BRAND.sujo,
    x: 60, y: 664, maxWidth: 920, inAt: 0.5, stagger: 0.11, dur: 0.38,
    idPrefix: `kin-${n}`, layout,
  });
  const tag = TAG_LABELS[item.tags?.[0]] || String(item.tags?.[0] || "NOTÍCIA").toUpperCase();

  // fundo fantasma (sem clipe e sem foto): listras + CLIPE outline derivando
  const drift = -24 + 48 * linear(t / BLOCK_DUR);
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
export function cardSvg(t, { item, n, total, accent, layout = null, tarjaTextW = null }) {
  const size = (item.title_pt || "").length > 60 ? 66 : 78;
  const lines = layout || wrapWords(item.title_pt || "", size, 880);
  const lh = Math.round(size * 1.06);
  const xe = seg(t, 4.2, 0.3, easeInCubic);
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

// Textura papel xerox (linhas sutis de tinta).
function paperBgSvg(idPrefix) {
  return `<rect x="0" y="0" width="${W}" height="${H}" fill="${BRAND.creme}"/>
    <defs>
      <pattern id="${idPrefix}-ph" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="rgba(10,9,8,0.02)"/></pattern>
      <pattern id="${idPrefix}-pv" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="3" height="9" fill="rgba(10,9,8,0.014)"/></pattern>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${idPrefix}-ph)"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${idPrefix}-pv)"/>`;
}

// BLOCO PAPEL: digesto da comunidade, snapshot colado inclinado + manchete em tinta.
export function paperSvg(t, { item, n, total, accent, photoDataUri = null, layout = null, tarjaTextW = null }) {
  const size = (item.title_pt || "").length > 56 ? 88 : 100;
  const xe = seg(t, 4.18, 0.32, easeInCubic);
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

// ============ plano de cenas ============

// items: saida do reel-select (com .format). Devolve a lista de cenas com
// inicio/duracao, pro render e pro thumb_offset.
export function buildScenePlan(items) {
  const scenes = [{ kind: "coldopen", start: 0, dur: COLD_DUR }];
  let cursor = COLD_DUR;
  items.forEach((item, i) => {
    scenes.push({ kind: item.format, item, n: i + 1, start: cursor, dur: BLOCK_DUR });
    cursor += BLOCK_DUR;
  });
  scenes.push({ kind: "outro", start: cursor, dur: OUTRO_DUR });
  return { scenes, totalS: cursor + OUTRO_DUR, totalFrames: Math.round((cursor + OUTRO_DUR) * FPS) };
}

// Momento da capa (thumb_offset): 1o bloco com a manchete ja montada.
export function thumbOffsetMsFor() {
  return Math.round((COLD_DUR + 2.5) * 1000);
}

// ============ fundos ============

async function fetchImageBuffer(item) {
  if (item?.img && item.img.startsWith("/media/news/img/")) {
    const local = path.join(process.cwd(), item.img.replace(/^\//, ""));
    try {
      const buf = await fs.readFile(local);
      if (buf.length > 1024) return buf;
    } catch {}
  }
  const src = item?.img || item?.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try {
      return await got(src, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
    } catch {}
  }
  try {
    const hex = String(item?.id || "").replace(/[^0-9a-f]/gi, "")[0] || "0";
    const n = (parseInt(hex, 16) % 4) + 1;
    const buf = await fs.readFile(path.join(process.cwd(), `media/news/img/_band-fallback-${n}.jpg`));
    if (buf && buf.length > 1024) return buf;
  } catch {}
  return null;
}

// Base pro Ken Burns: foto cover em W*Z x H*Z. Por frame, extrai a janela
// central correspondente ao zoom(t) e redimensiona pra W x H.
async function prepareZoomBase(buf, maxZoom) {
  const bw = Math.round(W * maxZoom);
  const bh = Math.round(H * maxZoom);
  const base = await sharp(buf, { failOn: "none" })
    .resize(bw, bh, { fit: "cover", position: "attention" })
    .sharpen(1.05)
    .jpeg({ quality: 92 })
    .toBuffer();
  return { base, bw, bh, maxZoom };
}

function zoomWindow({ bw, bh, maxZoom }, scale) {
  const winW = Math.min(bw, Math.round((W * maxZoom) / scale));
  const winH = Math.min(bh, Math.round((H * maxZoom) / scale));
  return { left: Math.floor((bw - winW) / 2), top: Math.floor((bh - winH) / 2), width: winW, height: winH };
}

// ============ ffmpeg ============

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-2000)}`)));
  });
}

const X264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "main", "-level", "4.0", "-preset", "medium", "-crf", "18", "-r", String(FPS)];

async function encodePngSegment({ framesDir, outPath }) {
  await runFfmpeg(["-y", "-framerate", String(FPS), "-i", path.join(framesDir, "f_%05d.png"), ...X264, "-an", outPath]);
}

async function encodeClipSegment({ clipPath, overlayDir, dur, outPath }) {
  await runFfmpeg([
    "-y",
    "-stream_loop", "-1", "-t", String(dur + 0.5), "-i", clipPath,
    "-framerate", String(FPS), "-i", path.join(overlayDir, "f_%05d.png"),
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1[bg];[bg][1:v]overlay=0:0:shortest=1[v]`,
    "-map", "[v]", "-an", "-t", String(dur), ...X264, outPath,
  ]);
}

// ============ orquestracao ============

// Render paralelo de frames de uma cena (mesma estrategia de pool do story).
async function renderScene({ scene, total, accent, ctx, dir, concurrency = 8 }) {
  const frames = Math.round(scene.dur * FPS);
  await fs.mkdir(dir, { recursive: true });

  async function renderFrame(idx) {
    const t = idx / FPS;
    const dest = path.join(dir, `f_${String(idx).padStart(5, "0")}.png`);
    let svg;
    if (scene.kind === "coldopen") {
      svg = coldOpenSvg(t, {
        accent, itemCount: total, rangeLabel: ctx.rangeLabel, dark: 0.6,
        letterWidths: ctx.letterWidths, tarjaTextW: ctx.tarjaTextW, chipTextW: ctx.chipTextW,
        showChip: ctx.mode === "overlay" || ctx.ghost === true,
      });
    } else if (scene.kind === "outro") {
      const bf = ctx.badge?.frames?.length
        ? ctx.badge.frames[Math.floor(t * (ctx.badge.fps || 1)) % ctx.badge.frames.length]
        : null;
      svg = outroSvg(t, { accent, badgeFrame: bf, siteTextW: ctx.siteTextW });
    } else if (scene.kind === "paper") {
      svg = paperSvg(t, { item: scene.item, n: scene.n, total, accent, photoDataUri: ctx.photoDataUri, layout: ctx.layout, tarjaTextW: ctx.tarjaTextW });
    } else if (scene.kind === "card") {
      svg = cardSvg(t, { item: scene.item, n: scene.n, total, accent, layout: ctx.layout, tarjaTextW: ctx.tarjaTextW });
    } else {
      svg = kineticSvg(t, {
        item: scene.item, n: scene.n, total, accent, ghost: ctx.ghost === true,
        layout: ctx.layout, tarjaTextW: ctx.tarjaTextW, chipTextW: ctx.chipTextW,
        showChip: ctx.mode === "overlay" || ctx.ghost === true,
      });
    }

    if (ctx.mode === "overlay" || ctx.mode === "flat") {
      // overlay: PNG RGBA puro (ffmpeg compoe sobre o clipe); flat: SVG opaco
      await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toFile(dest);
      return;
    }
    // mode photo: Ken Burns por frame + (card) wipe de entrada
    const scale = ctx.zoomFrom + (ctx.zoomTo - ctx.zoomFrom) * linear(t / scene.dur);
    const win = zoomWindow(ctx.zoom, scale);
    let pipe = sharp(ctx.zoom.base).extract(win).resize(W, H);
    const composites = [];
    if (scene.kind === "card") {
      const wipe = easeOutQuart(clamp01(t / 0.45));
      if (wipe < 1) {
        const wipeW = Math.max(2, Math.round(W * wipe));
        const photoStrip = await pipe.extract({ left: 0, top: 0, width: wipeW, height: H }).toBuffer();
        pipe = sharp({ create: { width: W, height: H, channels: 3, background: { r: 10, g: 9, b: 8 } } });
        composites.push({ input: photoStrip, left: 0, top: 0 });
      }
    }
    composites.push({ input: Buffer.from(svg), blend: "over" });
    await pipe.composite(composites).png({ compressionLevel: 6 }).toFile(dest);
  }

  let next = 0;
  async function worker() {
    while (next < frames) {
      const my = next++;
      await renderFrame(my);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return frames;
}

// Monta o MP4 final. items = saida do reel-select; clipFor = mapa opcional
// sceneIndex -> caminho de clipe (decidido pelo orquestrador via reel-clips).
export async function buildReelVideo({
  items, trackPath, accent, rangeLabel, outPath,
  clipForScene = new Map(), tmpDir, concurrency = 8,
} = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("buildReelVideo: items vazio");
  if (!trackPath) throw new Error("buildReelVideo: trackPath obrigatorio");

  const { scenes, totalS, totalFrames } = buildScenePlan(items);
  const total = items.length;
  tmpDir = tmpDir || await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-reel-"));
  await fs.mkdir(tmpDir, { recursive: true });

  const badge = await loadBadgeAnimated();
  console.log(`[reel-video] ${scenes.length} cenas, ${totalS.toFixed(1)}s, ${totalFrames} frames @${FPS}fps, accent=${accent}`);

  const segPaths = [];
  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si];
    const dir = path.join(tmpDir, `scene_${String(si).padStart(2, "0")}`);
    const segPath = path.join(tmpDir, `seg_${String(si).padStart(2, "0")}.mp4`);
    const clipPath = clipForScene.get(si) || null;

    const ctx = { rangeLabel, badge, mode: "flat" };

    // medidas reais de texto (uma vez por cena; cache cobre repeticoes)
    ctx.chipTextW = await measureText("CLIPE · MUDO", { size: 24, family: F_INTER_SB, weight: 600, letterSpacing: 3.4 });
    if (scene.item) {
      const tagLabel = TAG_LABELS[scene.item.tags?.[0]] || String(scene.item.tags?.[0] || "NOTÍCIA").toUpperCase();
      const tagSize = scene.kind === "card" ? 28 : 30;
      ctx.tarjaTextW = await measureText(tagLabel, { size: tagSize, family: F_INTER_XB, weight: 800, letterSpacing: tagSize * 0.16 });
      const title = scene.item.title_pt || "";
      if (scene.kind === "kinetic") {
        ctx.layout = await layoutWords(title, title.length > 60 ? 94 : 112, 920);
      } else if (scene.kind === "paper") {
        ctx.layout = await layoutWords(title, title.length > 56 ? 88 : 100, 920);
      } else if (scene.kind === "card") {
        ctx.layout = await layoutWords(title, title.length > 60 ? 66 : 78, 880);
      }
    } else if (scene.kind === "coldopen") {
      ctx.letterWidths = [];
      for (const L of "SMUFDPJ") ctx.letterWidths.push(await measureText(L, { size: 230, family: F_ANTON }));
      ctx.tarjaTextW = await measureText("AS NOTÍCIAS DA SEMANA", { size: 32, family: F_INTER_XB, weight: 800, letterSpacing: 32 * 0.16 });
    } else if (scene.kind === "outro") {
      ctx.siteTextW = await measureText(BRAND.site.toUpperCase(), { size: 30, family: F_INTER_XB, weight: 800, letterSpacing: 30 * 0.16 });
    }

    if (scene.kind === "coldopen" || scene.kind === "kinetic") {
      if (clipPath) {
        ctx.mode = "overlay";
      } else {
        const photoBuf = scene.kind === "coldopen"
          ? await fetchImageBuffer(items.find((it) => it.hasImg) || items[0])
          : (scene.item.hasImg !== false ? await fetchImageBuffer(scene.item) : null);
        if (photoBuf) {
          ctx.mode = "photo";
          ctx.zoomFrom = scene.kind === "coldopen" ? 1.30 : 1.06;
          ctx.zoomTo = scene.kind === "coldopen" ? 1.14 : 1.18;
          ctx.zoom = await prepareZoomBase(photoBuf, Math.max(ctx.zoomFrom, ctx.zoomTo));
        } else {
          ctx.mode = "flat";
          ctx.ghost = true;
        }
      }
    } else if (scene.kind === "card") {
      const photoBuf = await fetchImageBuffer(scene.item);
      if (!photoBuf) throw new Error(`buildReelVideo: card sem foto (${scene.item?.id})`);
      ctx.mode = "photo";
      ctx.zoomFrom = 1.06;
      ctx.zoomTo = 1.15;
      ctx.zoom = await prepareZoomBase(photoBuf, 1.15);
    } else if (scene.kind === "paper") {
      const photoBuf = await fetchImageBuffer(scene.item);
      if (photoBuf) {
        const snap = await sharp(photoBuf, { failOn: "none" })
          .resize(708, 528, { fit: "cover", position: "attention" })
          .jpeg({ quality: 82 })
          .toBuffer();
        ctx.photoDataUri = `data:image/jpeg;base64,${snap.toString("base64")}`;
      }
    }

    console.log(`[reel-video] cena ${si + 1}/${scenes.length} (${scene.kind}${clipPath ? ", clipe " + path.basename(clipPath) : ", " + ctx.mode})...`);
    await renderScene({ scene, total, accent, ctx, dir, concurrency });

    if (ctx.mode === "overlay") {
      await encodeClipSegment({ clipPath, overlayDir: dir, dur: scene.dur, outPath: segPath });
    } else {
      await encodePngSegment({ framesDir: dir, outPath: segPath });
    }
    segPaths.push(segPath);
    await fs.rm(dir, { recursive: true, force: true }); // libera disco entre cenas
  }

  // concat (corte seco) + trilha
  const listPath = path.join(tmpDir, "concat.txt");
  await fs.writeFile(listPath, segPaths.map((p) => `file '${p.replaceAll("'", "'\\''")}'`).join("\n"));
  const silentPath = path.join(tmpDir, "silent.mp4");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", silentPath]);

  outPath = outPath || path.resolve("media/news/instagram-reels/reel.mp4");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await runFfmpeg([
    "-y", "-i", silentPath, "-i", trackPath,
    "-filter_complex",
    `[1:a]atrim=0:${totalS},afade=t=in:d=0.3,afade=t=out:st=${(totalS - 0.5).toFixed(2)}:d=0.5,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-shortest", "-movflags", "+faststart",
    outPath,
  ]);

  return { outPath, duration: totalS, frames: totalFrames, scenes: scenes.length, tmpDir };
}
