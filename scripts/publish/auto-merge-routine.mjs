// Auto-merge dos branches da routine de curadoria (`claude/news-routine-*`). A routine roda num sandbox
// que não deixa dar push na main, então empurra um branch; o publish-instagram.yml chama este script
// a cada run: valida, abre PR, mescla (ou aplica arquivo a arquivo se conflitar) e avisa no Telegram.
// Segurança (repo PÚBLICO), em scripts/publish/routine/validar.mjs: todo commit do branch precisa de
// committer.login na lista branca (não forjável) e o diff só pode tocar media/news/. Dano máximo se
// passar: notícia falsa no @smufdpj, nada de infra. Workflow precisa de contents e pull-requests: write.
import { BRANCH_PREFIX, REPO, shTry, listRoutineBranches } from "./routine/git-gh.mjs";
import { validateBranch } from "./routine/validar.mjs";
import { extractItemsFromBranch, extractRecusados, buildPrBody, buildTelegramMsg } from "./routine/mensagens.mjs";
import { applyBranchDirectly } from "./routine/aplicar.mjs";
import fs from "node:fs/promises";
import { enviarTelegram } from "../lib/telegram.mjs";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(text) {
  await enviarTelegram(text, { prefixo: "[auto-merge]", token: TG_TOKEN, chat: TG_CHAT });
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

  const recusados = extractRecusados(branch, v.files);
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
      // Empurra o commit do apply direto pra main ANTES de fechar PR e deletar
      // branch. Sem isso o commit ficava so local e morria com o runner se o
      // run-publish seguinte saisse cedo (cooldown/dry-run/crash), perdendo a
      // curadoria de vez (branch ja deletado). Com push conflitado, aborta o
      // rebase e re-tenta; se esgotar, PRESERVA o branch e o PR pra proxima run.
      let pushed = false;
      for (let i = 0; i < 3; i++) {
        const pull = shTry(`git pull origin main --rebase --autostash`);
        if (!pull.ok) shTry(`git rebase --abort`);
        const push = shTry(`git push origin HEAD:main`);
        if (push.ok) { pushed = true; break; }
        console.warn(`  push do apply direto falhou (try ${i + 1}/3): ${push.err}`);
      }
      if (!pushed) {
        console.error(`  ERRO: push do apply direto de ${branch} falhou; branch e PR preservados pra retry`);
        return { branch, prNum, error: "push do apply direto falhou" };
      }
      // So agora, com o commit ja em main, fecha PR e deleta o branch
      shTry(`gh pr close ${prNum} --comment "Mesclado via apply direto (conflito de JSON resolvido). Commit em main." -R ${REPO}`);
      shTry(`git push origin --delete ${branch}`);
      console.log(`  PR #${prNum} fechado, branch deletado, apply pusheado OK`);
    } else {
      console.error(`  ERRO mesclando PR #${prNum}: ${merge.err}`);
      return { branch, prNum, error: merge.err };
    }
  } else {
    console.log(`  PR #${prNum} mesclado, branch deletado`);
  }

  await notifyTelegram(buildTelegramMsg(items, prNum, branch, recusados));

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
      const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await notifyTelegram(`⚠️ auto-merge: ${esc(b)} não entrou (${esc(e.message.slice(0, 300))})`);
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
