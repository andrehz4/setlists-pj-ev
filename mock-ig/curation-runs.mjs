// Historico das RODADAS de curadoria do Claude schedule (routine sonnet).
//
// A routine nao roda como GitHub Action: ela cura os pendentes e COMMITA
// direto na main, autor "Claude", mensagem "news: curadoria automatica via
// routine sonnet (N itens, ...)". Cada commit desses e uma rodada. Aqui a gente
// lista essas rodadas (igual a aba Runs lista runs do publish) e, ao abrir uma,
// mostra o que ELA salvou: os itens que entraram no index naquele commit,
// hidratados com titulo PT/tags como estavam na epoca. READ-ONLY (so git log).

import { execFileSync } from "node:child_process";
import path from "node:path";

const SERVE_ROOT = path.resolve(process.env.MOCK_SERVE_ROOT || process.cwd());
const AUTHOR = "Claude";
const GREP = "curadoria automatica";
const INDEX_REL = "media/news/index.json";

function git(...args) {
  return execFileSync("git", args, {
    cwd: SERVE_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// fetch leve pra pegar commits novos da routine mesmo com o HEAD local atras
// (o launcher sincroniza so media/news, nao move o HEAD).
function fetchQuiet() {
  try { git("fetch", "origin", "main", "--quiet"); return true; } catch { return false; }
}
function baseRef() {
  try { git("rev-parse", "--verify", "origin/main"); return "origin/main"; } catch { return "HEAD"; }
}

function kindOf(item) {
  const id = item.id || "";
  if (item.kind === "community-spotlight" || id.startsWith("cs-")) return "spotlight";
  if (item.kind === "community-digest" || id.startsWith("cd-")) return "digest";
  return "regular";
}

// ids que ENTRARAM no index naquele commit (linhas "+ "id": "x"" do diff).
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

// Lista as ultimas N rodadas de curadoria.
export function listCurationRuns(limit = 10) {
  fetchQuiet();
  const ref = baseRef();
  let out = "";
  try {
    out = git("log", ref, `--author=${AUTHOR}`, `--grep=${GREP}`,
      "--format=%H|%aI|%s", `-${limit}`);
  } catch { return []; }

  return out.split(/\r?\n/).filter(Boolean).map((line) => {
    const [hash, dateIso, ...rest] = line.split("|");
    const subject = rest.join("|");
    const mTotal = subject.match(/\((\d+)\s+itens/);
    const ids = newIdsIn(hash);
    return {
      hash,
      shortHash: hash.slice(0, 7),
      date: dateIso,
      indexTotal: mTotal ? Number(mTotal[1]) : null, // tamanho do index (TOP-N)
      newCount: ids.length,                          // o que de fato entrou
    };
  });
}

// Detalhe de uma rodada: os itens novos, hidratados com o index COMO ESTAVA
// naquele commit (pega titulo/intro/tags da epoca, robusto a arquivamento).
export function curationRunDetail(hash) {
  const ids = newIdsIn(hash);
  let indexAtCommit = { items: [] };
  try { indexAtCommit = JSON.parse(git("show", `${hash}:${INDEX_REL}`)); } catch {}
  const byId = new Map((indexAtCommit.items || []).map((x) => [x.id, x]));

  const items = ids.map((id) => {
    const it = byId.get(id) || { id };
    return {
      id,
      kind: kindOf(it),
      title: it.title_ig || it.title_pt || it.titulo_pt || id,
      intro: it.intro_pt || "",
      tags: it.tags || [],
      img: it.img || null,
      source: it.sourceLabel || null,
      pubDate: it.pubDate || null,
    };
  });

  let subject = "";
  try { subject = git("show", "-s", "--format=%s", hash).trim(); } catch {}
  return { hash, shortHash: hash.slice(0, 7), subject, items, newCount: items.length };
}
