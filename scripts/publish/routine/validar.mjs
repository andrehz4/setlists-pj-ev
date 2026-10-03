// Validação de segurança do branch da routine (repo PÚBLICO): todo commit com committer.login na
// lista branca (login só existe com e-mail verificado: não é forjável) e diff só em media/news/.
import { sh, shTry, ALLOWED_COMMITTER_LOGINS, ALLOWED_PATH_PREFIX, getCommitsToValidate, getCommitterLogin } from "./git-gh.mjs";

export function validateBranch(branch) {
  // Fetch do branch
  shTry(`git fetch origin ${branch}:refs/remotes/origin/${branch}`);

  const commits = getCommitsToValidate(branch);
  if (commits.length === 0) {
    return { ok: false, reason: "branch sem commits novos vs main" };
  }

  // VALIDACAO 1: cada commit precisa ter committer.login na whitelist
  for (const sha of commits) {
    const login = getCommitterLogin(sha);
    if (!login || !ALLOWED_COMMITTER_LOGINS.has(login)) {
      return {
        ok: false,
        reason: `commit ${sha.slice(0, 7)} tem committer.login="${login || "null"}" (esperado: ${[...ALLOWED_COMMITTER_LOGINS].join(", ")})`,
      };
    }
  }

  // VALIDACAO 2: diff total do branch so pode tocar em media/news/
  const diffFiles = sh(`git diff --name-only origin/main...origin/${branch}`)
    .split("\n").map((s) => s.trim()).filter(Boolean);

  const outside = diffFiles.filter((f) => !f.startsWith(ALLOWED_PATH_PREFIX));
  if (outside.length > 0) {
    return {
      ok: false,
      reason: `arquivos fora de ${ALLOWED_PATH_PREFIX}: ${outside.slice(0, 5).join(", ")}${outside.length > 5 ? ` (+${outside.length - 5})` : ""}`,
    };
  }

  const head = commits[commits.length - 1];
  const commitMsg = sh(`git log -1 --pretty=format:%B origin/${branch}`);

  return { ok: true, head, headShort: head.slice(0, 7), commits, files: diffFiles, commitMsg };
}
