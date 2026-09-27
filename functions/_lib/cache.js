// Cache na borda do Cloudflare: poupa o Railway e cobre o banco do fórum dormindo.
// So guarda resposta 200; erro nunca fica em cache.
export async function comCache(context, segundos, gerar) {
  const cache = caches.default;
  const chave = new Request(new URL(context.request.url).toString(), { method: "GET" });
  const salvo = await cache.match(chave);
  if (salvo) return salvo;
  const resp = await gerar();
  if (resp.status === 200) {
    resp.headers.set("Cache-Control", `public, max-age=${segundos}`);
    context.waitUntil(cache.put(chave, resp.clone()));
  }
  return resp;
}

export const ligado = env => env?.FORUM_SEO === "1";

export const texto = (corpo, status, tipo = "text/html; charset=utf-8", extra = {}) =>
  new Response(corpo, { status, headers: { "Content-Type": tipo, ...extra } });

// 503 + Retry-After: o Google volta depois sem tirar a página do índice
export const indisponivel = () =>
  texto("Fórum indisponível, tente de novo em instantes.", 503, "text/plain; charset=utf-8", { "Retry-After": "600" });
