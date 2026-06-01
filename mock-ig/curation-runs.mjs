// Historico das RODADAS de curadoria do Claude schedule (routine sonnet).
//
// A routine nao roda como GitHub Action: ela cura os pendentes e COMMITA direto
// na main (autor Claude). A partir de 2026-06 ela tambem grava um LOG por rodada
// em media/news/_curation-log/<TS>.json com tudo que viu: aprovados E todos os
// SKIP com razao, inclusive nas rodadas 100% SKIP (que antes nao deixavam rastro).
//
// Esta aba le DUAS fontes, nesta prioridade:
//   1. logs em _curation-log/ (ricos: aprovados + skips com razao) -> fonte futura
//   2. fallback: commits "curadoria automatica via routine sonnet" (so o que
//      entrou no index) -> enquanto os logs nao comecam a aparecer
// READ-ONLY.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SERVE_ROOT = path.resolve(process.env.MOCK_SERVE_ROOT || process.cwd());
const LOG_DIR = path.join(SERVE_ROOT, "media/news/_curation-log");
const AUTHOR = "Claude";
const GREP = "curadoria automatica";
const INDEX_REL = "media/news/index.json";

function git(...args) {
  return execFileSync("git", args, {
    cwd: SERVE_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function fetchQuiet() { try { git("fetch", "origin", "main", "--quiet"); } catch {} }
function baseRef() {
  try { git("rev-parse", "--verify", "origin/main"); return "origin/main"; } catch { return "HEAD"; }
}
function kindOf(item) {
  const id = item.id || "";
  if (item.kind === "community-spotlight" || id.startsWith("cs-")) return "spotlight";
  if (item.kind === "community-digest" || id.startsWith("cd-")) return "digest";
  return "regular";
}

// ---------- fonte 1: logs de rodada ----------
function readLogFiles() {
  let files = [];
  try { files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".json")); } catch { return []; }
  // nome TS = YYYYMMDD-HHMM, ordena lexicografico == cronologico
  return files.sort().reverse();
}
function parseLog(file) {
  try { return JSON.parse(fs.readFileSync(path.join(LOG_DIR, path.basename(file)), "utf8")); }
  catch { return null; }
}
function logSummary(file) {
  const l = parseLog(file);
  if (!l) return null;
  return {
    ref: file, source: "log",
    date: l.runAt || null,
    marco: l.marco || null,
    pendingTotal: l.pendingTotal ?? (Array.isArray(l.skipped) ? l.skipped.length + (l.approved?.length || 0) : null),
    approvedCount: Array.isArray(l.approved) ? l.approved.length : 0,
    skippedCount: Array.isArray(l.skipped) ? l.skipped.length : 0,
  };
}

// ---------- fonte 2: commits (fallback) ----------
function newIdsIn(hash) {
  let diff = "";
  try { diff = git("show", hash, "--", INDEX_REL); } catch { return []; }
  const ids = [];
  for (const ln of diff.split(/\r?\n/)) {
    const m = ln.match(/^\+\s*"id":\s*"([^"]+)"/);
    if (m) ids.push(m[1]);
  }
  return ids;
}
function listFromCommits(limit) {
  fetchQuiet();
  let out = "";
  try { out = git("log", baseRef(), `--author=${AUTHOR}`, `--grep=${GREP}`, "--format=%H|%aI|%s", `-${limit}`); }
  catch { return []; }
  return out.split(/\r?\n/).filter(Boolean).map((line) => {
    const [hash, dateIso, ...rest] = line.split("|");
    const subject = rest.join("|");
    const mTotal = subject.match(/\((\d+)\s+itens/);
    return {
      ref: hash, source: "commit", date: dateIso, marco: null,
      pendingTotal: null, indexTotal: mTotal ? Number(mTotal[1]) : null,
      approvedCount: newIdsIn(hash).length, skippedCount: null,
    };
  });
}

// Lista as ultimas rodadas. Logs tem prioridade; sem logs, cai nos commits.
export function listCurationRuns(limit = 12) {
  fetchQuiet();
  const logs = readLogFiles().map(logSummary).filter(Boolean);
  if (logs.length) return logs.slice(0, limit);
  return listFromCommits(limit);
}

// Detalhe de uma rodada. ref pode ser um arquivo de log (<TS>.json) ou um hash.
export function curationRunDetail(ref) {
  // log?
  if (/\.json$/.test(ref)) {
    const l = parseLog(ref);
    if (l) {
      return {
        source: "log",
        ref, runAt: l.runAt || null, marco: l.marco || null,
        pendingTotal: l.pendingTotal ?? null,
        distribution: l.distribution || null,
        approved: (l.approved || []).map((a) => ({
          id: a.id, kind: kindOf(a), title: a.titulo || a.title || a.id,
        })),
        skipped: (l.skipped || []).map((s) => ({
          id: s.id, title: s.title || s.titulo || s.id, reason: s.reason || "sem razao registrada",
        })),
      };
    }
  }
  // commit (fallback)
  const ids = newIdsIn(ref);
  let indexAtCommit = { items: [] };
  try { indexAtCommit = JSON.parse(git("show", `${ref}:${INDEX_REL}`)); } catch {}
  const byId = new Map((indexAtCommit.items || []).map((x) => [x.id, x]));
  const approved = ids.map((id) => {
    const it = byId.get(id) || { id };
    return {
      id, kind: kindOf(it),
      title: it.title_ig || it.title_pt || it.titulo_pt || id,
      intro: it.intro_pt || "", tags: it.tags || [], img: it.img || null,
      source: it.sourceLabel || null,
    };
  });
  let subject = "";
  try { subject = git("show", "-s", "--format=%s", ref).trim(); } catch {}
  return { source: "commit", ref, subject, approved, skipped: [] };
}
