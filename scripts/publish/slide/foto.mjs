// Recorte e tratamento da foto pro tamanho do slide.
import { sharp, smartcrop } from "./base.mjs";
import { cropFromFaces } from "../face-crop.mjs";

// Recorte em 3 níveis pra um alvo WxH: rosto real (blazeface, rostos no terço de cima com folga) ->
// smartcrop (pele, bordas, saturação: bom pra pôster e objeto) -> cover "attention". Sempre preenche.
export async function coverCrop(srcBuf, det, targetW, targetH) {
  let meta;
  try { meta = await sharp(srcBuf, { failOn: "none" }).metadata(); } catch { meta = {}; }
  let buf = null;
  try {
    const fc = cropFromFaces(det, targetW, targetH);
    if (fc) {
      buf = await sharp(srcBuf, { failOn: "none" })
        .extract(fc).resize(targetW, targetH, { fit: "cover" }).toBuffer();
    }
  } catch (e) {
    console.warn(`[slide] recorte pelo rosto falhou (${e.message}), tentando smartcrop`);
  }
  if (!buf) {
    try {
      const { topCrop: c } = await smartcrop.crop(srcBuf, { width: targetW, height: targetH });
      if (c && c.width > 0 && c.height > 0 && meta.width && meta.height) {
        const left = Math.max(0, Math.min(meta.width - 1, Math.round(c.x)));
        const top = Math.max(0, Math.min(meta.height - 1, Math.round(c.y)));
        const width = Math.max(1, Math.min(meta.width - left, Math.round(c.width)));
        const height = Math.max(1, Math.min(meta.height - top, Math.round(c.height)));
        buf = await sharp(srcBuf, { failOn: "none" })
          .extract({ left, top, width, height })
          .resize(targetW, targetH, { fit: "cover" }).toBuffer();
      }
    } catch (e) {
      console.warn(`[slide] smartcrop falhou (${e.message}), usando cover attention`);
    }
  }
  if (!buf) {
    buf = await sharp(srcBuf, { failOn: "none" })
      .resize(targetW, targetH, { fit: "cover", position: "attention" }).toBuffer();
  }
  return buf;
}

async function grao(targetW, targetH, sigma) {
  try {
    return await sharp({
      create: { width: targetW, height: targetH, channels: 3, noise: { type: "gaussian", mean: 128, sigma } },
    }).greyscale().png().toBuffer();
  } catch {
    return null; // grão é enfeite: sem ele a foto sai igual, só mais limpa
  }
}

// Tratamento por resolução da fonte. SEMPRE devolve buffer exatamente targetW×H.
// scale = quanto a foto precisa ser ampliada pra cobrir o alvo: max(targetW/srcW, targetH/srcH).
//  - scale <= 0.80 -> NÍTIDA: cover crop direto.
//  - scale <= 1.80 -> MÉDIA: cover crop + sharpen + grão editorial.
//  - scale  > 1.80 -> PEQUENA: upscale + sharpen forte + grão mais marcado (mantém o full-bleed do
//    Card 02; o fallback antigo "foto contida + blur" parecia bug de carregamento).
export async function renderPhoto(srcBuf, det, targetW, targetH, tag = "") {
  let meta;
  try { meta = await sharp(srcBuf, { failOn: "none" }).metadata(); } catch { meta = null; }
  if (!meta || !meta.width || !meta.height) {
    return coverCrop(srcBuf, det, targetW, targetH);
  }
  const scale = Math.max(targetW / meta.width, targetH / meta.height);
  const fonte = `fonte ${meta.width}x${meta.height}, scale ${scale.toFixed(2)}`;

  if (scale <= 0.80) {
    console.log(`[slide] ${tag} foto nitida (${fonte})`);
    return coverCrop(srcBuf, det, targetW, targetH);
  }
  const media = scale <= 1.80;
  console.log(`[slide] ${tag} ${media ? "foto media -> realce" : "foto pequena -> upscale agressivo"} (${fonte})`);
  const base = await coverCrop(srcBuf, det, targetW, targetH);
  const g = await grao(targetW, targetH, media ? 7 : 12);
  let pipe = media
    ? sharp(base).sharpen(1.2).modulate({ saturation: 1.04 })
    : sharp(base).sharpen({ sigma: 1.8, m1: 1.0, m2: 2.0 }).modulate({ saturation: 1.06 });
  if (g) pipe = pipe.composite([{ input: g, blend: "soft-light" }]);
  return pipe.toBuffer();
}
