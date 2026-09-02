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
  feed: [],       // { postId, type, caption, slides:[url], createdAt, apiCalls }
  stories: [],    // { postId, videoUrl, createdAt, apiCalls }
  reels: [],      // { postId, videoUrl, caption, createdAt, apiCalls }
  fbPhotos: {},   // Facebook Pages: id -> { url, published, createdAt } (fotos unpublished do album)
  fbfeed: [],     // Facebook Pages: { postId, message, photos:[url], createdAt } (posts do feed)
  quotaUsage: 0,
  deleted: [],    // postIds marcados como apagados (pra ig-detect-deleted)
  // Contagem de chamadas Graph API em DUAS dimensoes:
  //  - callCount/callsByKind: ciclo atual (desde o ultimo publish). Cada
  //    postagem "fecha" e registra quantas chamadas custou (medida POR POST).
  //  - callLog: timestamps (ms) de TODAS as chamadas Graph, pra calcular o
  //    acumulado da ultima HORA contra ~200 (o limite real do code 4 da Meta).
  callCount: 0,
  callsByKind: {},
  callLog: [],    // [ms, ms, ...] timestamps das chamadas Graph (janela 1h)
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
