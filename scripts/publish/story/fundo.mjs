// Fundo do card do story: foto (mesma escolha do slide do feed) com aproximação lenta (Ken Burns, igual ao reel)
// que puxa pro rosto quando acha um (blazeface); sem rosto, aproxima no centro. Na faixa da manchete a foto vem
// desfocada e escura (desfoque-faixa.mjs). Gradiente card02 por cima. Sem foto: grafite parado.
// STORY_ZOOM=0 deixa a foto parada.
import sharp from "sharp";
import { fetchBaseImageBuffer } from "../slide/imagem.mjs";
import { detectFaces } from "../face-crop.mjs";
import { desfocar, comFaixa, mascaraAlfa } from "../desfoque-faixa.mjs";
import { clamp01 } from "../story-styles/_shared.mjs";
import { layoutCard } from "./card.mjs";
import { W, H, T_CARD_DUR } from "./base.mjs";

export const ZOOM = 1.12; // aproximação total ao longo do card

// Centro dos rostos na base (px) ou null.
async function focoDoRosto(base) {
  const det = await detectFaces(base).catch(() => null);
  if (!det?.faces?.length) return null;
  const xs = det.faces.flatMap((f) => [f.x1, f.x2]), ys = det.faces.flatMap((f) => [f.y1, f.y2]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

function gradienteSvg(yF, y0) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="22%" stop-color="#000" stop-opacity="0"/>
      <stop offset="${Math.round((yF / H) * 100)}%" stop-color="#000" stop-opacity="0"/>
      <stop offset="${Math.round((y0 / H) * 100)}%" stop-color="#000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#g)"/></svg>`);
}

// Janela de recorte da base no instante p (0..1): zoom 1 -> ZOOM, centro indo do meio da foto até o rosto.
export function janela({ bw, bh, foco }, p) {
  const s = 1 + (ZOOM - 1) * p;
  const w = Math.round(bw / s), h = Math.round(bh / s);
  const fx = foco ? foco.x : bw / 2, fy = foco ? foco.y : bh / 2;
  const cx = bw / 2 + (fx - bw / 2) * p, cy = bh / 2 + (fy - bh / 2) * p;
  const left = Math.round(Math.min(bw - w, Math.max(0, cx - w / 2)));
  const top = Math.round(Math.min(bh - h, Math.max(0, cy - h / 2)));
  return { left, top, width: w, height: h };
}

export async function prepararFundo(item) {
  const y0 = Math.max(0, Math.round(layoutCard(item).tagTopY - 70));
  const grad = gradienteSvg(Math.max(0, y0 - 160), y0);
  const foto = await fetchBaseImageBuffer(item);
  if (!foto) {
    const liso = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 26, g: 24, b: 21 } } })
      .composite([{ input: grad, blend: "over" }]).png().toBuffer();
    return { parado: liso };
  }
  const bw = Math.round(W * ZOOM), bh = Math.round(H * ZOOM);
  const base = await sharp(foto, { failOn: "none" })
    .resize(bw, bh, { fit: "cover", position: "attention" }).sharpen(1.1).jpeg({ quality: 92 }).toBuffer();
  const fundo = { base, bw, bh, grad, desfocada: await desfocar(base, { escala: ZOOM }), mascara: await mascaraAlfa(W, H, y0, H) };
  if (process.env.STORY_ZOOM === "0") return { parado: await quadro(fundo, 0) };
  fundo.foco = await focoDoRosto(base);
  console.log(`[story] fundo ${item.id}: zoom ${fundo.foco ? "no rosto" : "no centro"}`);
  return fundo;
}

async function quadro(f, p) {
  const win = janela(f, p);
  const [nitido, desf] = await Promise.all([f.base, f.desfocada]
    .map((b) => sharp(b).extract(win).resize(W, H).png().toBuffer()));
  return sharp(await comFaixa(nitido, desf, f.mascara)).composite([{ input: f.grad, blend: "over" }]).png().toBuffer();
}

// Fundo do card no instante tRel (s). Aproximação em ritmo constante, como no reel.
export function fundoNoQuadro(f, tRel) {
  return f.parado ? f.parado : quadro(f, clamp01(tRel / T_CARD_DUR));
}
