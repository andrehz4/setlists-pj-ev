// Smoke test do token + escopos do Instagram. NAO publica nada.
//
// Roda 2 chamadas:
//   1. GET /me?fields=id,username,account_type
//      Valida que token e IG_USER_ID batem com conta tester (@smufdpj).
//      Se retornar 200 com username correto, o token tem instagram_basic.
//
//   2. GET /<IG_USER_ID>/content_publishing_limit?fields=quota_usage,config
//      Endpoint que SO funciona se o token tem instagram_content_publish.
//      Se retornar 200, voce pode publicar. Se retornar erro de permissao,
//      o token foi gerado sem esse escopo (refazer gerar token marcando
//      a permissao).
//
// Uso local:
//   $env:IG_USER_ID = "17841414148425536"
//   $env:IG_ACCESS_TOKEN = "<token completo>"
//   node scripts/publish/smoke-test.mjs
//
// Tambem da pra rodar via workflow_dispatch (em breve sera adicionado
// como input no publish-instagram.yml com mode=smoke).

import got from "got";

const API_BASE = "https://graph.instagram.com/v21.0";

function mask(s, keep = 6) {
  if (!s) return "(vazio)";
  if (s.length <= keep * 2) return "(...)";
  return `${s.slice(0, keep)}...${s.slice(-keep)} (len ${s.length})`;
}

async function get(path, params) {
  const url = `${API_BASE}${path}`;
  const res = await got(url, {
    searchParams: params,
    throwHttpErrors: false,
    responseType: "json",
    timeout: { request: 20000 },
  });
  return { status: res.statusCode, body: res.body };
}

async function main() {
  const userId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!userId || !token) {
    console.error("FALTA: IG_USER_ID e IG_ACCESS_TOKEN no env.");
    console.error("Set local:");
    console.error('  $env:IG_USER_ID = "17841414148425536"');
    console.error('  $env:IG_ACCESS_TOKEN = "<token completo>"');
    process.exit(2);
  }

  console.log(`[smoke] IG_USER_ID = ${userId}`);
  console.log(`[smoke] TOKEN      = ${mask(token)}`);
  console.log("");

  // === TESTE 1: validar token + identidade ===
  console.log("[teste 1/2] GET /me (valida token + instagram_basic)...");
  const r1 = await get("/me", {
    fields: "id,username,account_type",
    access_token: token,
  });

  if (r1.status >= 400) {
    console.error(`  ❌ FALHOU (${r1.status}):`, JSON.stringify(r1.body, null, 2));
    console.error("");
    console.error("  Causa provavel: token invalido ou expirado.");
    console.error("  Acao: gerar token novo no painel Meta.");
    process.exit(1);
  }
  console.log(`  ✓ OK: username=@${r1.body.username}, type=${r1.body.account_type}, id=${r1.body.id}`);

  if (r1.body.id !== userId) {
    console.warn(`  ⚠ ATENCAO: o id retornado pelo token (${r1.body.id}) e diferente do IG_USER_ID configurado (${userId}).`);
    console.warn("  Acao: corrigir o IG_USER_ID em GH Secrets pra bater com o do token.");
  }

  if (r1.body.account_type !== "BUSINESS") {
    console.warn(`  ⚠ ATENCAO: account_type=${r1.body.account_type}. Pra publicar via API, precisa BUSINESS.`);
  }

  console.log("");

  // === TESTE 2: validar escopo de publishing ===
  console.log("[teste 2/2] GET /<id>/content_publishing_limit (valida instagram_content_publish)...");
  const r2 = await get(`/${r1.body.id}/content_publishing_limit`, {
    fields: "quota_usage,config",
    access_token: token,
  });

  if (r2.status >= 400) {
    console.error(`  ❌ FALHOU (${r2.status}):`, JSON.stringify(r2.body, null, 2));
    console.error("");
    const msg = r2.body?.error?.message || "";
    if (/permission/i.test(msg) || /scope/i.test(msg)) {
      console.error("  Causa: token NAO tem o escopo 'instagram_content_publish'.");
      console.error("  Acao: voltar ao painel Meta -> Instagram -> API Setup ->");
      console.error("    Generate token, MARCAR 'instagram_content_publish' nas");
      console.error("    permissoes, gerar de novo, atualizar GH Secret.");
    } else {
      console.error("  Causa nao identificada. Confere a mensagem acima.");
    }
    process.exit(1);
  }

  const cfg = r2.body.config || {};
  const usage = (r2.body.quota_usage != null) ? r2.body.quota_usage : "?";
  const cap = cfg.quota_total || 50;
  console.log(`  ✓ OK: usado ${usage}/${cap} posts nas ultimas 24h.`);
  console.log("");
  console.log("[smoke] TUDO PASSOU. Token funciona, escopos OK, pronto pra publicar.");
}

main().catch((e) => {
  console.error("[smoke] FATAL:", e.message || e);
  process.exit(1);
});
