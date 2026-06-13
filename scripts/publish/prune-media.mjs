// Housekeeping de binarios IG-only no working tree. Slides (jpg) e stories
// (mp4) so servem DURANTE a publicacao: o IG baixa via raw.githubusercontent
// na hora do publish e nunca mais. Sem poda, o checkout cresce ~48MB/mes.
//
// O que apaga:
//  - instagram-stories/<YYYY-MM-DD>.mp4 com mais de KEEP_DAYS (story expira
//    em 24h no IG; manter 14d ja e folga pra debug).
//  - instagram-reels/<YYYY-Www>.mp4 com mais de KEEP_DAYS_REELS. O reel fica
//    permanente no perfil do IG, mas o MP4 no repo so serve durante o publish
//    (o IG ja baixou). 30d preserva ~4 MP4 pra debug sem inchar o checkout.
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
const REELS_DIR = path.resolve("media/news/instagram-reels");
export const KEEP_DAYS_DEFAULT = 14;
export const KEEP_DAYS_REELS = 30;

// Decide se um story deve ser apagado pelo nome (YYYY-MM-DD.mp4).
// Nome fora do padrao = preserva (na duvida, nao apaga).
export function shouldPruneStory(filename, nowMs, keepDays = KEEP_DAYS_DEFAULT) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})\.mp4$/);
  if (!m) return false;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return nowMs - t > keepDays * 24 * 3600 * 1000;
}

// Segunda-feira (UTC) da semana ISO (Y, W). 4 de janeiro sempre cai na
// semana 1; a partir dele desloca pra segunda e soma (W-1) semanas.
function isoWeekMonday(year, week) {
  const jan4 = Date.UTC(year, 0, 4);
  const dow = new Date(jan4).getUTCDay() || 7; // 1=seg..7=dom
  const week1Monday = jan4 - (dow - 1) * 24 * 3600 * 1000;
  return week1Monday + (week - 1) * 7 * 24 * 3600 * 1000;
}

// Decide se um reel deve ser apagado pelo nome (YYYY-Www.mp4). Usa o FIM
// da semana ISO (segunda + 7d) como referencia. Nome fora do padrao = preserva.
export function shouldPruneReel(filename, nowMs, keepDays = KEEP_DAYS_REELS) {
  const m = filename.match(/^(\d{4})-W(\d{2})\.mp4$/);
  if (!m) return false;
  const weekEnd = isoWeekMonday(Number(m[1]), Number(m[2])) + 7 * 24 * 3600 * 1000;
  return nowMs - weekEnd > keepDays * 24 * 3600 * 1000;
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

// Roda a poda. Retorna { slides: n, stories: n, reels: n } apagados.
export async function pruneOldMedia(queue, { nowMs = Date.now(), keepDays = KEEP_DAYS_DEFAULT, keepDaysReels = KEEP_DAYS_REELS } = {}) {
  const queueById = new Map((queue.items || []).map((q) => [q.id, q]));
  let slides = 0, stories = 0, reels = 0;
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
  for (const f of await listDir(REELS_DIR)) {
    if (shouldPruneReel(f, nowMs, keepDaysReels)) {
      await fs.unlink(path.join(REELS_DIR, f)).catch(() => {});
      reels++;
    }
  }
  return { slides, stories, reels };
}
