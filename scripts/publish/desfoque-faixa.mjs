// Desfoque atrás do texto (story e reel): na faixa da manchete a foto ou o clipe vem desfocado e mais escuro,
// com bordas em degradê. Foto clara atrás não briga com a letra branca. REEL_DESFOQUE=0 desliga no reel.
import sharp from "sharp";

export const DESFOQUE = { sigma: 26, saturacao: 0.7, borda: 160 };
export const desfoqueNoReel = () => process.env.REEL_DESFOQUE !== "0";

// SVG da máscara: branco opaco entre y0 e y1, sumindo em `borda` px acima e abaixo. Fora disso, transparente.
export function mascaraSvg(w, h, y0, y1, borda = DESFOQUE.borda) {
  const a = Math.max(0, y0 - borda), b = Math.min(h + borda, y1 + borda), tot = Math.max(1, b - a);
  const p = (y) => Math.min(1, Math.max(0, (y - a) / tot)).toFixed(4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="m" gradientUnits="userSpaceOnUse" x1="0" y1="${a}" x2="0" y2="${b}">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${p(y0)}" stop-color="#fff" stop-opacity="1"/>
      <stop offset="${p(y1)}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs><rect x="0" y="${a}" width="${w}" height="${tot}" fill="url(#m)"/></svg>`;
}

// Máscara com alfa (sharp, blend dest-in) e em tons de cinza (ffmpeg, alphamerge).
export const mascaraAlfa = (w, h, y0, y1) => sharp(Buffer.from(mascaraSvg(w, h, y0, y1))).png().toBuffer();
export const mascaraCinza = (w, h, y0, y1) => sharp(Buffer.from(mascaraSvg(w, h, y0, y1)))
  .flatten({ background: "#000" }).toColourspace("b-w").png().toBuffer();

// Versão desfocada e escurecida de uma imagem inteira (recortada depois quadro a quadro, igual à nítida).
export function desfocar(buf, { brilho = 0.55, escala = 1 } = {}) {
  return sharp(buf, { failOn: "none" }).blur(DESFOQUE.sigma * escala)
    .modulate({ brightness: brilho, saturation: DESFOQUE.saturacao }).jpeg({ quality: 90 }).toBuffer();
}

// Quadro nítido + faixa desfocada por cima (os dois já no tamanho final).
export async function comFaixa(nitido, desfocado, mascara) {
  const faixa = await sharp(desfocado).composite([{ input: mascara, blend: "dest-in" }]).png().toBuffer();
  return sharp(nitido).composite([{ input: faixa, blend: "over" }]).png().toBuffer();
}

// Trecho de filtro do ffmpeg: [entrada] nítido + versão desfocada recortada pela máscara cinza [mascara] -> [saida].
export function filtroFfmpeg(entrada, mascara, saida, { brilho = 0.55 } = {}) {
  const k = brilho.toFixed(2);
  return `${entrada}split[df_n][df_b];[df_b]gblur=sigma=${DESFOQUE.sigma},format=rgb24,`
    + `colorchannelmixer=rr=${k}:gg=${k}:bb=${k},eq=saturation=${DESFOQUE.saturacao},format=rgba[df_bb];`
    + `${mascara}format=gray[df_m];[df_bb][df_m]alphamerge[df_bm];[df_n][df_bm]overlay=0:0:shortest=1${saida}`;
}
