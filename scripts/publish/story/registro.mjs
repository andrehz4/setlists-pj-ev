// Idempotência do story (1 por dia BRT) em media/news/instagram-stories/_story-log.json, e o espelho
// best-effort no Facebook (o IG já publicou; falha no FB só loga). FB só com PUBLISH_FB=1 + secrets.
import fs from "node:fs/promises";
import path from "node:path";
import { lerEstado, comLista } from "../../lib/estado.mjs";
import { ESTADO } from "../../config.mjs";
import { publishVideoStory } from "../facebook.mjs";

const LOG_PATH = ESTADO.logStory;

// Corrompido derruba: log vazio em silêncio quebrava a idempotência (post duplicado).
export const readLog = () => lerEstado(LOG_PATH, { entries: [] }, { valida: comLista("entries") });

// Guarda só as últimas 60 entradas.
export async function writeLog(log) {
  if (log.entries.length > 60) log.entries = log.entries.slice(-60);
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));
}

export async function espelharNoFacebook(videoUrl) {
  if (!(process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN)) return null;
  try {
    const fb = await publishVideoStory({ videoUrl });
    console.log(`[story] FB OK fbPostId=${fb.postId}`);
    return fb.postId;
  } catch (e) {
    console.error(`[story] FB FALHA (IG ja publicou, seguindo): ${typeof e.toDetailString === "function" ? e.toDetailString() : e.message}`);
    return null;
  }
}
