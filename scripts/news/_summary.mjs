// Helper pra escrever no painel "Summary" do GitHub Actions.
// Em CI, a env GITHUB_STEP_SUMMARY aponta pra um arquivo Markdown que
// e renderizado no topo da pagina do run. Local: no-op (so loga).
//
// Uso:
//   import { writeStepSummary } from "./_summary.mjs";
//   await writeStepSummary({
//     title: "News fetch",
//     meta: { curator: "routine", modo: "schedule", dry: false },
//     stats: { coletados: 4, curados: 0, pendentes: 4, skipped: 0 },
//     curated: [{ title_pt, sourceLabel, url }],
//     pending: [{ title, sourceLabel, url }],
//     extras: [{ heading: "...", body: "..." }],
//   });

import fs from "node:fs/promises";

function esc(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function shortTitle(s, n = 80) {
  const t = String(s ?? "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function fmtList(items, kind) {
  if (!items || items.length === 0) return "_nenhum_\n";
  const lines = items.map((it, i) => {
    const titulo = kind === "curated"
      ? (it.title_pt || it.title || "(sem titulo)")
      : (it.title || it.title_orig || it.post_title_orig || "(sem titulo)");
    const src = it.sourceLabel || it.source || "?";
    const link = it.url || it.community_post_url || "";
    const linha = link
      ? `${i + 1}. [${esc(shortTitle(titulo))}](${link}) — ${esc(src)}`
      : `${i + 1}. ${esc(shortTitle(titulo))} — ${esc(src)}`;
    return linha;
  });
  return lines.join("\n") + "\n";
}

function fmtStats(stats) {
  const entries = Object.entries(stats || {});
  if (entries.length === 0) return "";
  const head = "| " + entries.map(([k]) => esc(k)).join(" | ") + " |";
  const sep = "|" + entries.map(() => " --- ").join("|") + "|";
  const row = "| " + entries.map(([, v]) => esc(v)).join(" | ") + " |";
  return [head, sep, row, ""].join("\n");
}

function fmtMeta(meta) {
  if (!meta) return "";
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `**${esc(k)}:** ${esc(v)}`).join(" · ") + "\n\n";
}

export async function writeStepSummary({
  title,
  meta,
  stats,
  curated,
  pending,
  skipped,
  extras,
} = {}) {
  const out = [];
  if (title) out.push(`## ${title}`, "");
  if (meta) out.push(fmtMeta(meta));
  if (stats) out.push(fmtStats(stats));

  if (curated && curated.length > 0) {
    out.push(`### Publicados agora (${curated.length})`, "", fmtList(curated, "curated"));
  }
  if (pending && pending.length > 0) {
    out.push(`### Pendentes pra routine (${pending.length})`, "", fmtList(pending, "pending"));
  }
  if (skipped && skipped.length > 0) {
    out.push(`### Skipped (${skipped.length})`, "", fmtList(skipped, "skipped"));
  }
  if (extras && extras.length > 0) {
    for (const ex of extras) {
      if (ex.heading) out.push(`### ${ex.heading}`, "");
      if (ex.body) out.push(ex.body, "");
    }
  }
  out.push("");

  const md = out.join("\n");
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (target) {
    try {
      await fs.appendFile(target, md);
    } catch (e) {
      console.warn(`[summary] falha ao escrever em GITHUB_STEP_SUMMARY: ${e.message}`);
    }
  } else {
    // Local: imprime o Markdown pra o dev ver o que iria pro Summary
    console.log("\n----- step summary (preview local) -----");
    console.log(md);
    console.log("----- fim summary -----\n");
  }
}
