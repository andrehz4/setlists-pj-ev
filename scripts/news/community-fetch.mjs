// Pipeline da comunidade (r/pearljam). Uso: node scripts/news/community-fetch.mjs --mode=digest|spotlight|both
//   [--curator=routine|gemini] [--dry-run]. Entra no MESMO index.json das notícias, com source própria;
//   dedupe no seen.json com prefixo cd- (digest, 1 por dia) e cs- (spotlight, o post não repete).
//   Digest: agrega os posts mais votados do dia. Spotlight: o melhor post de fã com imagem.
//   routine (padrão nos workflows): só pendura no _pending.json; gemini: cura e publica direto.
// Partes em scripts/news/comunidade/.

import fs from "node:fs/promises";
import path from "node:path";
import { ensureImgDir } from "./image-cache.mjs";
import { prunePendingByLogs } from "./prune-curated.mjs";
import { writeStepSummary } from "./_summary.mjs";
import { lerEstado } from "../lib/estado.mjs";
import { argVal as lerArg } from "../lib/args.mjs";
import { NEWS_DIR } from "../config.mjs";
import { INDEX_PATH, publicarNoIndex } from "./index-site.mjs";
import { runDigest } from "./comunidade/digest.mjs";
import { runSpotlight } from "./comunidade/spotlight.mjs";
import { buildSearchSummary, alertarRedditFora } from "./comunidade/resumo.mjs";

const args = process.argv.slice(2);
const argVal = (name) => lerArg(args, name);
const MODE = (argVal("mode") || "both").toLowerCase();
const DRY = args.includes("--dry-run");
const CURATOR_NAME = (argVal("curator") || process.env.NEWS_CURATOR || "gemini").toLowerCase();

if (!["digest", "spotlight", "both"].includes(MODE)) {
  console.error(`[community] modo invalido: '${MODE}'. Use: digest | spotlight | both`);
  process.exit(1);
}
if (!["gemini", "routine"].includes(CURATOR_NAME)) {
  console.error(`[community] curator invalido: '${CURATOR_NAME}'. Use: gemini | routine`);
  process.exit(1);
}
const IS_ROUTINE = CURATOR_NAME === "routine";

const SEEN_PATH = path.join(NEWS_DIR, "seen.json");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");

async function writeJson(p, data) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

// Roda digest e/ou spotlight; a falha de um não impede o outro.
async function coletar(ctx) {
  const results = [];
  const etapas = [["digest", runDigest], ["spotlight", runSpotlight]];
  for (const [nome, fn] of etapas) {
    if (MODE !== nome && MODE !== "both") continue;
    try {
      const r = await fn(ctx);
      if (r) results.push(r);
    } catch (err) {
      console.warn(`[community] ${nome} falhou: ${err.message}`);
      ctx.warnings.push(`${nome} falhou: ${err.message}`);
    }
  }
  return results;
}

async function main() {
  await fs.mkdir(NEWS_DIR, { recursive: true });
  await ensureImgDir();
  const seen = await lerEstado(SEEN_PATH, {});
  const current = await lerEstado(INDEX_PATH, { updated: null, items: [] });
  const currentItems = Array.isArray(current.items) ? current.items : [];
  const pendingDoc = await lerEstado(PENDING_PATH, { items: [] });

  // Poda do _pending (o que a curadoria já julgou sai e vira seen). Muta pendingDoc.items pra
  // digest/spotlight já verem a fila limpa; só persiste em modo routine (é ele que escreve o _pending).
  let prunedCount = 0;
  if (IS_ROUTINE) {
    const pr = await prunePendingByLogs(pendingDoc.items || [], seen);
    if (pr.removedIds.length) {
      pendingDoc.items = pr.kept;
      prunedCount = pr.removedIds.length;
      console.log(`[community] prune: ${prunedCount} item(ns) ja-curado(s) removido(s) do _pending`);
    }
  }
  console.log(`[community] mode=${MODE} | curator=${CURATOR_NAME} | dry=${DRY} | current items: ${currentItems.length} | seen: ${Object.keys(seen).length} | pending: ${(pendingDoc.items || []).length}`);

  const warnings = [];
  const sourceResults = [];
  const results = await coletar({ seen, pendingDoc, warnings, sourceResults, isRoutine: IS_ROUTINE });
  const newItems = results.filter((r) => r._kind === "curated").map((r) => r.item);
  const newPending = results.filter((r) => r._kind === "pending").map((r) => r.pending);
  console.log(`[community] curados agora: ${newItems.length} | pendentes pra routine: ${newPending.length}`);
  if (!DRY) await alertarRedditFora(sourceResults);

  const resumo = (titulo, stats, extra = {}) => writeStepSummary({
    title: titulo,
    meta: { modo: MODE, curator: CURATOR_NAME, dry: DRY },
    stats,
    sources: sourceResults.length ? sourceResults : undefined,
    warnings: warnings.length ? warnings : undefined,
    ...extra,
  });
  const nadaNovo = { extras: [{ heading: "Resultado", body: buildSearchSummary(sourceResults) }] };

  // Modo routine: só pendura no _pending.json (a curadoria remota publica). Não toca o index.
  if (IS_ROUTINE) {
    const items = [...(pendingDoc.items || []), ...newPending];
    if (DRY) {
      console.log("[community] DRY routine, nao escrevendo. Novos pending:");
      console.log(JSON.stringify(newPending, null, 2));
    } else {
      if (newPending.length > 0 || prunedCount > 0) {
        await writeJson(PENDING_PATH, { generatedAt: newPending.length ? new Date().toISOString() : (pendingDoc.generatedAt || null), items });
      }
      await writeJson(SEEN_PATH, seen);
      console.log(newPending.length ? `[community] routine: ${PENDING_PATH} (${items.length} aguardando curadoria)` : "[community] routine: nada novo pra pendurar.");
    }
    await resumo(`Community fetch · routine (${MODE})`,
      { "coletados nesta run": newPending.length, "pending total agora": items.length, "index atual": currentItems.length },
      newPending.length ? { pending: newPending, extras: [{ heading: "Proximo passo", body: "A routine remota le `_pending.json`, cura, e roda `node scripts/news/merge-curated.mjs` pra publicar no `index.json`." }] } : nadaNovo);
    return;
  }

  // Curador direto (gemini): publica no index pela mesma regra do merge-curated.
  if (newItems.length === 0) {
    if (!DRY) await writeJson(SEEN_PATH, seen);
    console.log("[community] nada a publicar.");
    await resumo(`Community fetch · ${CURATOR_NAME} (${MODE})`, { "publicados agora": 0, "index atual": currentItems.length }, nadaNovo);
    return;
  }
  let total = currentItems.length + newItems.length, arquivados = 0;
  if (DRY) {
    console.log("[community] DRY RUN, nao escrevendo arquivos. Novos itens:");
    console.log(JSON.stringify(newItems, null, 2));
  } else {
    const r = await publicarNoIndex(newItems, currentItems);
    total = r.finalItems.length;
    arquivados = r.overflow.length;
    await writeJson(SEEN_PATH, seen);
    console.log(`[community] escrito: ${INDEX_PATH} (${total} items)`);
  }
  await resumo(`Community fetch · ${CURATOR_NAME} (${MODE})`,
    { "publicados agora": newItems.length, "total no index": total, "arquivados (overflow)": arquivados }, { curated: newItems });
}

// Watchdog + exit explicito: mesmo motivo do fetch-news.mjs. got/sharp deixam
// socket no event loop que pode segurar o processo por minutos. Aborta em 6min
// (timeout do workflow e 8min) e encerra na hora quando o trabalho termina.
const WATCHDOG_MS = 6 * 60 * 1000;
const watchdog = setTimeout(() => {
  console.error(`[community] WATCHDOG: passou de ${WATCHDOG_MS / 60000}min sem terminar, abortando`);
  process.exit(2);
}, WATCHDOG_MS);
watchdog.unref();

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[community] FATAL:", e);
    process.exit(1);
  });
