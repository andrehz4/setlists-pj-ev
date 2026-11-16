// GET /painel-setlist?k=<chave>: painel privado do contador do gerador de setlist do Ibirapuera.
// Só abre com a chave do segredo PAINEL_SETLIST_CHAVE (Cloudflare Pages, nunca no git). Sem chave certa responde 404,
// igual a uma página que não existe. Com &json=1 devolve só os números (é o que a página busca a cada 30 s).
import { ler, chaveConfere } from "./_lib/contador.js";
import { desenhar } from "./_lib/painel-setlist-desenho.js";
import { pagina, aviso } from "./_lib/painel-setlist-pagina.js";

const CABECALHOS = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
const resposta = (corpo, status, tipo) => new Response(corpo, { status, headers: { ...CABECALHOS, "Content-Type": tipo } });
const html = (corpo, status = 200) => resposta(corpo, status, "text/html; charset=utf-8");

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!chaveConfere(url.searchParams.get("k"), env?.PAINEL_SETLIST_CHAVE)) return resposta("Not found", 404, "text/plain; charset=utf-8");
  const json = url.searchParams.has("json");
  if (!env.CONTADOR_DB) {
    const msg = "Falta ligar o banco: no Cloudflare Pages, crie o binding D1 chamado CONTADOR_DB apontando pro banco setlist-contador e faça um novo deploy.";
    return json ? resposta(JSON.stringify({ erro: msg }), 503, "application/json") : html(pagina(aviso(msg), false), 503);
  }
  try {
    const d = await ler(env.CONTADOR_DB);
    return json ? resposta(JSON.stringify(d), 200, "application/json") : html(pagina(desenhar(d)));
  } catch (e) {
    const msg = "O banco do contador não respondeu. Atualize a página em instantes.";
    console.log("painel-setlist: leitura falhou", e?.message);
    return json ? resposta(JSON.stringify({ erro: msg }), 503, "application/json") : html(pagina(aviso(msg), false), 503);
  }
}
