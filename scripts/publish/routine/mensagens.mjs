// Itens, recusados, corpo do PR e mensagem do Telegram de cada branch mesclado.
import { sh } from "./git-gh.mjs";
import { linkNoticia } from "../../config.mjs";

export function extractItemsFromBranch(branch, files) {
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

// Notícias que a trava de qualidade (scripts/news/qualidade-ptbr.mjs) barrou
// nesta rodada: entradas novas em _rejected-curated.json com motivo "trava...".
export function extractRecusados(branch, files) {
  const f = "media/news/_rejected-curated.json";
  if (!files.includes(f)) return [];
  const ler = (ref) => { try { return JSON.parse(sh(`git show "${ref}:${f}"`)).rejected || []; } catch { return []; } };
  const antes = new Set(ler("origin/main").map((r) => `${r.id}|${r.at}`));
  return ler(`origin/${branch}`).filter((r) => String(r.reason || "").startsWith("trava") && !antes.has(`${r.id}|${r.at}`));
}

export function buildPrBody(commitMsg, items, branch, commits) {
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
      lines.push(`  - \`${it.id}\` · ${linkNoticia(it.id)}`);
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

export function buildTelegramMsg(items, prNum, branch, recusados = []) {
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
    lines.push(`   ↳ ${linkNoticia(it.id)}`);
    lines.push("");
  }

  if (recusados.length) {
    const esc = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    lines.push(`⚠️ <b>${recusados.length} barrada(s) pela trava de qualidade</b> (voltam pra fila, a próxima rodada reescreve):`);
    for (const r of recusados) lines.push(`• ${esc(r.titulo || r.id)}: ${esc(r.reason)}`);
  }

  return lines.join("\n");
}
