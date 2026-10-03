// Plano B quando o PR conflita: aplica o branch arquivo a arquivo, mesclando JSON de lista por id.
import fs from "node:fs/promises";
import { sh, shTry } from "./git-gh.mjs";

// Aplica arquivos do branch diretamente quando gh pr merge falha por conflito.
// Para JSONs de lista (index, queue, archives): faz merge por id (union).
// Para demais arquivos: aplica a versao do branch.
// Desfaz o que o apply direto já aplicou no working tree (volta media/news pro HEAD).
export function descartarApply() {
  shTry("git reset -q HEAD -- media/news/");
  shTry("git checkout -- media/news/");
  shTry("git clean -fdq media/news/");
}

export async function applyBranchDirectly(branch, files) {
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
      // Main ou branch ilegível: PARA (o PR fica aberto pra próxima run). Antes caía pra versão
      // do branch, que pode ser antiga e apagar postedAt da main (repost no feed).
      let branchDoc, mainDoc;
      try {
        branchDoc = JSON.parse(sh(`git show "origin/${branch}:${f}"`));
        mainDoc = JSON.parse(await fs.readFile(f, "utf8"));
      } catch (e) {
        descartarApply();
        throw new Error(`apply direto abortado: ${f} ilegível (${e.message}); PR preservado`);
      }
      try {
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
        descartarApply();
        throw new Error(`apply direto abortado ao mesclar ${f}: ${e.message}; PR preservado`);
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
