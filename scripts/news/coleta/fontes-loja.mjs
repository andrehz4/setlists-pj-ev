// Fontes oficiais com texto e imagem já prontos (pulam o scrape do extract.mjs): loja Shopify e
// pearljam.com/news. Devolvem SEMPRE { items, error }.
import got from "got";
import { UA_ROBO } from "../../config.mjs";

const pedir = (url, accept, timeout = 15000) => got(url, {
  headers: { "User-Agent": UA_ROBO, "Accept": accept },
  timeout: { request: timeout },
  retry: { limit: 1 },
});

// HTML mínimo -> texto (descrição de produto da loja).
const textoDoHtml = (html) => String(html || "")
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/p>/gi, "\n\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

// Loja oficial (endpoint JSON nativo do Shopify): só produtos publicados nos últimos SHOP_NEW_DAYS,
// sem vale-presente. Vai com preText (descrição limpa) e preImg (1ª imagem).
const SHOP_NEW_DAYS = 21;
export async function fetchShopifyItems(src) {
  try {
    const res = await pedir(src.url, "application/json").json();
    const products = Array.isArray(res?.products) ? res.products : [];
    const cutoff = Date.now() - SHOP_NEW_DAYS * 24 * 60 * 60 * 1000;
    const items = products
      .filter((p) => new Date(p.published_at || p.created_at || 0).getTime() >= cutoff
        && !(p.product_type || "").toLowerCase().includes("gift"))
      .map((p) => {
        const bodyText = textoDoHtml(p.body_html);
        const variants = (p.variants || []).map((v) => v.title).filter(Boolean).join(" / ");
        const text = [`Produto: ${p.title}`, p.vendor ? `Vendor: ${p.vendor}` : "",
          variants ? `Formatos: ${variants}` : "", "", bodyText].filter(Boolean).join("\n");
        return {
          sourceId: src.id,
          sourceLabel: src.label,
          group: src.group,
          title: p.title,
          link: `https://shop.pearljam.com/products/${p.handle || String(p.id)}`,
          pubDate: p.published_at || p.created_at || new Date().toISOString(),
          snippet: bodyText.slice(0, 800),
          alwaysRelevant: true,
          kind: "shop", // vai pro _pending: a curadoria aplica a regra de loja
          preText: text,
          preImg: p.images?.[0]?.src || p.variants?.[0]?.featured_image?.src || null,
        };
      });
    return { items, error: null };
  } catch (e) {
    console.warn(`[shopify] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}

// pearljam.com/news: o RSS é quebrado, mas o HTML traz JSON inline com "articles": [...].
// O texto vem do excerpt (o scrape do site devolve um overlay de SMS).
export async function fetchPjcomNewsItems(src) {
  try {
    const html = await pedir(src.url, "text/html", 20000).text();
    const m = html.match(/"articles"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
    if (!m) {
      console.warn(`[pjcom-news] JSON inline nao encontrado em ${src.url}`);
      return { items: [], error: "JSON inline de articles nao encontrado (o site mudou o HTML?)" };
    }
    let articles;
    try {
      articles = JSON.parse(m[1]);
    } catch (e) {
      console.warn(`[pjcom-news] JSON parse falhou: ${e.message}`);
      return { items: [], error: `JSON inline ilegivel: ${e.message}` };
    }
    const items = (articles || []).slice(0, 15).map((a) => {
      const excerpt = (a.excerpt || a.description || "").slice(0, 800);
      return {
        sourceId: src.id,
        sourceLabel: src.label,
        group: src.group,
        title: (a.title || "").trim(),
        link: `https://pearljam.com/news/${a.slug || a.id}`,
        pubDate: a.publish_date || a.created_at || new Date().toISOString(),
        snippet: excerpt,
        alwaysRelevant: true,
        kind: "pjcom-news",
        preImg: a.square_image_file || a.image_file || null,
        preText: excerpt,
      };
    });
    return { items, error: null };
  } catch (e) {
    console.warn(`[pjcom-news] ${src.id} falhou: ${e.message}`);
    return { items: [], error: e.message };
  }
}
