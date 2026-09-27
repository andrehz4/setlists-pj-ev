// GET /sitemap-forum.xml: todos os tópicos do fórum, pra o Google achar as páginas /t/<id>.
import { API, sitemapXml, cabecalhosApi } from "./_lib/forum-seo.js";
import { comCache, ligado, texto, indisponivel } from "./_lib/cache.js";

const POR_PAGINA = 50;
const MAX_PAGINAS = 20; // 1.000 tópicos; o limite da API é 30 chamadas/min

export async function onRequestGet(context) {
  if (!ligado(context.env)) return context.next();
  return comCache(context, 21600, async () => {
    const topicos = [];
    for (let p = 1; p <= MAX_PAGINAS; p++) {
      const url = `${API}/forum/topics?page=${p}&per_page=${POR_PAGINA}&sort=activity`;
      const r = await fetch(url, { headers: cabecalhosApi(context.request) }).catch(() => null);
      if (!r?.ok) {
        if (p === 1) return indisponivel();
        break;
      }
      const j = await r.json();
      topicos.push(...j.items);
      if (topicos.length >= j.total || j.items.length < POR_PAGINA) break;
    }
    return texto(sitemapXml(topicos), 200, "application/xml; charset=utf-8");
  });
}
