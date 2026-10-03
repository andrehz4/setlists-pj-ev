// Gravação do index.json do site, única pros três scripts que publicam notícia (merge-curated,
// fetch-news e community-fetch fora do modo routine). Antes os coletores cortavam o index em 30 e
// arquivavam sem o corpo da matéria; agora todos seguem a regra do merge-curated.
import fs from "node:fs/promises";
import path from "node:path";
import { NEWS_DIR } from "../config.mjs";
import { lerEstado } from "../lib/estado.mjs";

export const INDEX_PATH = path.join(NEWS_DIR, "index.json");
export const ITEMS_DIR = path.join(NEWS_DIR, "items");
export const ARCHIVE_DIR = path.join(NEWS_DIR, "archive");

// Sem teto por contagem: tudo que foi curado fica visível (o site pagina). SAFETY_CAP é só rede de
// segurança contra crescimento patológico, não esconde matéria.
export const SAFETY_CAP = 2000;

const porData = (a, b) => new Date(b.pubDate) - new Date(a.pubDate);

// Novos no topo, dedupe por id. Passou do teto: arquiva o resto mais antigo, nunca os novos (matéria
// nova de assunto antigo, com pubDate velho, não pode nascer escondida).
export function mesclarIndex(novos, atuais, cap = SAFETY_CAP) {
  const map = new Map();
  for (const it of novos) map.set(it.id, it);
  for (const it of atuais) if (!map.has(it.id)) map.set(it.id, it);
  const merged = [...map.values()].sort(porData);
  if (merged.length <= cap) return { finalItems: merged, overflow: [] };
  const freshIds = new Set(novos.map((i) => i.id));
  const fresh = merged.filter((i) => freshIds.has(i.id));
  const rest = merged.filter((i) => !freshIds.has(i.id));
  const keepN = Math.max(0, cap - fresh.length);
  return { finalItems: [...fresh, ...rest.slice(0, keepN)].sort(porData), overflow: rest.slice(keepN) };
}

// Item leve (sem body_pt) volta a ter o corpo lido de items/<id>.json.
export async function hydrateBody(it) {
  if (it.body_pt) return it;
  try {
    const body = JSON.parse(await fs.readFile(path.join(ITEMS_DIR, `${it.id}.json`), "utf8"));
    return { ...it, body_pt: body.body_pt || "" };
  } catch (e) {
    if (e.code !== "ENOENT") console.warn(`[index] items/${it.id}.json ilegível, arquivando sem corpo: ${e.message}`);
    return it;
  }
}

// Excedente vai pro archive/AAAA-MM.json com o corpo inline (o site não carrega o archive no início);
// o items/<id>.json deles sai.
export async function arquivar(overflow) {
  if (overflow.length === 0) return;
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const hydrated = await Promise.all(overflow.map(hydrateBody));
  const byMonth = new Map();
  for (const it of hydrated) {
    const ym = (it.pubDate || new Date().toISOString()).slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym).push(it);
  }
  for (const [ym, items] of byMonth) {
    const p = path.join(ARCHIVE_DIR, `${ym}.json`);
    const existing = await lerEstado(p, { items: [] });
    const seenIds = new Set((existing.items || []).map((x) => x.id));
    const arr = [...(existing.items || []), ...items.filter((x) => !seenIds.has(x.id))];
    await fs.writeFile(p, JSON.stringify({ month: ym, items: arr }, null, 2));
  }
  for (const it of hydrated) {
    await fs.unlink(path.join(ITEMS_DIR, `${it.id}.json`)).catch((e) => {
      if (e.code !== "ENOENT") console.warn(`[index] não apagou items/${it.id}.json: ${e.message}`);
    });
  }
}

// body_pt vai pra items/<id>.json; o index.json fica leve, só metadata (first paint rápido).
export async function gravarIndex(finalItems) {
  await fs.mkdir(ITEMS_DIR, { recursive: true });
  const lightItems = [];
  for (const it of finalItems) {
    const { body_pt, ...meta } = it;
    if (body_pt) await fs.writeFile(path.join(ITEMS_DIR, `${it.id}.json`), JSON.stringify({ id: it.id, body_pt }, null, 2));
    lightItems.push(meta);
  }
  await fs.writeFile(INDEX_PATH, JSON.stringify({ updated: new Date().toISOString(), items: lightItems }, null, 2));
  return lightItems;
}

// Fluxo completo: mescla, arquiva o excedente e grava. Devolve { finalItems, overflow }.
export async function publicarNoIndex(novos, atuais) {
  const { finalItems, overflow } = mesclarIndex(novos, atuais);
  await arquivar(overflow);
  await gravarIndex(finalItems);
  return { finalItems, overflow };
}
