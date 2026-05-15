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

// Retorna {left,top,width,height} no espaco de pixels da imagem
// original, ja na proporcao targetW:targetH, ou null se nao houver
// rosto detectado com confianca.
export async function faceCropRegion(photoBuf, targetW, targetH) {
  let model;
  try {
    model = await getModel();
  } catch {
    return null; // tfjs/modelo indisponivel -> chamador usa fallback
  }

  const { data, info } = await sharp(photoBuf, { failOn: "none" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  let faces;
  let input;
  try {
    input = _tf.tensor3d(new Uint8Array(data), [H, W, info.channels]);
    faces = await model.estimateFaces(input, false);
  } catch {
    return null;
  } finally {
    if (input) input.dispose();
  }

  const valid = (faces || []).filter((f) => {
    const p = Array.isArray(f.probability) ? f.probability[0] : f.probability;
    return (p ?? 1) >= 0.6;
  });
  if (valid.length === 0) return null;

  // Caixa-uniao de todos os rostos
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of valid) {
    const [x1, y1] = f.topLeft;
    const [x2, y2] = f.bottomRight;
    minX = Math.min(minX, x1); minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2); maxY = Math.max(maxY, y2);
  }
  const faceW = Math.max(1, maxX - minX);
  const faceH = Math.max(1, maxY - minY);
  const faceCX = minX + faceW / 2;
  const faceCY = minY + faceH / 2;

  const AR = targetW / targetH;

  // Se o rosto encosta no topo da fonte, a cabeca/testa quase
  // sempre ja vem cortada na imagem original (thumbnail/og:image).
  // Nesse caso NAO da zoom: usa o maior corte possivel pra mostrar
  // o maximo de contexto (corpo/cena) em vez de um closeup de
  // cabeca cortada. headTop=true.
  const headTop = minY <= H * 0.03;

  // Altura do corte. Normal: rosto(s) ~28% da altura -> bastante
  // headroom acima e torso/contexto abaixo. Com headTop: o maior
  // corte possivel (mostra tudo, menos zoom = menos cara de
  // cabeca cortada). Limites: nunca abaixo de 60% da imagem.
  let cropH = headTop ? H : faceH / 0.28;
  cropH = Math.max(cropH, H * 0.6);
  cropH = Math.min(cropH, H);
  let cropW = cropH * AR;
  if (cropW > W) {
    cropW = W;
    cropH = cropW / AR;
  }

  // Posicao: centro horizontal no centro dos rostos. Vertical:
  // normal coloca o centro dos rostos a ~42% do topo (headroom);
  // com headTop ancora no topo (top=0), ja que nao ha o que
  // mostrar acima.
  let left = faceCX - cropW / 2;
  let top = headTop ? 0 : faceCY - cropH * 0.42;

  // Garante que a caixa-uniao dos rostos cabe inteira no corte
  if (minX < left) left = minX;
  if (maxX > left + cropW) left = maxX - cropW;
  if (minY < top) top = minY;
  if (maxY > top + cropH) top = maxY - cropH;

  // Clamp aos limites da imagem
  left = Math.max(0, Math.min(W - cropW, left));
  top = Math.max(0, Math.min(H - cropH, top));

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}
