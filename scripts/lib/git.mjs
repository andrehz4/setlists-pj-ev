// Commit + push dos arquivos de estado, único pro projeto todo (antes eram 5 cópias).
// Sempre aborta rebase que falhou (rebase pendurado deixa o repo inoperante e as tentativas
// seguintes falham igual). Quem sabe reconciliar estado (run-publish com a fila) passa
// onRebaseConflict: reescreve os arquivos a partir de origin/main + memória e devolve true.
import { spawnSync } from "node:child_process";

export function git(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falhou: ${r.stderr || r.stdout}`);
  return r.stdout;
}

export function gitTry(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return { ok: r.status === 0, out: r.stdout, err: r.stderr || r.stdout };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const temStaged = () => spawnSync("git", ["diff", "--cached", "--quiet"]).status !== 0;

export async function commitAndPush(paths, mensagem, opts = {}) {
  const { dry = false, tentativas = 3, onRebaseConflict = null, esperaBaseMs = 2000 } = opts;
  if (dry) {
    console.log(`[git] skip (dry/no-git): ${mensagem}`);
    return false;
  }
  gitTry(["config", "user.name", process.env.GIT_AUTHOR_NAME || "pj-news-bot"]);
  gitTry(["config", "user.email", process.env.GIT_AUTHOR_EMAIL || "bot@setlists-pj.local"]);
  const stage = () => { for (const p of paths) gitTry(["add", p]); };
  stage();
  if (!temStaged()) {
    console.log(`[git] nada pra commitar: ${mensagem}`);
    return false;
  }
  git(["commit", "-m", mensagem]);

  for (let i = 0; i < tentativas; i++) {
    const pull = gitTry(["pull", "--rebase", "--autostash"]);
    if (!pull.ok) {
      console.warn(`[git] pull rebase falhou (try ${i + 1}): ${pull.err.trim()}`);
      gitTry(["rebase", "--abort"]);
      if (onRebaseConflict) {
        console.warn(`[git] reconciliando estado com origin/main (try ${i + 1})`);
        if (await onRebaseConflict()) {
          stage();
          if (temStaged()) git(["commit", "-m", `${mensagem} (reconciliado)`]);
          continue;
        }
        console.warn("[git] reconciliação falhou, tentando push direto");
      }
    }
    const push = gitTry(["push"]);
    if (push.ok) {
      console.log(`[git] push OK (try ${i + 1}): ${mensagem}`);
      return true;
    }
    console.warn(`[git] push falhou (try ${i + 1}/${tentativas}): ${push.err.trim()}`);
    await espera(esperaBaseMs * (i + 1) + Math.floor(Math.random() * 1000));
  }
  throw new Error(`git push falhou após ${tentativas} tentativas: ${mensagem}`);
}
