// Foto de base de um item: override manual > foto local > URL da matéria > foto do assunto > foto
// da banda. Cada queda pro próximo nível fica no log (antes era silenciosa e a foto da banda aparecia
// no post sem explicação).
import fs from "node:fs/promises";
import path from "node:path";
import got from "got";
import { naRaiz } from "../../config.mjs";
import { getImageOverrideUrl } from "../image-overrides.mjs";
import { loadBandFallbacks, pickFallback } from "../band-fallback.mjs";
import { subjectFallbackPath } from "../subject-fallback.mjs";
import { detectFaces } from "../face-crop.mjs";
import { findBetterImage } from "../find-better-image.mjs";

const BAND_FALLBACKS = await loadBandFallbacks();
const baixar = (url) => got(url, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
const valido = (buf) => buf && buf.length > 1024;
const avisar = (id, etapa, e) => {
  if (e?.code !== "ENOENT") console.warn(`[slide] ${id}: ${etapa} falhou (${e?.message || e}), tentando o próximo`);
};

// Grava a foto no cache local do item (vale pros próximos usos e vai pro git).
async function guardarNoCache(item, buf) {
  if (!item.img || !item.img.startsWith("/media/news/img/")) return;
  await fs.writeFile(naRaiz(item.img.replace(/^\//, "")), buf)
    .catch((e) => console.warn(`[slide] ${item.id}: não gravou o cache da foto (${e.message})`));
}

export async function fetchBaseImageBuffer(item) {
  try {
    const ovUrl = await getImageOverrideUrl(item.id);
    if (ovUrl) {
      const buf = await baixar(ovUrl);
      if (valido(buf)) {
        await guardarNoCache(item, buf);
        console.log(`[slide] ${item.id}: usando imagem de override manual (${ovUrl})`);
        return buf;
      }
    }
  } catch (e) {
    console.warn(`[slide] override de ${item.id} falhou (${e.message}), seguindo com fonte normal`);
  }

  // Foto local: imagem raspada (/media/news/img/) ou do acervo (/media/band/...), usada pelas cápsulas.
  if (item.img && item.img.startsWith("/media/")) {
    try {
      const buf = await fs.readFile(naRaiz(item.img.replace(/^\//, "")));
      if (valido(buf)) return buf;
    } catch (e) { avisar(item.id, `foto local ${item.img}`, e); }
  }
  const src = item.img || item.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try { return await baixar(src); } catch (e) { avisar(item.id, `download de ${src}`, e); }
  }

  // Sem foto própria: notícia que cita um integrante usa a foto dele antes da rotação genérica.
  try {
    const subjectPath = await subjectFallbackPath(item);
    if (subjectPath) {
      const buf = await fs.readFile(subjectPath);
      if (valido(buf)) {
        console.log(`[slide] ${item.id}: sem foto propria, usando foto do assunto (${path.basename(subjectPath)})`);
        return buf;
      }
    }
  } catch (e) { avisar(item.id, "foto do assunto", e); }

  try {
    const fallback = pickFallback(BAND_FALLBACKS, item.id);
    const buf = await fs.readFile(fallback);
    if (valido(buf)) {
      console.log(`[slide] ${item.id}: sem foto propria, usando fallback da banda (${path.basename(fallback)})`);
      return buf;
    }
  } catch (e) { avisar(item.id, "foto da banda", e); }
  return null;
}

// Foto + detecção de rosto. Se a fonte cortou o rosto no topo, busca uma imagem melhor na matéria.
export async function prepareSource(item) {
  const photoRaw = await fetchBaseImageBuffer(item);
  if (!photoRaw) return { srcBuf: null, det: null };
  let srcBuf = photoRaw;
  let det = null;
  try {
    det = await detectFaces(srcBuf);
    if (det && det.faces.length > 0 && det.topCut && item.url) {
      const better = await findBetterImage(item.url);
      if (better && better.buffer) {
        srcBuf = better.buffer;
        det = await detectFaces(srcBuf);
        await guardarNoCache(item, srcBuf);
        console.log(`[slide] ${item.id}: fonte cortada no rosto -> imagem melhor de ${better.url}`);
      }
    }
  } catch (e) {
    console.warn(`[slide] ${item.id}: detecção de rosto falhou (${e.message}), recorte segue sem ela`);
  }
  return { srcBuf, det };
}
