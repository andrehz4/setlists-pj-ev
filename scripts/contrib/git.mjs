// Commit + push com rebase e retry (mesma lógica do publish-capsula). No --dry não faz nada.

import { spawnSync } from "node:child_process";

const git = (args) => spawnSync("git", args, { encoding: "utf8" });

export async function commitAndPush(paths, mensagem, { dry = false, tentativas = 3 } = {}) {
  if (dry) return console.log(`[git] dry: ${mensagem}`);
  git(["config", "user.name", process.env.GIT_AUTHOR_NAME || "pj-news-bot"]);
  git(["config", "user.email", process.env.GIT_AUTHOR_EMAIL || "bot@setlists-pj.local"]);
  for (const p of paths) git(["add", p]);
  if (git(["diff", "--cached", "--quiet"]).status === 0) return console.log(`[git] nada pra commitar: ${mensagem}`);
  const c = git(["commit", "-m", mensagem]);
  if (c.status !== 0) throw new Error(`git commit: ${c.stderr}`);
  for (let i = 0; i < tentativas; i++) {
    const pull = git(["pull", "--rebase", "--autostash"]);
    if (pull.status !== 0) console.warn(`[git] pull: ${pull.stderr}`);
    if (git(["push"]).status === 0) return console.log(`[git] push ok: ${mensagem}`);
    await new Promise((r) => setTimeout(r, 2000 + i * 1000));
  }
  throw new Error(`git push falhou após ${tentativas} tentativas`);
}

// raw.githubusercontent demora 15 a 40s pra servir arquivo novo; sem esperar, o IG baixa 404.
export async function esperarRaw(url, limiteMs = 90000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    try { if ((await fetch(url, { method: "HEAD" })).ok) return true; } catch { /* tenta de novo */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}
