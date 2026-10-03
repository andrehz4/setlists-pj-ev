// Slide de CITAÇÃO das cápsulas (desenho do Claude Design, aprovado pelo Andre
// em 2026-09-30). Dois estilos em rodízio diário (BRT), igual às capas:
//   editorial (1c + seta 3d) e revista (2b). A cápsula inteira usa o mesmo.
// Ligado por CAPSULA_CITACAO (ver run-publish-capsula.mjs):
//   rodizio | editorial | revista  -> este módulo;  vazio -> slide antigo.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SLIDES_DIR } from "../slide-image.mjs";
import { resolverAutor } from "./retratos.mjs";
import { paleta } from "./paleta.mjs";
import { svgEditorial } from "./estilo-editorial.mjs";
import { svgRevista, fotoDuotone } from "./estilo-revista.mjs";
import { numeroDiaBRT } from "../../lib/brt.mjs";

export const ESTILOS = ["editorial", "revista"];

// Modo do env -> estilo do dia. Dia contado em BRT (UTC-3), como as capas.
export function estiloDoDia(modo, date = new Date()) {
  if (ESTILOS.includes(modo)) return modo;
  const dia = numeroDiaBRT(date);
  return ESTILOS[dia % ESTILOS.length];
}

// "em 1990" + "Apple Music, 2024" -> "em 1990 · Apple Music, 2024".
export function montarContexto(contexto, fonte) {
  return [contexto, fonte].map((s) => String(s || "").trim()).filter(Boolean).join(" · ");
}

async function fotoCirculo(arquivo) {
  const buf = await sharp(arquivo).resize(440, 440).jpeg({ quality: 90 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// Monta o SVG do estilo pedido. Revista sem espaço pro nome cai no editorial.
export async function svgCitacao({ quote, autor, fonte = "", estilo = "editorial", cor = "#0a0a0a" }) {
  const pal = paleta(cor);
  const linhaContexto = montarContexto(autor.contexto, fonte);
  const temFoto = Boolean(autor.foto && fs.existsSync(autor.foto));
  if (estilo === "revista") {
    const fotoUri = temFoto ? await fotoDuotone(autor.foto, pal.accent) : null;
    const svg = await svgRevista({ quote, autor, linhaContexto, pal, fotoUri });
    if (svg) return { svg, estilo: "revista", bg: pal.bg };
  }
  const fotoUri = temFoto ? await fotoCirculo(autor.foto) : null;
  return { svg: await svgEditorial({ quote, autor, linhaContexto, pal, fotoUri }), estilo: "editorial", bg: pal.bg };
}

// seed = id da cápsula (fixa o retrato do Eddie no carrossel todo);
// fonte = de onde veio a fala ("MTV, 1994"), vazio se não souber.
export async function buildQuoteSlideCitacao({ quote, author, seed = "", fonte = "", estilo = "editorial" }, destId, cor = "#0a0a0a") {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);
  const autor = resolverAutor(author, seed);
  const r = await svgCitacao({ quote, autor, fonte, estilo, cor });
  await sharp(Buffer.from(r.svg)).flatten({ background: r.bg }).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, estilo: r.estilo, reused: false };
}
