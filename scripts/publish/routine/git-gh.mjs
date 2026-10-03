// Comandos git e gh do auto-merge da routine, e as regras de quem/onde pode mesclar.
import { execSync } from "node:child_process";

export const REPO = process.env.GITHUB_REPOSITORY || "andrehz4/setlists-pj-ev";
export const BRANCH_PREFIX = "claude/news-routine-";
export const ALLOWED_PATH_PREFIX = "media/news/";
// Logins do GitHub autorizados a deixar commits que serao auto-mesclados.
// "claude" e a conta oficial @claude da Anthropic (so populada via email
// verificado noreply@anthropic.com). andrehz4 e terra-gentil sao as contas
// do dono, pra permitir operacao manual.
export const ALLOWED_COMMITTER_LOGINS = new Set(["claude", "andrehz4", "terra-gentil"]);

export function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}
export function shTry(cmd) {
  try { return { ok: true, out: sh(cmd) }; }
  catch (e) {
    return { ok: false, err: (e.stderr ? e.stderr.toString() : "") || e.message };
  }
}

export async function listRoutineBranches() {
  const out = sh(`gh api "/repos/${REPO}/branches?per_page=100" --jq '.[].name'`);
  return out.split("\n").map((s) => s.trim()).filter((b) => b.startsWith(BRANCH_PREFIX));
}

export function getCommitsToValidate(branch) {
  // Lista todos os commits em origin/<branch> que ainda nao estao em origin/main.
  // Esses sao os commits novos que serao mesclados.
  const out = sh(`git log --reverse --pretty=format:%H origin/main..origin/${branch}`);
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function getCommitterLogin(sha) {
  // GitHub API retorna committer.login com o login do user GitHub correspondente
  // ao email do commit, SO se esse email estiver verificado naquela conta.
  // Email forjado retorna null. Essa e a validacao nao-forjavel.
  const out = shTry(`gh api "/repos/${REPO}/commits/${sha}" --jq '.committer.login // empty'`);
  if (!out.ok) return null;
  return out.out.trim() || null;
}
