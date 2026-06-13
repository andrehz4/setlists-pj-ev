// Acervo de trechos de clipe pro reel semanal (media/reels-clips/).
// Carrega e valida o clips.json, e casa clipe com noticia por tag, com
// rotacao deterministica por semana (sem Math.random: a escolha e funcao
// de weekSeed + posicao, entao a mesma semana sempre monta o mesmo reel).
//
// Os trechos entram SEMPRE mudos na peca. Sem acervo, quem chama decide o
// fallback (foto com zoom ou fundo fantasma), aqui so devolvemos null.

import fs from "node:fs/promises";
import path from "node:path";

const CLIPS_DIR = path.resolve("media/reels-clips");

// Valida uma entrada do clips.json. Devolve string de erro ou null.
export function validateClipEntry(entry) {
  if (!entry || typeof entry !== "object") return "entrada nao e objeto";
  if (!entry.file || typeof entry.file !== "string") return "campo file obrigatorio";
  if (!/\.mp4$/i.test(entry.file)) return `file deve ser .mp4 (${entry.file})`;
  if (entry.file.includes("/") || entry.file.includes("\\") || entry.file.includes("..")) {
    return `file deve ser nome simples dentro de media/reels-clips/ (${entry.file})`;
  }
  if (!Array.isArray(entry.tags) || entry.tags.length === 0) return `tags obrigatorias (${entry.file})`;
  return null;
}

// Le o acervo. Entrada invalida ou arquivo ausente no disco = warn + skip
// (acervo e curadoria manual do Andre, nao pode derrubar a run).
export async function loadClips({ dir = CLIPS_DIR } = {}) {
  let doc;
  try {
    doc = JSON.parse(await fs.readFile(path.join(dir, "clips.json"), "utf8"));
  } catch (e) {
    console.warn(`[reel-clips] sem clips.json legivel em ${dir}: ${e.message}`);
    return [];
  }
  const entries = Array.isArray(doc?.clips) ? doc.clips : [];
  const out = [];
  for (const entry of entries) {
    const err = validateClipEntry(entry);
    if (err) {
      console.warn(`[reel-clips] entrada invalida ignorada: ${err}`);
      continue;
    }
    const filePath = path.join(dir, entry.file);
    try {
      const st = await fs.stat(filePath);
      if (!st.isFile() || st.size < 1024) throw new Error("arquivo vazio");
    } catch {
      console.warn(`[reel-clips] arquivo ausente, ignorado: ${entry.file}`);
      continue;
    }
    out.push({ ...entry, path: filePath });
  }
  return out;
}

// Seed da semana: numero deterministico derivado da chave ISO (ex "2026-W24").
export function weekSeed(weekKey) {
  let h = 0;
  for (const ch of String(weekKey)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// Escolhe um clipe pro item: prioriza interseccao de tags e clipes ainda nao
// usados neste reel. Empate resolvido por (seed + slot) mod n, que rotaciona
// a escolha de semana em semana. Devolve o clip ou null.
export function pickClipFor(item, clips, { used = new Set(), seed = 0, slot = 0 } = {}) {
  if (!clips || clips.length === 0) return null;
  const itemTags = new Set((item?.tags || []).map((t) => String(t).toLowerCase()));
  const score = (c) => {
    const match = c.tags.some((t) => itemTags.has(String(t).toLowerCase())) ? 2 : 0;
    const fresh = used.has(c.file) ? 0 : 1;
    return match + fresh;
  };
  const best = Math.max(...clips.map(score));
  if (best === 0) return null; // tudo usado e nada casando: melhor sem clipe que repetir
  const pool = clips.filter((c) => score(c) === best);
  const chosen = pool[(seed + slot) % pool.length];
  used.add(chosen.file);
  return chosen;
}
