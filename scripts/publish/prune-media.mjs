// Housekeeping de binarios IG-only no working tree. Slides (jpg) e stories
// (mp4) so servem DURANTE a publicacao: o IG baixa via raw.githubusercontent
// na hora do publish e nunca mais. Sem poda, o checkout cresce ~48MB/mes.
//
// O que apaga:
//  - instagram-stories/<YYYY-MM-DD>.mp4 com mais de KEEP_DAYS (story expira
//    em 24h no IG; manter 14d ja e folga pra debug).
//  - instagram-slides/<id>[.card02].jpg cujo item NAO esta mais na fila
//    (pruneOldPosted remove postados ha >30d) ou esta postado ha mais de
//    KEEP_DAYS. Item pendente/recente fica (slide pode ser reusado).
//  - _cover-*.jpg nunca (reescritos a cada run).
//
// Limitacao honesta: isso segura o tamanho do CHECKOUT, nao do .git (a
// historia preserva os blobs). A solucao de raiz e subir slides/stories pro
// R2 e parar de commitar (pendente: token R2 do Andre).
//
// Quem chama: run-publish.mjs (1x por run, barato). Apagar arquivo que o
// buildSlides precisaria de novo nao quebra nada: ele regenera na hora.

import fs from "node:fs/promises";
import path from "node:path";

const SLIDES_DIR = path.resolve("media/news/instagram-slides");
const STORIES_DIR = path.resolve("media/news/instagram-stories");
export const KEEP_DAYS_DEFAULT = 14;

// Decide se um story deve ser apagado pelo nome (YYYY-MM-DD.mp4).
// Nome fora do padrao = preserva (na duvida, nao apaga).
export function shouldPruneStory(filename, nowMs, keepDays = KEEP_DAYS_DEFAULT) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})\.mp4$/);
  if (!m) return false;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return nowMs - t > keepDays * 24 * 3600 * 1000;
}

// Decide se um slide deve ser apagado. queueById mapeia id -> item da fila.
// Sem item na fila = postado ha >30d (pruneOldPosted ja removeu) = apaga.
// Com item: apaga so se postado ha mais de keepDays. Pendente preserva.
export function shouldPruneSlide(filename, queueById, nowMs, keepDays = KEEP_DAYS_DEFAULT) {
  if (filename.startsWith("_cover")) return false;
  const m = filename.match(/^(.+?)(\.card02)?\.jpg$/);
  if (!m) return false;
  const id = m[1];
  const q = queueById.get(id);
  if (!q) return true;
  if (!q.postedAt) return false;
  const t = new Date(q.postedAt).getTime();
  return Number.isFinite(t) && nowMs - t > keepDays * 24 * 3600 * 1000;
}

async function listDir(dir) {
  try { return await fs.readdir(dir); } catch { return []; }
}

// Roda a poda. Retorna { slides: n, stories: n } apagados.
export async function pruneOldMedia(queue, { nowMs = Date.now(), keepDays = KEEP_DAYS_DEFAULT } = {}) {
  const queueById = new Map((queue.items || []).map((q) => [q.id, q]));
  let slides = 0, stories = 0;
  for (const f of await listDir(SLIDES_DIR)) {
    if (shouldPruneSlide(f, queueById, nowMs, keepDays)) {
      await fs.unlink(path.join(SLIDES_DIR, f)).catch(() => {});
      slides++;
    }
  }
  for (const f of await listDir(STORIES_DIR)) {
    if (shouldPruneStory(f, nowMs, keepDays)) {
      await fs.unlink(path.join(STORIES_DIR, f)).catch(() => {});
      stories++;
    }
  }
  return { slides, stories };
}
