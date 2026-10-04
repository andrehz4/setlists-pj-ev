// Story de aviso dos shows de HOJE, um por estado ("Alô, pessoal do RJ!"). Workflow agenda-story.yml.
// Só publica com AGENDA_PUBLICAR=1 (variável do repo); sem ela, gera as artes e mostra o que sairia.
// Imagem: R2 (apaga em 3 dias) ou, sem R2, commit em media/agenda/stories/ e o IG baixa do raw.
// Flags: --dry-run, --no-git. Idempotente por dia+estado (media/agenda/_story-log.json).
import fs from "node:fs/promises";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram } from "../../lib/telegram.mjs";
import { diaBRT } from "../../lib/brt.mjs";
import { publicarViaR2 } from "../../publish/midia-r2.mjs";
import { publishImageStory } from "../../publish/instagram.mjs";
import { getCurrentCycleColor } from "../../publish/color-cycle.mjs";
import { readQueue } from "../../publish/queue.mjs";
import { showsDoDiaPorUf, contasDoShow } from "./regiao.mjs";
import { gerarArteStory } from "./arte-story.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const PUBLICAR = process.env.AGENDA_PUBLICAR === "1" && !DRY;
const LOG = naRaiz("media/agenda/_story-log.json");
const PASTA = naRaiz("media/agenda/stories");
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

async function urlPublica(arquivo, nome) {
  const r2 = await publicarViaR2(arquivo, `stories/${nome}`);
  if (r2) return r2;
  await commitAndPush(["media/agenda/stories/"], `agenda: arte do story ${nome}`, { dry: NO_GIT });
  return `${REPO}/media/agenda/stories/${nome}`;
}

async function main() {
  const dia = process.env.AGENDA_DIA || diaBRT();
  const { shows } = await lerEstado(naRaiz("media/agenda/shows.json"), { shows: [] });
  const log = await lerEstado(LOG, { entradas: [] });
  const grupos = showsDoDiaPorUf(shows, dia);
  console.log(`[agenda-story] ${dia}: ${grupos.length} estado(s) com show | publicar=${PUBLICAR}`);
  if (!grupos.length) return;
  await fs.mkdir(PASTA, { recursive: true });
  const cor = getCurrentCycleColor((await readQueue()).postCount);
  const feitos = [];
  for (const [uf, lista] of grupos) {
    if (log.entradas.some((e) => e.dia === dia && e.uf === uf && e.postId)) { console.log(`[agenda-story] ${uf} já publicado`); continue; }
    const nome = `agenda-${dia}-${uf}.jpg`;
    const arquivo = path.join(PASTA, nome);
    await gerarArteStory(uf, lista, arquivo, cor);
    const contas = [...new Set(lista.flatMap(contasDoShow))];
    console.log(`[agenda-story] ${uf}: ${lista.map((s) => s.nome).join(", ")} | marcar ${contas.join(", ")}`);
    if (!PUBLICAR) continue;
    const imageUrl = await urlPublica(arquivo, nome);
    const r = await publishImageStory({ imageUrl, contas });
    console.log(`[agenda-story] ${uf} OK postId=${r.postId} marcou=${r.marcou}`);
    log.entradas.push({ dia, uf, postId: r.postId, marcou: r.marcou, shows: lista.map((s) => s.id), em: new Date().toISOString() });
    feitos.push(`${uf} (${lista.map((s) => s.nome).join(", ")})${r.marcou ? "" : ", sem marcação"}`);
  }
  if (!feitos.length) return;
  log.entradas = log.entradas.slice(-120);
  await gravarEstado(LOG, log);
  await commitAndPush(["media/agenda/_story-log.json"], `agenda: story do dia ${dia} (${feitos.length})`, { dry: NO_GIT });
  await enviarTelegram(`📣 <b>Story da agenda publicado</b>\n\n${feitos.map((f) => `• ${f}`).join("\n")}`, { prefixo: "[agenda-story]" });
}

main().catch((e) => {
  console.error("[agenda-story] FATAL:", e);
  process.exit(1);
});
