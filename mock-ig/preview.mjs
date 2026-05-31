// Simulador de post/story: pega o material REAL (fila de publicacao + index)
// e gera a previa de como ficaria no Instagram, sem publicar nada.
//
// READ-ONLY sobre os dados de producao: so LE _publish-queue.json, index.json
// e items/<id>.json. NAO escreve na fila, NAO marca postedAt, NAO chama a
// Graph API. O slide gerado vai pra media/news/_preview/ (gitignored),
// separado dos slides de producao. Pegar um item pra simular nao tira ele da
// fila nem muda status: o material real fica intacto.

import fs from "node:fs/promises";
import path from "node:path";
import { readQueue } from "../scripts/publish/queue.mjs";
import { buildSlide } from "../scripts/publish/slide-image.mjs";
import { buildSingleCaption, buildCarouselCaption } from "../scripts/publish/instagram.mjs";
import { getCurrentCycleColor } from "../scripts/publish/color-cycle.mjs";

const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const ITEMS_DIR = path.join(NEWS_DIR, "items");
const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");
const STORIES_DIR = path.join(NEWS_DIR, "instagram-stories");
export const PREVIEW_DIR = path.join(NEWS_DIR, "_preview");

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}

// Classifica por kind (quando presente) E pelo prefixo do id, que e o sinal
// canonico: cd-* = community-digest, cs-* = community-spotlight, resto =
// regular. No index os digest as vezes nao carregam o campo kind, so o id.
function kindOf(item) {
  const id = item.id || "";
  if (item.kind === "community-spotlight" || id.startsWith("cs-")) return "spotlight";
  if (item.kind === "community-digest" || id.startsWith("cd-")) return "digest";
  return "regular";
}

function card(item) {
  return {
    id: item.id,
    kind: kindOf(item),
    title: item.title_ig || item.title_pt || item.id,
    img: item.img || null,
    pubDate: item.pubDate || null,
  };
}

// Lista o material disponivel pra simular, separado por tipo e status.
// READ-ONLY. Retorna { pending:{regular,spotlight,digest}, posted:{...}, stories }.
export async function loadCandidates() {
  const queue = await readQueue();
  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  const byId = new Map((indexDoc.items || []).map((x) => [x.id, x]));

  // hidrata leve: o card so precisa de title/kind/img, que estao no index.
  // item da fila que nao esta mais no index e ignorado no card (raro).
  function bucket(filterFn) {
    const out = { regular: [], spotlight: [], digest: [] };
    for (const q of queue.items.filter(filterFn)) {
      const idx = byId.get(q.id);
      if (!idx) continue;
      const k = kindOf(idx);
      if (out[k].length < 3) out[k].push(card(idx));
    }
    return out;
  }

  const pending = bucket((q) => !q.postedAt);
  // postados: mais recentes primeiro
  const postedItems = queue.items.filter((q) => q.postedAt)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  const posted = { regular: [], spotlight: [], digest: [] };
  for (const q of postedItems) {
    const idx = byId.get(q.id);
    if (!idx) continue;
    const k = kindOf(idx);
    if (posted[k].length < 3) posted[k].push({ ...card(idx), postId: q.postId });
  }

  // stories: os MP4 mais recentes que o Action ja gerou
  let stories = [];
  try {
    const files = (await fs.readdir(STORIES_DIR)).filter((f) => f.endsWith(".mp4")).sort().reverse();
    stories = files.slice(0, 3).map((f) => ({
      name: f,
      videoUrl: `/media/news/instagram-stories/${f}`,
      label: f.replace(".mp4", ""),
    }));
  } catch {}

  return { pending, posted, stories };
}

// Hidrata um item: index (ou archive) + body_pt de items/<id>.json.
async function hydrate(id) {
  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  let idx = (indexDoc.items || []).find((x) => x.id === id);
  if (!idx) {
    // fallback no archive (item ja saiu do index)
    try {
      const months = await fs.readdir(ARCHIVE_DIR);
      for (const m of months) {
        if (!m.endsWith(".json")) continue;
        const doc = await readJson(path.join(ARCHIVE_DIR, m), { items: [] });
        const found = (doc.items || []).find((x) => x.id === id);
        if (found) { idx = found; break; }
      }
    } catch {}
  }
  if (!idx) return null;
  let body = idx.body_pt || "";
  if (!body) {
    try { body = JSON.parse(await fs.readFile(path.join(ITEMS_DIR, `${id}.json`), "utf8")).body_pt || ""; } catch {}
  }
  return { ...idx, body_pt: body };
}

// Gera o slide + caption de UM item, como sairia no proximo post (mesma cor
// do ciclo). Grava em _preview/, nao em producao.
export async function previewSlide(id) {
  const item = await hydrate(id);
  if (!item) throw new Error(`item ${id} nao encontrado em index/archive`);

  const queue = await readQueue();
  const cycleColor = getCurrentCycleColor(queue.postCount);
  item._cycleColor = cycleColor;
  item._tarjaColor = cycleColor;

  const r = await buildSlide(item, { outDir: PREVIEW_DIR });
  const fileName = path.basename(r.path);
  const caption = buildSingleCaption(item);

  return {
    id,
    kind: kindOf(item),
    title: item.title_pt || id,
    slideUrl: `/media/news/_preview/${fileName}`,
    caption,
    reused: r.reused,
  };
}

// Story: por ora devolve um MP4 ja gerado pelo Action (sem re-render). A
// geracao on-demand (buildStoryVideo) fica como passo opcional no server.
export function previewStoryExisting(name) {
  const safe = path.basename(name);
  return { videoUrl: `/media/news/instagram-stories/${safe}`, name: safe };
}
