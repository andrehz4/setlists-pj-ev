// GET /t/<id>: página do tópico legível pelo Google (ver _lib/forum-seo.js).
import { API, idValido, paginaTopico, cabecalhosApi } from "../_lib/forum-seo.js";
import { comCache, ligado, texto, indisponivel } from "../_lib/cache.js";

export async function onRequestGet(context) {
  if (!ligado(context.env)) return context.next();
  const id = context.params.id;
  if (!idValido(id)) return texto("Tópico não encontrado", 404, "text/plain; charset=utf-8");
  return comCache(context, 3600, async () => {
    let r;
    try {
      r = await fetch(`${API}/forum/topics/${id}?page=1&per_page=50`, { headers: cabecalhosApi(context.request) });
    } catch {
      r = null;
    }
    if (r?.status === 404) return texto("Tópico não encontrado", 404, "text/plain; charset=utf-8");
    // 503 + Retry-After: o Google volta depois sem tirar a página do índice
    if (!r?.ok) return indisponivel();
    return texto(paginaTopico(await r.json()), 200);
  });
}
