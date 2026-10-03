// De onde veio a fala: media/news/youtube-acervo/_fontes.json (videoId ->
// "MTV, 1994"). Arquivo ausente ou vídeo sem entrada = "" (slide sem fonte).

import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../config.mjs";

const ARQ = naRaiz("media/news/youtube-acervo/_fontes.json");
let _fontes = null;

export function fonteDoVideo(videoId) {
  if (!_fontes) _fontes = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")).fontes || {} : {};
  return String(_fontes[videoId] || "").trim();
}
