// Constantes do publish do feed (run-publish.mjs). Valores com env podem ser trocados no Actions.
import path from "node:path";
import { NEWS_DIR } from "../../config.mjs";

export const INDEX_PATH = path.join(NEWS_DIR, "index.json");
export const ITEMS_DIR = path.join(NEWS_DIR, "items");
export const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");
export const DETECT_STAMP_PATH = path.join(NEWS_DIR, "_detect-deleted-stamp.json");
export const HEALTH_STAMP_PATH = path.join(NEWS_DIR, "_health-stamp.json");
export const STALE_TOMBSTONE_PATH = path.join(NEWS_DIR, "_skipped-stale.json");

// Arquivos de estado que a run escreve e commita (a reconciliação pós-conflito usa essa lista).
export const STATE_PATHS = [
  "media/news/_publish-queue.json",
  "media/news/_deleted-from-ig.json",
  "media/news/_telegram-cursor.json",
  "media/news/_ig-cooldown.json",
  "media/news/_ig-exists-cache.json",
  "media/news/_skipped-stale.json",
  "media/news/_detect-deleted-stamp.json",
  "media/news/_health-stamp.json",
];

const numEnv = (nome, padrao) => {
  const v = Number(process.env[nome]);
  return Number.isFinite(v) && v > 0 ? v : padrao;
};

// Redução de volume de chamadas (o feed estourava o limite da app code 4 por
// fazer ~15-25 chamadas/run vs ~2 do story). Dois cortes de overhead:
//  - detecção de apagados (~5-33 GETs) só 1x a cada DETECT_INTERVAL_H horas.
//  - pré-check de quota pulado por padrão (reporta 0/50 mesmo com a app
//    throttled, então não protege de nada e ainda gasta 1 chamada). Reativável
//    via IG_QUOTA_PRECHECK=1.
export const DETECT_INTERVAL_H = numEnv("IG_DETECT_INTERVAL_H", 20);
export const QUOTA_PRECHECK = process.env.IG_QUOTA_PRECHECK === "1";

// Ciclo de cores da tarja superior do slide. Muda a cada POSTS_PER_COLOR
// posts publicados, dando dinâmica visual no feed sem perder identidade.
const TARJA_COLORS = [
  "#c12727", // vermelho sangue PJ (default)
  "#0a0908", // preto profundo
  "#a87f2c", // ocre sépia
  "#2a5b9e", // azul petróleo
];
export const POSTS_PER_COLOR = 3;
export function getCurrentTarjaColor(postCount) {
  const idx = Math.floor((postCount || 0) / POSTS_PER_COLOR) % TARJA_COLORS.length;
  return TARJA_COLORS[idx];
}

// Duração do cooldown global por classe de rate limit. App-level (code 4
// "Application request limit reached", code 17/32 user/page) é um teto
// coarse-grained da app inteira: backoff maior pra dar folga real. Content
// publishing (codes 80xxx, cota de 50/24h) usa janela menor.
// Defesa em profundidade: markRateLimited (por item) cobre a cota 50/24h; setCooldown
// (global, _ig-cooldown.json) cobre o limite DA APP. Os dois coexistem de propósito.
export const COOLDOWN_APP_LEVEL_MS = 3 * 60 * 60 * 1000; // 3h
export const COOLDOWN_CONTENT_MS = 60 * 60 * 1000; // 1h
export const APP_LEVEL_CODES = new Set([4, 17, 32, 613]);
export function cooldownMsForCode(code) {
  return APP_LEVEL_CODES.has(code) ? COOLDOWN_APP_LEVEL_MS : COOLDOWN_CONTENT_MS;
}

// Diversidade e expiração da fila.
export const TOPIC_CAP = numEnv("IG_TOPIC_CAP", 1);
export const STALE_DAYS = numEnv("IG_STALE_DAYS", 2);
export const STALE_DAYS_EVERGREEN = numEnv("IG_STALE_DAYS_EVERGREEN", 30);
// Feed parado: alerta se nada foi postado há mais de IG_FEED_STALL_H horas.
export const STALL_H = numEnv("IG_FEED_STALL_H", 48);
