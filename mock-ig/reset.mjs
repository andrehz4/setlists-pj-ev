// Zera o store do mock (feed, stories, containers, quota). NAO toca na fila
// real do projeto (_publish-queue.json). Uso: node mock-ig/reset.mjs

import { reset, STORE_PATH } from "./store.mjs";

reset();
console.log(`[mock-ig] store zerado: ${STORE_PATH}`);
