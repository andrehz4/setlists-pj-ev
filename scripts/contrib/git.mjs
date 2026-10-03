// Commit + push: delega pro módulo único (scripts/lib/git.mjs). No --dry não faz nada.
import { commitAndPush as commitAndPushGit } from "../lib/git.mjs";

export function commitAndPush(paths, mensagem, { dry = false, tentativas = 3 } = {}) {
  return commitAndPushGit(paths, mensagem, { dry, tentativas });
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
