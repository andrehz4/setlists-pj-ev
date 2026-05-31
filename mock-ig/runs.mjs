// Le as ultimas runs do workflow publish-instagram via gh CLI e extrai o que
// cada uma TENTOU postar (ids dos itens), pra o front simular como aquele post
// teria ido pro Instagram. Fiel ao historico real (inclusive runs que falharam
// no rate limit). Exige gh CLI logado (ja esta no ambiente).

import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

const WORKFLOW = "publish-instagram.yml";

function gh(args) {
  return exec("gh", args, { maxBuffer: 20 * 1024 * 1024 }).then((r) => r.stdout);
}

// Lista as ultimas N runs (metadata leve).
export async function listRuns(limit = 5) {
  const out = await gh(["run", "list", "--workflow=" + WORKFLOW, "--limit", String(limit),
    "--json", "databaseId,displayTitle,status,conclusion,createdAt,event"]);
  const runs = JSON.parse(out);
  return runs.map((r) => ({
    id: String(r.databaseId),
    status: r.conclusion || r.status,
    createdAt: r.createdAt,
    event: r.event,
  }));
}

// Extrai do log de uma run os ids que ela mexeu (maduros, postados, backoff).
// Retorna { id, status, createdAt, batches:[{type, ids:[...], outcome}] }.
export async function runDetail(runId, indexById) {
  let log = "";
  try {
    log = await gh(["run", "view", String(runId), "--log"]);
  } catch (e) {
    // --log so funciona em runs concluidas; tenta --log-failed como fallback
    try { log = await gh(["run", "view", String(runId), "--log-failed"]); }
    catch { throw new Error("nao consegui ler o log da run " + runId); }
  }

  const lines = log.split(/\r?\n/);
  const idRx = /\b(cd-\d{8}|cs-[0-9a-f]{8,}|[0-9a-f]{10})\b/g;

  // sinais por batch: "tipo=X: N maduros", depois "OK tipo=X ..." ou
  // "FALHA tipo=X ..." e "rate-limited ate ... items A, B, C em backoff".
  const batches = [];
  let cur = null;
  let outcome = "desconhecido";
  let cooldownAbort = false;

  for (const raw of lines) {
    const ln = raw.replace(/^.*?\[publish\]\s*/, "");
    if (/cooldown global ativo/.test(ln)) cooldownAbort = true;
    const mat = ln.match(/tipo=(\w+):\s*(\d+)\s*maduros/);
    if (mat) {
      cur = { type: mat[1], count: Number(mat[2]), ids: [], outcome: "pendente" };
      batches.push(cur);
      continue;
    }
    if (/OK tipo=/.test(ln) && cur) cur.outcome = "publicado";
    if (/FALHA tipo=/.test(ln) && cur) cur.outcome = "rate-limit";
    // a lista de ids EXATA aparece na linha de backoff (rate limit). Tambem
    // tem na linha "rate-limited ate ... items A, B, C em backoff".
    const backoff = ln.match(/(?:items|rate-limited.*?items)\s+(.+?)\s+em backoff/);
    if (backoff && cur) {
      cur.ids = (backoff[1].match(idRx) || []);
      cur.exact = true; // ids confiaveis (vieram da linha de backoff)
    }
  }

  // batch sem ids exatos (publicou sem logar a lista, ou abortou): nao temos
  // os ids precisos. Deixa vazio e marca, pra o front avisar.
  for (const b of batches) {
    if (b.ids.length === 0) { b.ids = []; b.exact = false; }
  }

  return { id: String(runId), cooldownAbort, batches };
}
