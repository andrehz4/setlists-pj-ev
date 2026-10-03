// Denylist perpétua: posts apagados do IG nunca voltam (_deleted-from-ig.json).
import fs from "node:fs/promises";
import { lerEstado, comLista } from "../../lib/estado.mjs";
import { naRaiz } from "../../config.mjs";

const DENYLIST_PATH = naRaiz("media/news/_deleted-from-ig.json");

// Denylist permanente de items apagados do IG (manualmente pelo Andre ou
// detectados via GET /<post-id> retornando 404). Tombstone PERPETUO: nunca
// expira, nunca e podado pelo pruneOldPosted. Garante que post deletado
// JAMAIS volta ao feed, mesmo se:
//   - alguem editar o queue.json removendo postedAt
//   - o item sair do queue (apos 30d) e a curadoria re-criar item com mesmo id
//   - a routine sonnet enqueue de novo
export async function readDenylist() {
  // Ausente = lista vazia; corrompida = derruba (a denylist é perpétua, não pode sumir em silêncio)
  const doc = await lerEstado(DENYLIST_PATH, { deleted: [], updatedAt: null }, { valida: comLista("deleted") });
  return { deleted: doc.deleted, updatedAt: doc.updatedAt || null };
}

export async function writeDenylist(denylist) {
  const sorted = {
    deleted: [...denylist.deleted].sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt)),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(DENYLIST_PATH, JSON.stringify(sorted, null, 2));
}

// Adiciona item a denylist se ainda nao estiver. Idempotente.
// Retorna true se foi adicionado agora, false se ja existia.
export function addToDenylist(denylist, { itemId, postId = null, reason = "manual", deletedAt = null }) {
  if (!itemId) return false;
  const existing = denylist.deleted.find((d) => d.itemId === itemId);
  if (existing) return false;
  denylist.deleted.push({
    itemId,
    postId,
    reason,
    deletedAt: deletedAt || new Date().toISOString(),
  });
  return true;
}

export function removeFromDenylist(denylist, itemId) {
  const before = denylist.deleted.length;
  denylist.deleted = denylist.deleted.filter((d) => d.itemId !== itemId);
  return before !== denylist.deleted.length;
}

export function isDenied(denylist, itemId) {
  if (!denylist || !Array.isArray(denylist.deleted)) return false;
  return denylist.deleted.some((d) => d.itemId === itemId);
}
