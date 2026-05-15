// Auto-merge de branches da Claude routine remota (`claude/news-routine-*`).
//
// Contexto:
//   A routine Sonnet roda em sandbox da Anthropic Cloud com proxy de rede
//   que bloqueia git push em main (HTTP 403 em receive-pack) e onde o
//   GitHub MCP requer OAuth interativo (impossivel em modo cron). O fluxo
//   que funciona pra ela e push em branch. Este script (chamado pelo
//   publish-instagram.yml a cada 30min) detecta esses branches, valida
//   rigorosamente, abre PR, mescla e notifica Telegram.
//
// Seguranca (repo PUBLICO):
//   1. Validacao de path: branch so pode tocar em `media/news/`. Nenhum
//      arquivo fora disso (workflows, scripts, infra) e aceito.
//   2. Validacao via GitHub API por `committer.login` (NAO author.name no
//      commit, que e forjavel). committer.login so e populado pelo GitHub
//      quando o email do commit esta verificado na conta GitHub correspondente,
//      entao "claude" so aparece para commits realmente feitos pela conta
//      @claude da Anthropic. Whitelist: claude, andrehz4, terra-gentil.
//   3. TODOS os commits do branch sao validados (HEAD..base), nao apenas o
//      ultimo, pra evitar injecao no meio do branch.
//   4. Dano maximo se passar: noticia falsa no @smufdpj (nada de infra).
//
// Permissions requeridas no workflow:
//   contents: write
//   pull-requests: write
//
// Env opcional:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (notif pos-merge)

import { execSync } from "node:child_process";
import fs from "node:fs/promises";

const REPO = process.env.GITHUB_REPOSITORY || "andrehz4/setlists-pj-ev";
const BRANCH_PREFIX = "claude/news-routine-";
const ALLOWED_PATH_PREFIX = "media/news/";
// Logins do GitHub autorizados a deixar commits que serao auto-mesclados.
// "claude" e a conta oficial @claude da Anthropic (so populada via email
// verificado noreply@anthropic.com). andrehz4 e terra-gentil sao as contas
// do dono, pra permitir operacao manual.
const ALLOWED_COMMITTER_LOGINS = new Set(["claude", "andrehz4", "terra-gentil"]);

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}
function shTry(cmd) {
  try { return { ok: true, out: sh(cmd) }; }
  catch (e) {
    return { ok: false, err: (e.stderr ? e.stderr.toString() : "") || e.message };
  }
}

async function listRoutineBranches() {
  const out = sh(`gh api "/repos/${REPO}/branches?per_page=100" --jq '.[].name'`);
  return out.split("\n").map((s) => s.trim()).filter((b) => b.startsWith(BRANCH_PREFIX));
}

function getCommitsToValidate(branch) {
  // Lista todos os commits em origin/<branch> que ainda nao estao em origin/main.
  // Esses sao os commits novos que serao mesclados.
  const out = sh(`git log --reverse --pretty=format:%H origin/main..origin/${branch}`);
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

function getCommitterLogin(sha) {
  // GitHub API retorna committer.login com o login do user GitHub correspondente
  // ao email do commit, SO se esse email estiver verificado naquela conta.
  // Email forjado retorna null. Essa e a validacao nao-forjavel.
  const out = shTry(`gh api "/repos/${REPO}/commits/${sha}" --jq '.committer.login // empty'`);
  if (!out.ok) return null;
  return out.out.trim() || null;
}

function validateBranch(branch) {
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

function extractItemsFromBranch(branch, files) {
  const items = [];
  for (const f of files) {
    const m = f.match(/^media\/news\/items\/([a-z0-9-]+)\.json$/i);
    if (!m) continue;
    try {
      const raw = sh(`git show "origin/${branch}:${f}"`);
      const obj = JSON.parse(raw);
      items.push({
        id: m[1],
        titulo: obj.title_pt || obj.titulo_pt || "(sem titulo)",
        tags: Array.isArray(obj.tags) ? obj.tags : [],
      });
    } catch {}
  }
  return items;
}

function buildPrBody(commitMsg, items, branch, commits) {
  const lines = [];
  lines.push(`### Auto-merge de \`${branch}\``);
  lines.push("");
  lines.push("PR criado automaticamente pelo `publish-instagram.yml` (cron 30min) ao detectar branch deixado pela Claude routine remota.");
  lines.push("");
  lines.push("**Validacoes aplicadas:**");
  lines.push(`- ${commits.length} commit(s) inspecionados, todos com \`committer.login\` em whitelist (\`claude\`, \`andrehz4\`, \`terra-gentil\`)`);
  lines.push(`- Diff so toca em \`media/news/\` (nenhum arquivo de infra modificado)`);
  lines.push("");

  if (items.length > 0) {
    lines.push(`### ${items.length} ${items.length === 1 ? "noticia" : "noticias"} sobem pro feed`);
    lines.push("");
    for (const it of items) {
      const tags = it.tags.length ? `\`${it.tags.join("\` \`")}\`` : "";
      lines.push(`- **${it.titulo}** ${tags}`);
      lines.push(`  - \`${it.id}\` · https://setlists-pj-ev.pages.dev/n/${it.id}`);
    }
    lines.push("");
  }

  lines.push("### Commit original");
  lines.push("");
  lines.push("```");
  lines.push(commitMsg.trim().slice(0, 3500));
  lines.push("```");

  return lines.join("\n");
}

function buildTelegramMsg(items, prNum, branch) {
  const lines = [];
  lines.push(`📰 <b>Curadoria mesclada em main</b>`);
  lines.push(`<i>via auto-merge de <code>${branch}</code> (PR #${prNum})</i>`);
  lines.push("");
  lines.push(`<b>${items.length} ${items.length === 1 ? "noticia vai" : "noticias vao"} pro feed @smufdpj no proximo cron de publish-ig (:17 ou :47 UTC)</b>`);
  lines.push("");

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const titulo = it.titulo
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const tagsStr = it.tags.length ? `  tags: ${it.tags.join(", ")}` : "";
    lines.push(`${i + 1}. <b>${titulo}</b>`);
    lines.push(`   <code>${it.id}</code>${tagsStr}`);
    lines.push(`   ↳ https://setlists-pj-ev.pages.dev/n/${it.id}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function notifyTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) {
    console.log("[auto-merge] sem TELEGRAM_* envs, skip notif");
    return;
  }
  const truncated = text.length > 3900 ? text.slice(0, 3900) + "\n\n(truncado)" : text;
  const params = new URLSearchParams({
    chat_id: TG_CHAT,
    parse_mode: "HTML",
    disable_web_page_preview: "true",
    text: truncated,
  });
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await res.json();
    if (!json.ok) console.warn("[auto-merge] telegram falhou:", json);
    else console.log("[auto-merge] telegram OK");
  } catch (e) {
    console.warn("[auto-merge] telegram erro:", e.message);
  }
}

// Aplica arquivos do branch diretamente quando gh pr merge falha por conflito.
// Para JSONs de lista (index, queue, archives): faz merge por id (union).
// Para demais arquivos: aplica a versao do branch.
async function applyBranchDirectly(branch, files) {
  console.log(`  conflito detectado, aplicando branch arquivo a arquivo...`);

  const JSON_MERGE_PATHS = [
    "media/news/index.json",
    "media/news/_publish-queue.json",
  ];

  for (const f of files) {
    if (f.match(/^media\/news\/items\//)) {
      // Arquivo novo: aplica direto, sem conflito possivel
      shTry(`git checkout "origin/${branch}" -- "${f}"`);
      continue;
    }

    const isJsonMerge = JSON_MERGE_PATHS.includes(f) || f.match(/^media\/news\/archive\//);
    if (isJsonMerge) {
      try {
        const branchDoc = JSON.parse(sh(`git show "origin/${branch}:${f}"`));
        let mainDoc;
        try {
          mainDoc = JSON.parse(sh(`cat "${f}"`));
        } catch {
          mainDoc = branchDoc;
        }
        const mainIds = new Set((mainDoc.items || []).map((i) => i.id));
        const newItems = (branchDoc.items || []).filter((i) => !mainIds.has(i.id));
        if (newItems.length > 0) {
          mainDoc.items = [...(mainDoc.items || []), ...newItems];
          // propaga postCount se existir no branch
          if (branchDoc.postCount > (mainDoc.postCount || 0)) {
            mainDoc.postCount = branchDoc.postCount;
          }
          await fs.writeFile(f, JSON.stringify(mainDoc, null, 2) + "\n", "utf8");
          console.log(`    ${f}: +${newItems.length} items mergeados`);
        } else {
          console.log(`    ${f}: sem items novos, mantendo main`);
        }
      } catch (e) {
        console.warn(`    aviso ao mesclar ${f}: ${e.message}, usando versao do branch`);
        shTry(`git checkout "origin/${branch}" -- "${f}"`);
      }
      continue;
    }

    // Demais arquivos (seen.json, _pending.json, etc.): usa versao do branch
    shTry(`git checkout "origin/${branch}" -- "${f}"`);
  }

  const diff = shTry("git diff --cached --quiet");
  // git diff --cached nao detecta untracked, usa git status
  const status = sh("git status --porcelain media/news/").trim();
  if (!status) {
    console.log("  nada a commitar (apply direto sem mudancas)");
    return false;
  }
  sh("git add media/news/");
  sh(`git commit -m "news: apply direto de ${branch} (conflito resolvido via merge de JSON)"`);
  return true;
}

async function processBranch(branch) {
  console.log(`\n[auto-merge] >>> ${branch}`);
  const v = validateBranch(branch);
  if (!v.ok) {
    console.warn(`  SKIP: ${v.reason}`);
    return { branch, skipped: true, reason: v.reason };
  }
  console.log(`  ${v.commits.length} commit(s) validados, ${v.files.length} arquivo(s) em media/news/`);

  const items = extractItemsFromBranch(branch, v.files);
  console.log(`  ${items.length} items/<id>.json novo(s) no branch`);

  const dateSuffix = branch.replace(BRANCH_PREFIX, "");
  const title = `news: routine auto-merge ${dateSuffix} (${items.length} ${items.length === 1 ? "item" : "itens"})`;
  const body = buildPrBody(v.commitMsg, items, branch, v.commits);

  const bodyFile = `/tmp/pr-body-${dateSuffix}.md`;
  await fs.writeFile(bodyFile, body, "utf8");

  console.log(`  criando PR base=main head=${branch}...`);
  const prCreate = shTry(
    `gh pr create --base main --head ${branch} --title ${JSON.stringify(title)} --body-file ${bodyFile} -R ${REPO}`
  );

  if (!prCreate.ok && !/already exists/i.test(prCreate.err)) {
    console.error(`  ERRO criando PR: ${prCreate.err}`);
    return { branch, error: prCreate.err };
  }

  const prListRes = shTry(
    `gh pr list --head ${branch} --state open --json number,url -R ${REPO}`
  );
  if (!prListRes.ok) {
    console.error(`  ERRO listando PRs: ${prListRes.err}`);
    return { branch, error: prListRes.err };
  }
  const prs = JSON.parse(prListRes.out);
  if (prs.length === 0) {
    console.error(`  nenhum PR aberto pro head=${branch}`);
    return { branch, error: "PR nao encontrado" };
  }
  const prNum = prs[0].number;
  console.log(`  PR #${prNum} ${prs[0].url}`);

  const merge = shTry(`gh pr merge ${prNum} --merge --delete-branch -R ${REPO}`);

  if (!merge.ok) {
    if (/merge conflict/i.test(merge.err) || /conflict/i.test(merge.err)) {
      console.warn(`  conflito no PR #${prNum}, tentando apply direto...`);
      const applied = await applyBranchDirectly(branch, v.files);
      if (!applied) {
        return { branch, prNum, error: "apply direto sem mudancas" };
      }
      // fecha PR (conflito foi resolvido via commit direto em main)
      shTry(`gh pr close ${prNum} --comment "Mesclado via apply direto (conflito de JSON resolvido). Commit em main." -R ${REPO}`);
      shTry(`git push origin --delete ${branch}`);
      console.log(`  PR #${prNum} fechado, branch deletado, apply OK`);
    } else {
      console.error(`  ERRO mesclando PR #${prNum}: ${merge.err}`);
      return { branch, prNum, error: merge.err };
    }
  } else {
    console.log(`  PR #${prNum} mesclado, branch deletado`);
  }

  await notifyTelegram(buildTelegramMsg(items, prNum, branch));

  return { branch, prNum, items: items.length, ok: true };
}

async function main() {
  shTry(`git config user.name "pj-news-bot"`);
  shTry(`git config user.email "bot@setlists-pj.local"`);

  const branches = await listRoutineBranches();
  console.log(`[auto-merge] ${branches.length} branch(es) candidatas:`, branches);

  if (branches.length === 0) {
    console.log("[auto-merge] nada a fazer");
    return;
  }

  shTry(`git fetch origin main:refs/remotes/origin/main`);

  const results = [];
  for (const b of branches) {
    try {
      const r = await processBranch(b);
      results.push(r);
    } catch (e) {
      console.error(`[auto-merge] excecao processando ${b}:`, e.message);
      results.push({ branch: b, error: e.message });
    }
  }

  const merged = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => r.skipped).length;
  const errored = results.filter((r) => r.error).length;
  console.log(`\n[auto-merge] FIM: ${merged} mesclado(s), ${skipped} skipped, ${errored} com erro`);
}

main().catch((e) => {
  console.error("[auto-merge] FATAL:", e);
  process.exit(0); // notifica falha mas nao derruba o publish
});
