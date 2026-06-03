// One-time: traz TODOS os itens do archive de volta pro index.json.
//
// Motivo: ate 2026-06-03 o merge-curated.mjs tinha trava de contagem
// (TOP_KEEP=30). Materia curada de assunto antigo (pubDate velho) nascia fora
// dos 30 e ia direto pro archive, sumindo da tela. Removida a trava, nada mais
// precisa ficar escondido no archive.
//
// O que faz:
//   1. Le todos os media/news/archive/<ym>.json
//   2. Pra cada item nao-duplicado, recria media/news/items/<id>.json (corpo)
//      e injeta a metadata (sem body_pt) no index.json
//   3. Reordena o index por pubDate desc (mesma regra do merge)
//   4. Esvazia os arquivos do archive (git preserva o conteudo antigo = backup)
//
// Uso: node scripts/news/restore-archived.mjs [--dry]
// Reversivel: git checkout -- media/news/

import fs from "node:fs/promises";
import path from "node:path";

const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");
const ITEMS_DIR = path.join(NEWS_DIR, "items");

const DRY = process.argv.includes("--dry");

// Separa corpo (vai pra items/<id>.json) da metadata (vai pro index.json).
function splitItem(it) {
  const { body_pt, ...meta } = it;
  return { meta, body: { id: it.id, body_pt: body_pt || "" } };
}

async function main() {
  const indexDoc = JSON.parse(await fs.readFile(INDEX_PATH, "utf8"));
  const indexIds = new Set(indexDoc.items.map((i) => i.id));

  const files = (await fs.readdir(ARCHIVE_DIR)).filter((f) => f.endsWith(".json"));
  const restored = [];
  const skippedDup = [];

  for (const f of files) {
    const doc = JSON.parse(await fs.readFile(path.join(ARCHIVE_DIR, f), "utf8"));
    for (const it of doc.items || []) {
      if (indexIds.has(it.id)) { skippedDup.push(it.id); continue; }
      const { meta, body } = splitItem(it);
      if (!DRY && body.body_pt) {
        await fs.writeFile(path.join(ITEMS_DIR, `${body.id}.json`), JSON.stringify(body, null, 2));
      }
      indexDoc.items.push(meta);
      indexIds.add(it.id);
      restored.push(it.id);
    }
  }

  // mesma ordenacao do merge: pubDate desc
  indexDoc.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  indexDoc.updated = new Date().toISOString();

  if (!DRY) {
    await fs.writeFile(INDEX_PATH, JSON.stringify(indexDoc, null, 2));
    // esvazia o archive (estrutura preservada, git guarda o conteudo antigo)
    for (const f of files) {
      const doc = JSON.parse(await fs.readFile(path.join(ARCHIVE_DIR, f), "utf8"));
      await fs.writeFile(
        path.join(ARCHIVE_DIR, f),
        JSON.stringify({ month: doc.month || f.replace(".json", ""), items: [] }, null, 2),
      );
    }
  }

  console.log(`${DRY ? "[DRY] " : ""}restaurados: ${restored.length} | duplicatas puladas: ${skippedDup.length}`);
  console.log(`index final: ${indexDoc.items.length} itens`);
}

main().catch((e) => { console.error(e); process.exit(1); });
