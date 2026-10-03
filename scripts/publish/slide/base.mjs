// Base dos slides do feed (1080x1350, Instagram 4:5): medidas, pasta, layout, rótulos e helpers comuns.
// side-effect: bootstrap do fontconfig (env setado ANTES do primeiro uso do sharp/libvips).
import "../fontconfig-boot.mjs";
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";

export const { default: sharp } = await import("sharp");
export const { default: smartcrop } = await import("smartcrop-sharp");

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;
export const SLIDES_DIR = naRaiz("media/news/instagram-slides");

// Layout: "card02" (padrão desde 2026-05-16, design do Claude Design) ou "cadernob" (layout antigo,
// só pra rollback: SLIDE_LAYOUT=cadernob no publish-instagram.yml).
export const LAYOUT = (process.env.SLIDE_LAYOUT || "card02").toLowerCase();

export const CAT_LABELS = {
  turne: "Turnê", lancamento: "Lançamento", tenclub: "Ten Club",
  memoria: "Memória", br: "Brasil", bootleg: "Bootleg",
  comunidade: "Comunidade", eddie: "Eddie", mike: "Mike",
  stone: "Stone", jeff: "Jeff", matt: "Matt", boom: "Boom", josh: "Josh",
  loja: "Loja",
};

export function escapeXml(s) {
  return String(s || "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return { r: 10, g: 10, b: 10 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Manchete do card: título chamativo do IG, com fallback pro do site.
export function headlineOf(item) {
  return String(item.title_ig || item.title_pt || "").trim();
}

export async function ensureSlidesDir() {
  await fs.mkdir(SLIDES_DIR, { recursive: true });
}

// Fundo liso do tamanho do slide (base das composições).
export function fundo(rgb) {
  return sharp({ create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: rgb } }).png().toBuffer();
}
