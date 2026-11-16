// GET /painel-setlist: painel privado do contador do gerador de setlist do Ibirapuera.
// Só abre com usuário e senha (HTTP Basic Auth, segredos PAINEL_USUARIO e PAINEL_SENHA do Cloudflare Pages, nunca no
// git): sem credencial certa responde 401 e o navegador pede; sem os segredos responde 503 e nunca abre. O antigo
// acesso por ?k=<chave> não existe mais. Com ?json=1 devolve só os números (é o que a página busca a cada 30 s).
import { ler } from "./_lib/contador.js";
import { acesso, DESAFIO } from "./_lib/painel-acesso.js";
import { lerNomes } from "./_lib/contador-nomes.js";
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
  const porta = await acesso(request, env);
  if (porta === "falta") return resposta("Painel fechado: falta configurar usuário e senha.", 503, "text/plain; charset=utf-8");
  if (porta !== "ok") {
    const r = resposta("Acesso restrito: informe usuário e senha.", 401, "text/plain; charset=utf-8");
    r.headers.set("WWW-Authenticate", DESAFIO);
    return r;
  }
  const json = url.searchParams.has("json");
  if (!env.CONTADOR_DB) {
    const msg = "Falta ligar o banco: no Cloudflare Pages, crie o binding D1 chamado CONTADOR_DB apontando pro banco setlist-contador e faça um novo deploy.";
    return json ? resposta(JSON.stringify({ erro: msg }), 503, "application/json") : html(pagina(aviso(msg), false), 503);
  }
  try {
    const [d, nomes] = await Promise.all([ler(env.CONTADOR_DB), lerNomes(env.CONTADOR_DB)]);
    d.nomes = nomes;
    return json ? resposta(JSON.stringify(d), 200, "application/json") : html(pagina(desenhar(d)));
  } catch (e) {
    const msg = "O banco do contador não respondeu. Atualize a página em instantes.";
    console.log("painel-setlist: leitura falhou", e?.message);
    return json ? resposta(JSON.stringify({ erro: msg }), 503, "application/json") : html(pagina(aviso(msg), false), 503);
  }
}
