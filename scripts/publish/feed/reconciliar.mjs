// Reconciliação com origin/main depois de conflito de rebase no commit de estado.
// A fila é mesclada por id (news-merge enfileira em paralelo); os demais arquivos de estado são
// exclusivos deste workflow (o concurrency group impede outra run igual), então a versão local
// desta run vence.
import fs from "node:fs/promises";
import { readQueue, writeQueue, mergeQueueStates } from "../queue.mjs";
import { gitTry } from "../../lib/git.mjs";
import { STATE_PATHS } from "./config.mjs";

export function criarReconciliador(queue) {
  return async function reconcileWithRemote() {
    const snapshot = new Map();
    for (const p of STATE_PATHS) {
      try {
        snapshot.set(p, await fs.readFile(p, "utf8"));
      } catch (e) {
        if (e.code !== "ENOENT") console.warn(`[git] snapshot de ${p} falhou: ${e.message}`);
      }
    }
    const f = gitTry(["fetch", "origin"]);
    if (!f.ok) { console.warn(`[git] fetch falhou na reconciliacao: ${f.err}`); return false; }
    const r = gitTry(["reset", "--hard", "origin/main"]);
    if (!r.ok) { console.warn(`[git] reset falhou na reconciliacao: ${r.err}`); return false; }
    let remoteQueue;
    try {
      remoteQueue = await readQueue();
    } catch (e) {
      console.warn(`[git] fila remota ilegível na reconciliação, usando só a local: ${e.message}`);
      remoteQueue = { items: [], postCount: 0 };
    }
    const merged = mergeQueueStates(remoteQueue, queue);
    queue.items = merged.items;
    queue.postCount = merged.postCount;
    await writeQueue(queue);
    for (const [p, content] of snapshot) {
      if (p.endsWith("_publish-queue.json")) continue;
      await fs.writeFile(p, content);
    }
    console.log(`[git] reconciliado: fila mesclada por id (${queue.items.length} itens), demais estados restaurados da run`);
    return true;
  };
}
