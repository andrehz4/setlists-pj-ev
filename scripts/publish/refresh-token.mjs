// Refresh do Instagram User Access Token long-lived (60 dias).
// Tokens do fluxo "Instagram with Instagram Login" expiram em 60 dias
// mas podem ser refreshados depois de pelo menos 24h de vida. Idealmente
// roda 1x por mes pra renovar antes de expirar.
//
// Uso local:
//   $env:IG_ACCESS_TOKEN = "<token atual>"
//   node scripts/publish/refresh-token.mjs
//
// O script imprime os primeiros/ultimos 8 chars do novo token e o tempo
// de validade. Pra adotar o novo, copie do output e rode:
//   gh secret set IG_ACCESS_TOKEN --repo andrehz4/setlists-pj-ev
//
// Em CI (workflow_dispatch refresh-ig-token.yml), o proprio runner ja
// atualiza o secret via gh CLI com PAT escopo actions:write.

import got from "got";

const API_BASE = "https://graph.instagram.com";

async function refreshLongLivedToken(currentToken) {
  const res = await got(`${API_BASE}/refresh_access_token`, {
    searchParams: {
      grant_type: "ig_refresh_token",
      access_token: currentToken,
    },
    timeout: { request: 20000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  if (res.statusCode >= 400) {
    const msg = res.body?.error?.message || `HTTP ${res.statusCode}`;
    throw new Error(`refresh falhou: ${msg}`);
  }
  return res.body;
}

function maskToken(t) {
  if (!t || t.length < 16) return "(invalido)";
  return `${t.slice(0, 8)}...${t.slice(-8)}`;
}

async function main() {
  const current = process.env.IG_ACCESS_TOKEN;
  if (!current) {
    console.error("IG_ACCESS_TOKEN nao definido no env. Set primeiro:");
    console.error('  $env:IG_ACCESS_TOKEN = "<token atual>"');
    process.exit(2);
  }

  console.log(`[refresh] token atual: ${maskToken(current)} (len ${current.length})`);
  const r = await refreshLongLivedToken(current);
  if (!r.access_token) {
    console.error("[refresh] resposta sem access_token:", r);
    process.exit(1);
  }
  const expiresInDays = Math.round((r.expires_in || 0) / 86400);
  console.log(`[refresh] OK. novo token: ${maskToken(r.access_token)} (len ${r.access_token.length})`);
  console.log(`[refresh] valido por ${expiresInDays} dias (expires_in=${r.expires_in}s)`);

  // Se rodando em GH Actions com GH_TOKEN com escopo de secrets, atualiza
  // o secret automaticamente. Detecta via GITHUB_ACTIONS=true + GH_TOKEN
  // disponivel.
  if (process.env.GITHUB_ACTIONS === "true" && process.env.GH_TOKEN) {
    const { spawnSync } = await import("node:child_process");
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo) {
      console.warn("[refresh] GITHUB_REPOSITORY nao definido, pulando auto-update");
    } else {
      const proc = spawnSync("gh", ["secret", "set", "IG_ACCESS_TOKEN", "--repo", repo, "--body", r.access_token], {
        encoding: "utf8",
        env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN },
      });
      if (proc.status === 0) {
        console.log(`[refresh] IG_ACCESS_TOKEN atualizado no GH Secrets de ${repo}`);
      } else {
        console.error(`[refresh] falha no gh secret set: ${proc.stderr || proc.stdout}`);
        process.exit(1);
      }
    }
  } else {
    console.log("");
    console.log("[refresh] pra adotar, rode manualmente:");
    console.log("  gh secret set IG_ACCESS_TOKEN --repo andrehz4/setlists-pj-ev");
    console.log("  (cole o token completo quando perguntado)");
    console.log("");
    console.log("token completo (NAO commite nem cole em chat publico):");
    console.log(r.access_token);
  }
}

main().catch((e) => {
  console.error("[refresh] FATAL:", e.message || e);
  process.exit(1);
});

export { refreshLongLivedToken };
