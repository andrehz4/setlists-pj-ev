// Cloudflare Worker que faz proxy de chamadas pra www.reddit.com.
// Motivo: GitHub Actions runners caem em range de IP bloqueado pelo Reddit (403).
// O Worker roda do edge da CF (IPs distintos), e adiciona um User-Agent
// identificavel pra nao ser tratado como bot generico.
//
// Endpoints suportados (espelha estrutura do Reddit):
//   GET /r/<sub>/top.json?t=day&limit=25
//   GET /r/<sub>/top.json?t=week&limit=25
//   GET /r/<sub>/hot.json?limit=25
//   GET /r/<sub>/new.json?limit=25
//   GET /r/<sub>/about.json
//
// Seguranca leve: aceita somente paths /r/<sub>/<endpoint>.json com
// caracteres seguros, e bloqueia anything else. Sem auth, mas se quiser
// proteger pode adicionar um shared-secret via header.
//
// Deploy: cole este arquivo no Dashboard CF → Workers → Create Worker → Quick Edit.

const REDDIT_BASE = "https://www.reddit.com";
const ALLOWED_PATH_RX = /^\/r\/[a-zA-Z0-9_]{2,30}\/(top|hot|new|about|rising|controversial)\.json$/;
const UA = "setlists-pj-news-bot/1.0 (by /u/andre, contact: setlists-pj-ev.pages.dev)";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, 405);
    }

    if (!ALLOWED_PATH_RX.test(url.pathname)) {
      return json({ error: "path not allowed", path: url.pathname }, 400);
    }

    const target = REDDIT_BASE + url.pathname + url.search;

    let resp;
    try {
      resp = await fetch(target, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/json",
        },
        cf: {
          cacheTtl: 60,
          cacheEverything: true,
        },
      });
    } catch (e) {
      return json({ error: "upstream fetch failed", detail: e.message }, 502);
    }

    if (!resp.ok) {
      return json({ error: "upstream error", status: resp.status, target }, resp.status);
    }

    const body = await resp.text();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
