// Cloudflare Worker que serve de proxy entre a Claude routine remota
// (Anthropic Cloud) e a API do GitHub pra disparar o workflow
// news-merge.yml via repository_dispatch.
//
// Motivo: a routine roda em sandbox com allowlist de rede e o PAT do
// GitHub nao deve ficar exposto no prompt da routine. Esse worker
// guarda o PAT em variavel de ambiente (encriptada pela Cloudflare) e
// repassa o dispatch. Tambem cria um gist privado como fallback caso
// o dispatch falhe, pra nao perder o conteudo curado.
//
// Endpoint: POST /news-merge-dispatch
//   Headers:
//     Content-Type: application/json
//     X-Routine-Secret: <ROUTINE_SECRET do worker>
//   Body: { "curated": [ { id, titulo_pt, intro_pt, corpo_pt, tags }, ... ] }
//
// Env vars necessarias (configurar no painel CF Worker > Settings > Variables):
//   GH_PAT          — Personal Access Token fine-grained com Contents:write em setlists-pj-ev
//   ROUTINE_SECRET  — string aleatoria pra autenticar a routine (qualquer coisa >= 32 chars)
//
// Respostas:
//   200 { ok: true, dispatch_status: 204, gist_url, gist_id }
//   200 { ok: false, dispatch_status: <code>, gist_url, gist_id, dispatch_body }  // dispatch falhou, gist preservado
//   400 { error: "..." }  // payload invalido
//   401 { error: "unauthorized" }  // X-Routine-Secret ausente ou errado
//   502 { error: "github api unreachable", detail }  // network
//
// Deploy: Dashboard CF > Workers > Create Worker > Quick Edit > paste content.

const REPO_OWNER = "andrehz4";
const REPO_NAME = "setlists-pj-ev";
const EVENT_TYPE = "news-curated";
const UA = "setlists-pj-news-merge-dispatch/1.0";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ error: "method not allowed, use POST" }, 405);
    }

    // 1. auth
    const secret = request.headers.get("X-Routine-Secret");
    if (!env.ROUTINE_SECRET || secret !== env.ROUTINE_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }
    if (!env.GH_PAT) {
      return json({ error: "worker mal configurado: GH_PAT ausente" }, 500);
    }

    // 2. parse + validate body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: "json invalido", detail: e.message }, 400);
    }
    const curated = body?.curated;
    if (!Array.isArray(curated) || curated.length === 0) {
      return json({ error: "body deve ter { curated: [...] } com pelo menos 1 item" }, 400);
    }
    // validacao leve de shape
    for (const it of curated) {
      if (!it || typeof it !== "object") return json({ error: "curated tem item nao-objeto" }, 400);
      if (typeof it.id !== "string" || !it.id) return json({ error: "curated tem item sem id" }, 400);
      if (typeof it.titulo_pt !== "string" || !it.titulo_pt) return json({ error: `item ${it.id} sem titulo_pt` }, 400);
      if (typeof it.corpo_pt !== "string" || it.corpo_pt.length < 100) return json({ error: `item ${it.id} com corpo_pt curto demais` }, 400);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "Z");
    const gistFilename = `news-curated-${stamp}.json`;

    // 3. salva gist privado como fallback (sempre, antes do dispatch)
    let gistUrl = null, gistId = null;
    try {
      const gistResp = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${env.GH_PAT}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": UA,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `setlists-pj-ev routine curated fallback (${stamp}, ${curated.length} items)`,
          public: false,
          files: { [gistFilename]: { content: JSON.stringify(curated, null, 2) } },
        }),
      });
      if (gistResp.ok) {
        const g = await gistResp.json();
        gistUrl = g.html_url;
        gistId = g.id;
      } else {
        // nao quebra o fluxo, mas registra
        const errText = await gistResp.text();
        console.warn("gist create failed:", gistResp.status, errText.slice(0, 200));
      }
    } catch (e) {
      console.warn("gist create exception:", e.message);
    }

    // 4. dispatch
    let dispatchStatus, dispatchBody = "";
    try {
      const dispatchResp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`, {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${env.GH_PAT}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": UA,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: EVENT_TYPE,
          client_payload: { curated, gist_url: gistUrl, gist_id: gistId },
        }),
      });
      dispatchStatus = dispatchResp.status;
      if (dispatchStatus !== 204) {
        dispatchBody = (await dispatchResp.text()).slice(0, 500);
      }
    } catch (e) {
      return json({
        error: "github api unreachable",
        detail: e.message,
        gist_url: gistUrl,
        gist_id: gistId,
      }, 502);
    }

    // 5. resposta
    const ok = dispatchStatus === 204;
    return json({
      ok,
      dispatch_status: dispatchStatus,
      dispatch_body: ok ? undefined : dispatchBody,
      gist_url: gistUrl,
      gist_id: gistId,
      items: curated.length,
    }, 200);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
