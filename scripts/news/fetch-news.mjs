// Orquestrador do fetch-news.
// Fluxo: le seen.json/index.json → busca RSS (N fontes) → dedupe → scrape +
// imagem + curator selecionado → merge → escreve index.json/seen.json/archive.
//
// Flags:
//   --curator <anthropic|gemini|routine>  backend de curadoria (default: env NEWS_CURATOR ou anthropic)
//   --dry-run                              nao escreve nada (so imprime resultado)
//   --fixtures                             usa scripts/news/__fixtures__/ em vez de rede (todo)
//   --no-claude                            (compat) alias pra --curator=routine + dry-run
//
// Modos especiais:
//   curator=routine  : itens viram PENDING, sao escritos em media/news/_pending.json
//                      pra Claude routine pegar e curar com merge-curated.mjs depois.

import fs from "node:fs/promises";
import path from "node:path";
import { SOURCES } from "./sources.mjs";
import { ensureImgDir } from "./image-cache.mjs";
import { loadCurator } from "./curators/_shared.mjs";
import { prunePendingByLogs } from "./prune-curated.mjs";
import { writeStepSummary } from "./_summary.mjs";
import { lerEstado } from "../lib/estado.mjs";
import { argVal as lerArg } from "../lib/args.mjs";
import { NEWS_DIR } from "../config.mjs";
import { INDEX_PATH, publicarNoIndex } from "./index-site.mjs";
import { coletarCandidatos } from "./coleta/candidatos.mjs";
import { processarCandidatos } from "./coleta/processar.mjs";

// --- args ---
const args = process.argv.slice(2);
const argVal = (name) => lerArg(args, name);
const DRY = args.includes("--dry-run");
const FIXTURES = args.includes("--fixtures");
const LEGACY_NO_CLAUDE = args.includes("--no-claude");
let CURATOR_NAME = argVal("curator") || process.env.NEWS_CURATOR || "anthropic";
if (LEGACY_NO_CLAUDE) CURATOR_NAME = "routine"; // backward compat

// Teto de itens novos por rodada (vão pro _pending; a routine cura depois). Histórico: 6 -> 3 (05/2026,
// routine estourava o tempo) -> 4 -> 10 (06/2026, fontes dobraram pra ~40). O risco de subir não é este
// job (~40 s), é a routine, que cura TODO o _pending por disparo: o news.yml avisa no Telegram se o
// _pending passar de NEWS_PENDING_ALERT. Backlog crescendo = baixar de volta.
const MAX_NEW_PER_RUN = 10;
const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");

async function writeJson(p, data) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

async function main() {
  await fs.mkdir(NEWS_DIR, { recursive: true });
  await ensureImgDir();
  const curator = await loadCurator(CURATOR_NAME);
  const isRoutineMode = curator.NAME === "routine";

  const seen = await lerEstado(SEEN_PATH, {});
  const current = await lerEstado(INDEX_PATH, { updated: null, items: [] });
  const currentItems = Array.isArray(current.items) ? current.items : [];
  const pendingBefore = await lerEstado(PENDING_PATH, { items: [] });
  let pendingBeforeItems = Array.isArray(pendingBefore.items) ? pendingBefore.items : [];
  // Poda do _pending: tira o que a curadoria já julgou (logs de rodada) e marca seen (prune-curated.mjs).
  if (isRoutineMode) {
    const pr = await prunePendingByLogs(pendingBeforeItems, seen);
    if (pr.removedIds.length) {
      pendingBeforeItems = pr.kept;
      console.log(`[news] prune: ${pr.removedIds.length} item(ns) ja-curado(s) removido(s) do _pending`);
    }
  }
  console.log(`[news] curator: ${curator.LABEL} | fontes: ${SOURCES.length} | seen: ${Object.keys(seen).length} | current: ${currentItems.length} | dry: ${DRY}`);

  const { all, deduped, sourceResults, warnings } = await coletarCandidatos({ seen, pendentes: pendingBeforeItems });
  const fresh = deduped.slice(0, MAX_NEW_PER_RUN);
  const { curated, pending } = await processarCandidatos(fresh, curator, seen, warnings);
  console.log(`[news] curados agora: ${curated.length} | pendentes pra routine: ${pending.length}`);
  const skippedCount = Math.max(0, fresh.length - curated.length - pending.length);
  const comum = { sources: sourceResults, warnings: warnings.length ? warnings : undefined };

  // Modo routine: só empilha no _pending.json (a curadoria remota publica depois). Não toca o index.
  if (isRoutineMode) {
    const newPending = { generatedAt: new Date().toISOString(), items: [...pendingBeforeItems, ...pending] };
    if (DRY) {
      console.log("[news] DRY RUN routine, nao escrevendo arquivos.");
      console.log(JSON.stringify({ pending_total: newPending.items.length, novos: pending.length }, null, 2));
    } else {
      await writeJson(PENDING_PATH, newPending);
      await writeJson(SEEN_PATH, seen); // skipped marcados; pendentes ficam de fora
      console.log(`[news] escrito: ${PENDING_PATH} (${newPending.items.length} aguardando curadoria)`);
    }
    await writeStepSummary({
      title: "News fetch · modo routine (so coleta)",
      meta: { curator: curator.LABEL, fontes: SOURCES.length, dry: DRY },
      stats: {
        "candidatos novos": all.length,
        "coletados nesta run": pending.length,
        "skipped pelo curator": skippedCount,
        "pending total agora": newPending.items.length,
        "index atual": currentItems.length,
      },
      ...comum,
      pending,
      extras: [{ heading: "Proximo passo", body: "A routine remota le `_pending.json`, cura, e roda `node scripts/news/merge-curated.mjs` pra publicar no `index.json`." }],
    });
    return;
  }

  // Curador direto (anthropic/gemini): publica no index pela mesma regra do merge-curated.
  let total = currentItems.length + curated.length, arquivados = 0;
  if (DRY) {
    console.log("[news] DRY RUN, nao escrevendo arquivos.");
    console.log(JSON.stringify({ added: curated.length }, null, 2));
  } else {
    const r = await publicarNoIndex(curated, currentItems);
    total = r.finalItems.length;
    arquivados = r.overflow.length;
    await writeJson(SEEN_PATH, seen);
    console.log(`[news] escrito: ${INDEX_PATH} (${total} items, body em items/)`);
  }
  await writeStepSummary({
    title: "News fetch",
    meta: { curator: curator.LABEL, fontes: SOURCES.length, dry: DRY },
    stats: {
      "candidatos novos": all.length,
      "publicados agora": curated.length,
      "skipped pelo curator": skippedCount,
      "total no index": total,
      "arquivados (overflow)": arquivados,
    },
    ...comum,
    curated,
  });
}

// Watchdog: se o trabalho real travar (socket de feed/scrape pendurado sem
// fechar, download de imagem sem timeout no nivel de socket), aborta com
// mensagem clara em vez de queimar 12min de CI ate o GitHub dar "cancelled"
// opaco. O trabalho normal termina em ~30-45s, entao 8min e folga enorme.
const WATCHDOG_MS = 8 * 60 * 1000;
const watchdog = setTimeout(() => {
  console.error(`[news] WATCHDOG: passou de ${WATCHDOG_MS / 60000}min sem terminar, abortando`);
  process.exit(2);
}, WATCHDOG_MS);
watchdog.unref();

// process.exit explicito: o main() resolve em segundos, mas got/rss-parser/sharp
// podem deixar um socket no event loop que demora minutos pra fechar (ou nunca
// fecha). Como todas as escritas de arquivo sao await, e seguro encerrar aqui.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[news] FATAL:", e);
    process.exit(1);
  });
