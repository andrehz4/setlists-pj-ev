// CLI manual pra adicionar item a denylist do IG. Use quando voce apagou
// o post no app e quer GARANTIR que ele NUNCA mais volte ao feed
// (sem esperar a auto-deteccao do proximo cron).
//
// Uso:
//   node scripts/publish/ban.mjs <itemId> [razao]
//   node scripts/publish/ban.mjs --unban <itemId>
//   node scripts/publish/ban.mjs --list
//
// Exemplos:
//   node scripts/publish/ban.mjs cs-068fbce93f "post chato"
//   node scripts/publish/ban.mjs cd-20260525
//   node scripts/publish/ban.mjs --unban cs-068fbce93f
//
// Apos rodar local, commitar e dar push pra que o proximo cron veja
// a mudanca. (Banlist mora em media/news/_deleted-from-ig.json.)

import { readQueue, readDenylist, writeDenylist, addToDenylist, removeFromDenylist, isDenied } from "./queue.mjs";

function usage(code = 0) {
  console.log(`Uso:
  node scripts/publish/ban.mjs <itemId> [razao]    # bane item, nunca mais posta
  node scripts/publish/ban.mjs --unban <itemId>    # remove ban
  node scripts/publish/ban.mjs --list              # lista todos os banidos
`);
  process.exit(code);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage(0);

  const denylist = await readDenylist();

  if (args[0] === "--list") {
    if (denylist.deleted.length === 0) {
      console.log("(denylist vazia)");
      return;
    }
    console.log(`${denylist.deleted.length} items banidos:`);
    for (const d of denylist.deleted) {
      console.log(`  ${d.itemId.padEnd(20)} postId=${d.postId || "?"} reason=${d.reason} at=${d.deletedAt}`);
    }
    return;
  }

  if (args[0] === "--unban") {
    const itemId = args[1];
    if (!itemId) usage(1);
    if (!isDenied(denylist, itemId)) {
      console.log(`[ban] ${itemId} nao esta banido, nada a fazer.`);
      return;
    }
    removeFromDenylist(denylist, itemId);
    await writeDenylist(denylist);
    console.log(`[ban] ${itemId} REMOVIDO da denylist.`);
    return;
  }

  const itemId = args[0];
  const reason = args[1] || "manual ban via CLI";
  if (itemId.startsWith("--")) usage(1);

  if (isDenied(denylist, itemId)) {
    console.log(`[ban] ${itemId} ja esta banido, nada a fazer.`);
    return;
  }

  // Tenta pegar postId do queue pra registrar no ban (so pra rastreabilidade)
  let postId = null;
  try {
    const queue = await readQueue();
    const found = queue.items.find((q) => q.id === itemId);
    if (found?.postId) postId = found.postId;
  } catch {}

  addToDenylist(denylist, { itemId, postId, reason });
  await writeDenylist(denylist);
  console.log(`[ban] ${itemId} ADICIONADO a denylist (postId=${postId || "?"}, reason="${reason}").`);
  console.log(`[ban] commit + push: git add media/news/_deleted-from-ig.json && git commit -m "ban: ${itemId}" && git push`);
}

main().catch((e) => {
  console.error("[ban] FATAL:", e.message || e);
  process.exit(1);
});
