// Lê um setlist do setlist.fm (API oficial, chave em /Users/andrehz/.setlistfm-key) e grava setlist.json.
// Uso: node reels-especiais/setlist-dom/busca.mjs [id]   (padrão: Eddie, Ibirapuera 22/11/2026)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
export const ID_HOJE = "2372101f";
const chave = () => fs.readFileSync(path.join(os.homedir(), ".setlistfm-key"), "utf8").trim();

export async function buscar(id = ID_HOJE) {
  const r = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${id}`, { headers: { "x-api-key": chave(), Accept: "application/json" } });
  if (!r.ok) throw new Error(`setlist.fm ${r.status}`);
  const x = await r.json();
  const musicas = [];
  for (const s of x.sets?.set || []) for (const m of s.song || []) {
    if (m.tape || !m.name) continue; // intro gravada não entra
    musicas.push({ nome: m.name, bis: s.encore || 0, cover: m.cover?.name || null, info: m.info || null });
  }
  return { id, url: x.url, lastUpdated: x.lastUpdated, versionId: x.versionId, musicas };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await buscar(process.argv[2] || ID_HOJE);
  fs.writeFileSync(path.join(dir, "setlist.json"), JSON.stringify(s, null, 2) + "\n");
  console.log(s.musicas.length, "músicas,", Math.max(0, ...s.musicas.map((m) => m.bis)), "bis, atualizado", s.lastUpdated);
}
