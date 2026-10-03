// Usado no modo "routine": depois que a Claude routine curatela os itens
// pendentes (le media/news/_pending.json e gera um JSON curado),
// esse script merge no media/news/index.json final.
//
// Uso:
//   echo '[{...curated items...}]' | node scripts/news/merge-curated.mjs --stdin
//   node scripts/news/merge-curated.mjs --file caminho/curated.json
//
// Formato esperado dos items curados (array):
// [
//   { "id": "<sha10>", "titulo_pt": "...", "intro_pt": "...", "corpo_pt": "...", "tags": [...] }
// ]
// O resto (url, source, img, pubDate) eh pego do _pending.json pelo id.

import fs from "node:fs/promises";
import path from "node:path";
import { writeStepSummary } from "./_summary.mjs";
import { lerEstado } from "../lib/estado.mjs";
import { NEWS_DIR } from "../config.mjs";
import { INDEX_PATH, mesclarIndex, arquivar, gravarIndex } from "./index-site.mjs";
import { triar } from "./curadoria/triagem.mjs";
import { enfileirarNoInstagram, registrarRecusados } from "./curadoria/fila-e-registros.mjs";

const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");

const args = process.argv.slice(2);
const USE_STDIN = args.includes("--stdin");
const FILE_IDX = args.indexOf("--file");
const FILE = FILE_IDX >= 0 ? args[FILE_IDX + 1] : null;

function sair(msg) {
  console.error(msg);
  process.exit(2);
}

async function lerEntrada() {
  let raw;
  if (USE_STDIN) {
    raw = await new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
      process.stdin.on("error", reject);
    });
  } else if (FILE) {
    raw = await fs.readFile(FILE, "utf8");
  } else {
    sair("uso: --stdin OU --file <caminho.json>");
  }
  let curated;
  try {
    curated = JSON.parse(raw);
  } catch (e) {
    sair(`JSON invalido: ${e.message}`);
  }
  if (!Array.isArray(curated)) sair("input deve ser um array JSON de itens curados");
  return curated;
}

async function main() {
  const curatedInput = await lerEntrada();
  const pendingDoc = await lerEstado(PENDING_PATH, { items: [] });
  const pendingById = new Map((pendingDoc.items || []).map((p) => [p.id, p]));
  const indexDoc = await lerEstado(INDEX_PATH, { updated: null, items: [] });
  const seen = await lerEstado(SEEN_PATH, {});

  const { newItems, acceptedIds, warnings, rejected } = triar(curatedInput, pendingById, seen);
  console.log(`[merge] aceitos: ${newItems.length} / ${curatedInput.length}`);
  // Fila do IG (publishAt = agora). Lida em media/news/_publish-queue.json pelo publish-instagram.yml.
  await enfileirarNoInstagram(newItems, indexDoc.items || [], warnings);

  // Index: tudo que foi curado fica visível (teto 2000 só como rede de segurança).
  const { finalItems, overflow } = mesclarIndex(newItems, indexDoc.items || []);
  await arquivar(overflow);
  const remainingPending = (pendingDoc.items || []).filter((p) => !acceptedIds.has(p.id));
  await gravarIndex(finalItems);
  await fs.writeFile(SEEN_PATH, JSON.stringify(seen, null, 2));
  await registrarRecusados(rejected);
  if (remainingPending.length === 0) {
    await fs.unlink(PENDING_PATH).catch(() => {}); // já pode não existir
    console.log(`[merge] _pending.json zerado (deletado).`);
  } else {
    await fs.writeFile(PENDING_PATH, JSON.stringify({ generatedAt: pendingDoc.generatedAt, items: remainingPending }, null, 2));
    console.log(`[merge] _pending.json mantem ${remainingPending.length} aguardando.`);
  }
  console.log(`[merge] index.json: ${finalItems.length} items.`);

  const porFonte = new Map();
  for (const it of newItems) {
    const lbl = it.sourceLabel || it.source || "desconhecida";
    porFonte.set(lbl, (porFonte.get(lbl) || 0) + 1);
  }
  const sourceResults = [...porFonte.entries()].map(([label, count]) => ({ label, count, error: null }));
  await writeStepSummary({
    title: "News merge-curated",
    meta: { recebidos: curatedInput.length, aceitos: newItems.length, rejeitados: curatedInput.length - newItems.length },
    stats: {
      "publicados agora": newItems.length,
      "total no index": finalItems.length,
      "pending restante": remainingPending.length,
      "arquivados (overflow)": overflow.length,
    },
    sources: sourceResults.length ? sourceResults : undefined,
    warnings: warnings.length ? warnings : undefined,
    curated: newItems,
  });
}

// Watchdog + exit explicito: mesmo motivo do fetch-news.mjs. got/sharp deixam
// socket no event loop que pode segurar o processo por minutos. Aborta em 4min
// (timeout do workflow e 5min) e encerra na hora quando o trabalho termina.
const WATCHDOG_MS = 4 * 60 * 1000;
const watchdog = setTimeout(() => {
  console.error(`[merge] WATCHDOG: passou de ${WATCHDOG_MS / 60000}min sem terminar, abortando`);
  process.exit(2);
}, WATCHDOG_MS);
watchdog.unref();

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[merge] FATAL:", e);
    process.exit(1);
  });
