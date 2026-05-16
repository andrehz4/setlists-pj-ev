// Opcao B: override manual de imagem por item. Le
// media/news/image-overrides.json (mapa id -> url da imagem boa).
// Usado quando a fonte automatica vem ruim e a opcao A (busca na
// pagina) nao resolve (ex: pearljam.com, que so serve thumb cortado).
//
// Fluxo: o Andre acha um post com foto ruim, manda a URL da imagem
// boa, a gente adiciona "<id>": "<url>" no JSON. Na proxima geracao
// do slide a imagem boa e baixada, usada e persistida no cache.

import fs from "node:fs/promises";
import path from "node:path";

const OVERRIDES_PATH = path.resolve("media/news/image-overrides.json");

let _cache = null;

async function loadOverrides() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(OVERRIDES_PATH, "utf8");
    const doc = JSON.parse(raw);
    _cache = doc && typeof doc === "object" ? doc : {};
  } catch {
    _cache = {};
  }
  return _cache;
}

// Retorna a URL de override pra esse id, ou null. Ignora chaves
// que comecam com "_" (sao notas/documentacao, nao ids).
export async function getImageOverrideUrl(id) {
  if (!id) return null;
  const ov = await loadOverrides();
  const url = ov[id];
  if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
  return null;
}
