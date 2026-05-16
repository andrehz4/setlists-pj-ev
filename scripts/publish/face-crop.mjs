// Enquadramento inteligente de foto guiado por deteccao de rosto real
// (blazeface / tfjs CPU, JS puro, sem build nativo). Dado um buffer de
// imagem e a proporcao alvo, retorna a janela de corte {left,top,
// width,height} que mantem TODOS os rostos no terco superior, com
// headroom acima e torso abaixo. Se nao achar rosto, retorna null
// (o chamador cai pro smartcrop, melhor pra poster/objeto/album).
//
// O modelo carrega 1x por processo (promise cacheada). Deteccao
// ~0.4s/foto no backend CPU; ok pro cron (~5-10 fotos por run).

import sharp from "sharp";

let _modelPromise = null;
let _tf = null;

async function getModel() {
  if (_modelPromise) return _modelPromise;
  _modelPromise = (async () => {
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-cpu").catch(() => {});
    const blazeface = await import("@tensorflow-models/blazeface");
    await tf.setBackend("cpu");
    await tf.ready();
    _tf = tf;
    return blazeface.load();
  })();
  return _modelPromise;
}

// Roda o blazeface e retorna { W, H, faces, topCut }.
//   faces  = [{x1,y1,x2,y2,prob}] (so confianca >= 0.6)
//   topCut = true se algum rosto encosta no topo da imagem
//            (minY <= 3% da altura) -> fonte provavelmente ja veio
//            cortada na testa/cabeca (thumbnail/og:image ruim).
// Retorna null se o modelo/tfjs estiver indisponivel.
export async function detectFaces(photoBuf) {
  let model;
  try {
    model = await getModel();
  } catch {
    return null;
  }

  let info, data;
  try {
    ({ data, info } = await sharp(photoBuf, { failOn: "none" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }));
  } catch {
    return null;
  }
  const W = info.width;
  const H = info.height;

  let raw;
  let input;
  try {
    input = _tf.tensor3d(new Uint8Array(data), [H, W, info.channels]);
    raw = await model.estimateFaces(input, false);
  } catch {
    return null;
  } finally {
    if (input) input.dispose();
  }

  const faces = (raw || [])
    .map((f) => {
      const p = Array.isArray(f.probability) ? f.probability[0] : f.probability;
      const [x1, y1] = f.topLeft;
      const [x2, y2] = f.bottomRight;
      return { x1, y1, x2, y2, prob: p ?? 1 };
    })
    .filter((f) => f.prob >= 0.6);

  const topCut = faces.some((f) => f.y1 <= H * 0.03);
  return { W, H, faces, topCut };
}

// Geometria pura: dada a deteccao e a proporcao alvo, devolve a
// janela de corte ou null se nao houver rosto.
export function cropFromFaces(det, targetW, targetH) {
  if (!det || !det.faces || det.faces.length === 0) return null;
  const { W, H, faces, topCut } = det;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of faces) {
    minX = Math.min(minX, f.x1); minY = Math.min(minY, f.y1);
    maxX = Math.max(maxX, f.x2); maxY = Math.max(maxY, f.y2);
  }
  const faceW = Math.max(1, maxX - minX);
  const faceH = Math.max(1, maxY - minY);
  const faceCX = minX + faceW / 2;
  const faceCY = minY + faceH / 2;
  const AR = targetW / targetH;

  // Com topCut a cabeca ja veio cortada: nao da zoom, usa o maior
  // corte possivel (mostra o maximo de contexto). Normal: rosto(s)
  // ~28% da altura, com headroom acima e torso abaixo.
  let cropH = topCut ? H : faceH / 0.28;
  cropH = Math.max(cropH, H * 0.6);
  cropH = Math.min(cropH, H);
  let cropW = cropH * AR;
  if (cropW > W) {
    cropW = W;
    cropH = cropW / AR;
  }

  let left = faceCX - cropW / 2;
  let top = topCut ? 0 : faceCY - cropH * 0.42;

  if (minX < left) left = minX;
  if (maxX > left + cropW) left = maxX - cropW;
  if (minY < top) top = minY;
  if (maxY > top + cropH) top = maxY - cropH;

  left = Math.max(0, Math.min(W - cropW, left));
  top = Math.max(0, Math.min(H - cropH, top));

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

// Conveniencia: detecta + calcula a janela. Mantem a API usada pelo
// slide-image.mjs. Retorna {left,top,width,height} ou null.
export async function faceCropRegion(photoBuf, targetW, targetH) {
  const det = await detectFaces(photoBuf);
  return cropFromFaces(det, targetW, targetH);
}
