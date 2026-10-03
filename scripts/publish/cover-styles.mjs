// Capas alternativas do carrossel (Claude Design, 2026-09-28): poster, zine e
// ingresso, em rodizio diario com a capa Card 11. Aqui mora so a geometria
// (planCover) e o rodizio; o SVG fica em cover-styles-svg.mjs. Medidas fieis
// ao export em design-handoff/retorno/capas/ (gitignored).
import { F_ANTON, F_INTER_XB } from "./fontconfig-boot.mjs";
import { numeroDiaBRT } from "../lib/brt.mjs";

export const COVER_STYLES = ["card11", "poster", "zine", "ingresso"];

// Estilo do dia no fuso de Brasilia (UTC-3): troca a meia-noite local.
// COVER_STYLE=<estilo> forca um estilo (mock, conferencia manual).
export function coverStyleFor(date = new Date(), forced = process.env.COVER_STYLE) {
  if (COVER_STYLES.includes(forced)) return forced;
  const day = numeroDiaBRT(date);
  return COVER_STYLES[((day % COVER_STYLES.length) + COVER_STYLES.length) % COVER_STYLES.length];
}

// Manchete: caixa, faixa de fonte (passo 2), entrelinha e ultima baseline.
const SPEC = {
  poster: { maxW: 968, fsMax: 112, fsMin: 76, lh: 0.92, lastBase: 1226 },
  zine: { maxW: 940, fsMax: 92, fsMin: 64, lh: 1.2, lastBase: 1214 },
  ingresso: { maxW: 968, fsMax: 80, fsMin: 56, lh: 0.96, lastBase: 1228 },
};

// Tarja contrasta com o fundo (mesma regra da capa Card 11).
export function tarjaColor(bg) {
  const escura = ["#e10600", "#a87f2c"].includes(String(bg).toLowerCase());
  return escura ? "#0a0a0a" : "#E10600";
}

// Quebra gulosa com largura REAL (measure). Tenta do maior pro menor corpo;
// se nem o minimo cabe em maxLines, corta a ultima linha com reticencias.
export async function fitMeasured(text, { maxW, fsMax, fsMin, maxLines = 3 }, measure) {
  const words = String(text || "").toUpperCase().split(/\s+/).filter(Boolean);
  const wrap = async (fs) => {
    const lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (!cur || (await measure(t, fs)) <= maxW) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  for (let fs = fsMax; fs >= fsMin; fs -= 2) {
    const lines = await wrap(fs);
    if (lines.length <= maxLines) return { fs, lines };
  }
  const lines = (await wrap(fsMin)).slice(0, maxLines);
  let last = lines[maxLines - 1].split(" ");
  while (last.length > 1 && (await measure(`${last.join(" ")}…`, fsMin)) > maxW) last = last.slice(0, -1);
  lines[maxLines - 1] = `${last.join(" ").replace(/[.,;:!?]+$/, "")}…`;
  return { fs: fsMin, lines };
}

// Planeja a capa: manchete, tarja e retangulo da foto. measure(text, opts)
// devolve a largura em px (opts: size, family, letterSpacing).
export async function planCover(style, { headline, label }, measure) {
  const s = SPEC[style];
  if (!s) throw new Error(`planCover: estilo desconhecido ${style}`);
  const anton = (t, fs) => measure(t, { size: fs, family: F_ANTON, letterSpacing: 0.35 });
  const fit = await fitMeasured(headline, s, anton);
  const lh = Math.round(fit.fs * s.lh);
  const first = s.lastBase - (fit.lines.length - 1) * lh;
  const lines = fit.lines.map((t, j) => ({ t, y: first + j * lh }));
  const labelW = await measure(label, { size: 22, family: F_INTER_XB, letterSpacing: 2.2 });
  const tarjaBottom = style === "zine"
    ? first - fit.fs * 0.9 - 22
    : first - fit.fs * 0.78 - (style === "poster" ? 26 : 24);
  const tarja = { y: Math.round(tarjaBottom - 44), w: Math.round(labelW + 44) };

  let photo;
  if (style === "poster") photo = { x: 0, y: 0, w: 1080, h: tarja.y + 22, bw: true };
  else if (style === "zine") photo = { x: 122, y: 202, w: 836, h: 556, bw: true };
  else photo = { x: 80, y: 154, w: 668, h: 692, bw: false };

  if (style === "zine") {
    const rots = [-1.2, 0.9, -0.5];
    for (const [j, ln] of lines.entries()) {
      ln.rot = rots[j] ?? 0;
      ln.ry = Math.round(ln.y - fit.fs * 0.9);
      ln.rh = Math.round(fit.fs * 1.04);
      ln.rw = Math.round((await anton(ln.t, fit.fs)) + 28);
    }
  }
  return { style, fs: fit.fs, lines, label, tarja, photo };
}
