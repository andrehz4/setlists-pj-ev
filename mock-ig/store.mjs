// Estado do mock IG. Persistido em JSON pra sobreviver entre processos
// (o server roda separado do pipeline). Generico: nao sabe nada do projeto
// que esta publicando, so guarda containers e posts no formato da Graph API.

import fs from "node:fs";
import path from "node:path";

const STORE_PATH = process.env.MOCK_IG_STORE
  || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "_store.json");

const EMPTY = () => ({
  seq: 0,
  containers: {}, // id -> { type, image_url, video_url, children, caption, status_code, polls, createdAt }
  feed: [],       // { postId, type, caption, slides:[url], createdAt }
  stories: [],    // { postId, videoUrl, createdAt }
  quotaUsage: 0,
  deleted: [],    // postIds marcados como apagados (pra ig-detect-deleted)
});

export function load() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const doc = JSON.parse(raw);
    return { ...EMPTY(), ...doc };
  } catch {
    return EMPTY();
  }
}

export function save(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function reset() {
  const fresh = EMPTY();
  save(fresh);
  return fresh;
}

export function nextId(store, prefix) {
  store.seq += 1;
  return `${prefix}_${store.seq}`;
}

export { STORE_PATH };
