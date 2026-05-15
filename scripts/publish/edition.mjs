// Numero de edicao do @smufdpj. Fonte unica de verdade: o
// _story-log.json. Cada dia com publicacao = 1 edicao. Story e
// carrossel do mesmo dia compartilham o mesmo numero.
//
// Regra:
//   - se a data ja tem entrada no story-log: edicao = indice + 1
//   - se ainda nao tem (story do dia ainda nao postou): edicao =
//     total de entradas + 1 (a proxima a ser criada)
//
// Isso garante consistencia: antes do story do dia, um carrossel
// gerado de manha mostra o mesmo numero que o story vai mostrar
// quando postar mais tarde.

import fs from "node:fs/promises";
import path from "node:path";

const STORY_LOG = path.resolve("media/news/instagram-stories/_story-log.json");

// Mesmo calculo de dateKey do run-publish-story.mjs: BRT (UTC-3),
// depois slice ISO. Tem que casar exatamente, senao o numero de
// edicao do carrossel diverge do story em postagens noturnas.
function dateKeyOf(d) {
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const brt = new Date(dt.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

export async function getEditionNumber(date = new Date()) {
  const key = dateKeyOf(date);
  try {
    const raw = await fs.readFile(STORY_LOG, "utf8");
    const log = JSON.parse(raw);
    const entries = Array.isArray(log.entries) ? log.entries : [];
    const idx = entries.findIndex((e) => e.dateKey === key);
    if (idx >= 0) return idx + 1;
    return entries.length + 1;
  } catch {
    return 1;
  }
}
