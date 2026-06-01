// Visao da CURADORIA: o ponto da esteira onde se decide o que vai pro feed.
//
// A Claude do schedule (routine) le media/news/_pending.json (candidatos crus
// coletados pelo News fetch), escolhe o que presta, traduz/reescreve e dispara
// o merge, que enfileira em _publish-queue.json e grava no index.json. Esse
// modulo le os tres lados pra mostrar, READ-ONLY:
//
//   - pending:  candidatos crus aguardando a curadoria (_pending.json)
//   - picked:   o que a ULTIMA rodada de curadoria enfileirou (queuedAt recente)
//   - rejected: o que a Claude curou mas falhou na validacao do merge
//               (_rejected-curated.json). NAO inclui rejeicao editorial: o que
//               a Claude descartou por gosto so permanece em pending.
//
// Nao escreve nada, nao dispara curadoria, nao toca a fila.

import fs from "node:fs/promises";
import path from "node:path";
import { readQueue } from "../scripts/publish/queue.mjs";

const NEWS_DIR = path.resolve("media/news");
const PENDING_PATH = path.join(NEWS_DIR, "_pending.json");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const REJECTED_PATH = path.join(NEWS_DIR, "_rejected-curated.json");

// janela (ms) pra agrupar itens da fila como "mesma rodada" de curadoria:
// o merge enfileira a leva toda com queuedAt quase identico.
const ROUND_WINDOW_MS = 20 * 60 * 1000;

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return fallback; }
}

// Mesmo criterio do resto do mock: prefixo do id e o sinal canonico de tipo.
function kindOf(item) {
  const id = item.id || "";
  if (item.kind === "community-spotlight" || id.startsWith("cs-")) return "spotlight";
  if (item.kind === "community-digest" || id.startsWith("cd-")) return "digest";
  return "regular";
}

// Card de um candidato cru aguardando curadoria.
function pendingCard(p) {
  return {
    id: p.id,
    title: p.title_orig || p.title_pt || p.id,
    source: p.sourceLabel || p.source || "?",
    group: p.group || null,
    pubDate: p.pubDate || null,
    fetchedAt: p.fetchedAt || null,
    hasImg: !!p.img,
    url: p.url || null,
  };
}

// Card de um item ja curado e enfileirado (hidratado com o index).
function pickedCard(idx, q) {
  return {
    id: q.id,
    kind: kindOf(idx || q),
    title: (idx && (idx.title_ig || idx.title_pt || idx.titulo_pt)) || q.id,
    intro: (idx && idx.intro_pt) || "",
    tags: (idx && idx.tags) || [],
    img: (idx && idx.img) || null,
    source: (idx && idx.sourceLabel) || null,
    queuedAt: q.queuedAt || null,
    posted: !!q.postedAt,
  };
}

// Le os tres lados da curadoria. READ-ONLY.
export async function loadCuration() {
  const pendingDoc = await readJson(PENDING_PATH, { items: [], generatedAt: null });
  const indexDoc = await readJson(INDEX_PATH, { items: [] });
  const rejectedDoc = await readJson(REJECTED_PATH, { rejected: [], updatedAt: null });
  const queue = await readQueue();
  const byId = new Map((indexDoc.items || []).map((x) => [x.id, x]));

  // --- aguardando (input): candidatos crus, mais recentes primeiro ---
  const pending = (pendingDoc.items || [])
    .map(pendingCard)
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  // --- pego (output): a ultima leva enfileirada (queuedAt recente) ---
  const withTs = (queue.items || [])
    .filter((q) => q.queuedAt)
    .sort((a, b) => new Date(b.queuedAt) - new Date(a.queuedAt));
  let picked = [];
  let lastRoundAt = null;
  if (withTs.length) {
    lastRoundAt = withTs[0].queuedAt;
    const cut = new Date(lastRoundAt).getTime() - ROUND_WINDOW_MS;
    picked = withTs
      .filter((q) => new Date(q.queuedAt).getTime() >= cut)
      .map((q) => pickedCard(byId.get(q.id), q));
  }

  // --- rejeitado por validacao (raro; arquivo pode nem existir) ---
  const rejected = (rejectedDoc.rejected || []).map((r) => ({
    id: r.id || "?",
    reason: r.reason || "validacao falhou",
    at: r.at || null,
  }));

  return {
    pending,
    picked,
    rejected,
    lastRoundAt,
    pendingGeneratedAt: pendingDoc.generatedAt || null,
    counts: { pending: pending.length, picked: picked.length, rejected: rejected.length },
  };
}
